# Deployment

## Docker Compose

Create a deployment directory and add two files: `docker-compose.yml` and `.env`.

### `docker-compose.yml`

```yaml
services:
  db:
    image: postgres:18-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-kixvault}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}
      POSTGRES_DB: ${POSTGRES_DB:-kixvault}
    volumes:
      - kixvault_pgdata:/var/lib/postgresql
    healthcheck:
      test:
        [
          "CMD-SHELL",
          "pg_isready -U ${POSTGRES_USER:-kixvault} -d ${POSTGRES_DB:-kixvault}",
        ]
      interval: 5s
      timeout: 5s
      retries: 10

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  api:
    image: ghcr.io/zendamacf/kixvault-api:${API_VERSION:-latest}
    restart: unless-stopped
    ports:
      - "${API_PORT:-3000}:3000"
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-kixvault}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB:-kixvault}
      KICKSDB_API_KEY: ${KICKSDB_API_KEY}
      REDIS_URL: ${REDIS_URL:?REDIS_URL is required}
      SIGNUPS_ENABLED: ${SIGNUPS_ENABLED:-false}
      RESEND_API_KEY: ${RESEND_API_KEY:-}
      EMAIL_FROM: ${EMAIL_FROM:-KixVault <noreply@yourdomain.com>}
      APP_URL: ${APP_URL:-}
      LOG_LEVEL: ${LOG_LEVEL:-info}
      NODE_ENV: production
      PORT: 3000
      IMAGE_STORAGE_PATH: /data/images
      IMAGE_PUBLIC_BASE_PATH: /api/images
    volumes:
      - kixvault_images:/data/images
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy

  jobs:
    image: ghcr.io/zendamacf/kixvault-api:${API_VERSION:-latest}
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-kixvault}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB:-kixvault}
      KICKSDB_API_KEY: ${KICKSDB_API_KEY}
      JOB_SCHEDULE: ${JOB_SCHEDULE:-0 3 * * 0}
      OPENEXCHANGERATES_APP_ID: ${OPENEXCHANGERATES_APP_ID:-}
      EXCHANGE_RATES_SCHEDULE: ${EXCHANGE_RATES_SCHEDULE:-0 4 * * *}
      PRICING_REFRESH_DELAY_MS: ${PRICING_REFRESH_DELAY_MS:-500}
      IMAGE_STORAGE_PATH: /data/images
      IMAGE_PUBLIC_BASE_PATH: /api/images
      IMAGE_MAX_WIDTH: ${IMAGE_MAX_WIDTH:-1024}
      IMAGE_WORKER_POLL_MS: ${IMAGE_WORKER_POLL_MS:-30000}
      LOG_LEVEL: ${LOG_LEVEL:-info}
      NODE_ENV: production
    volumes:
      - kixvault_images:/data/images
    entrypoint: ["bun", "apps/api/dist/jobs/run-jobs.js"]
    depends_on:
      db:
        condition: service_healthy

  web:
    image: ghcr.io/zendamacf/kixvault-web:${WEB_VERSION:-latest}
    restart: unless-stopped
    ports:
      - "${WEB_PORT:-8080}:80"
    environment:
      UMAMI_WEBSITE_ID: ${UMAMI_WEBSITE_ID:-}
      UMAMI_DOMAIN: ${UMAMI_DOMAIN:-}
      UMAMI_SCRIPT_URL: ${UMAMI_SCRIPT_URL:-}

volumes:
  kixvault_pgdata:
  kixvault_images:
```

### `.env`

```sh
# Versions — pin to a release version or use "latest"
API_VERSION=latest
WEB_VERSION=latest

# Published ports
API_PORT=3000
WEB_PORT=8080

# PostgreSQL
POSTGRES_USER=kixvault
POSTGRES_PASSWORD=change-me-to-a-strong-password
POSTGRES_DB=kixvault

# API
KICKSDB_API_KEY=KICKS-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Caching and rate limiting (shared Redis state across API replicas)
REDIS_URL=redis://redis:6379

# API logging (silent disables request logs)
LOG_LEVEL=info

# Scheduler (optional — weekly catalog price refresh)
JOB_SCHEDULE=0 3 * * 0
# Optional: enables non-USD display currencies (free plan is enough)
OPENEXCHANGERATES_APP_ID=
PRICING_REFRESH_DELAY_MS=500

# Local sneaker image storage (Docker volume mounted at /data/images)
IMAGE_STORAGE_PATH=/data/images
IMAGE_PUBLIC_BASE_PATH=/api/images
IMAGE_MAX_WIDTH=1024

# Feature flags
SIGNUPS_ENABLED=true

# Email (optional, see "Email" below)
RESEND_API_KEY=
EMAIL_FROM=KixVault <noreply@yourdomain.com>
APP_URL=https://kixvault.yourdomain.com
```

## Email

KixVault sends email through [Resend](https://resend.com). Set these on the `api` service:

| Variable         | Purpose                                                                                         |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| `RESEND_API_KEY` | Resend API key. Leave empty to turn email off.                                                  |
| `EMAIL_FROM`     | Sender, for example `KixVault <noreply@yourdomain.com>`. The domain must be verified in Resend. |
| `APP_URL`        | Public URL of the web app, without a trailing slash. Used for links in emails.                  |

When `RESEND_API_KEY` is set, new accounts must confirm their email address before they can sign in. The link works once and expires after 24 hours. Existing accounts count as confirmed.

When `RESEND_API_KEY` is empty, emails are written to the API log instead of being sent, and new accounts can sign in at once. This is the default for local development.

## Umami analytics (optional)

Set `UMAMI_WEBSITE_ID` and `UMAMI_DOMAIN` on the `web` service to enable [Umami](https://umami.is/docs) pageviews and product events. Use `UMAMI_SCRIPT_URL` only if your tracker is not at `{UMAMI_DOMAIN}/script.js`. Omit these variables to disable analytics.

## Background jobs

The `jobs` service uses the API image and runs the background jobs in one process, separate from the API:

- **Scheduler:** the weekly pricing refresh, via `croner`. Default schedule: Sunday 03:00 UTC (`JOB_SCHEDULE=0 3 * * 0`). It also refreshes exchange rates (see below).
- **Image worker:** see [Image worker](#image-worker).

It does not run database migrations. Only the `api` service does that on startup. Run one `jobs` container only, or the jobs run more than once.

Locally, run `bun run --cwd apps/api dev:jobs`.

### Exchange rates and display currency

Amounts are always stored in USD. Users can pick a display currency in Settings, and the web app converts using rates stored in the `exchange_rates` table. The `jobs` service refreshes them daily from [Open Exchange Rates](https://openexchangerates.org) (default 04:00 UTC, `EXCHANGE_RATES_SCHEDULE`) and once at startup when the table is empty or older than a day. The free plan is enough (USD base, about 30 requests a month).

Set `OPENEXCHANGERATES_APP_ID` on the `jobs` service. Without it no rates are stored and only USD can be selected.

Run a one-off refresh manually:

```sh
docker compose run --rm --entrypoint bun jobs apps/api/dist/jobs/pricing-refresh.js
```

## Image worker

The image worker in the `jobs` service downloads pending sneaker images, converts them to WebP with sharp, and stores them on the `kixvault_images` Docker volume. This keeps image fetching outside request paths and retries failed downloads.

Run a one-off image backfill manually:

```sh
docker compose run --rm --entrypoint bun api apps/api/dist/scripts/backfill-image-storage.js
```

Or locally:

```sh
bun run --cwd apps/api backfill:image-storage
```
