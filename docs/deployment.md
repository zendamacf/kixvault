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

  scheduler:
    image: ghcr.io/zendamacf/kixvault-api:${API_VERSION:-latest}
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-kixvault}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB:-kixvault}
      KICKSDB_API_KEY: ${KICKSDB_API_KEY}
      JOB_SCHEDULE: ${JOB_SCHEDULE:-0 3 * * 0}
      PRICING_REFRESH_DELAY_MS: ${PRICING_REFRESH_DELAY_MS:-500}
      LOG_LEVEL: ${LOG_LEVEL:-info}
      NODE_ENV: production
      IMAGE_STORAGE_PATH: /data/images
    volumes:
      - kixvault_images:/data/images
    entrypoint: ["bun", "apps/api/dist/jobs/run-scheduler.js"]
    depends_on:
      db:
        condition: service_healthy

  image-worker:
    image: ghcr.io/zendamacf/kixvault-api:${API_VERSION:-latest}
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-kixvault}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB:-kixvault}
      IMAGE_STORAGE_PATH: /data/images
      IMAGE_PUBLIC_BASE_PATH: /api/images
      IMAGE_MAX_WIDTH: ${IMAGE_MAX_WIDTH:-1024}
      IMAGE_WORKER_POLL_MS: ${IMAGE_WORKER_POLL_MS:-30000}
      LOG_LEVEL: ${LOG_LEVEL:-info}
      NODE_ENV: production
    volumes:
      - kixvault_images:/data/images
    entrypoint: ["bun", "apps/api/dist/jobs/run-image-worker.js"]
    depends_on:
      db:
        condition: service_healthy

  web:
    image: ghcr.io/zendamacf/kixvault-web:${WEB_VERSION:-latest}
    restart: unless-stopped
    ports:
      - "${WEB_PORT:-8080}:80"

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
PRICING_REFRESH_DELAY_MS=500

# Local sneaker image storage (Docker volume mounted at /data/images)
IMAGE_STORAGE_PATH=/data/images
IMAGE_PUBLIC_BASE_PATH=/api/images
IMAGE_MAX_WIDTH=1024

# Feature flags
SIGNUPS_ENABLED=true
```

## Umami analytics (optional)

The web app can send privacy-oriented pageview analytics to [Umami](https://umami.is/) (cloud or self-hosted). Values are baked into the static build at **image build time** (Vite `VITE_*` variables).

| Variable | Description |
| --- | --- |
| `VITE_UMAMI_WEBSITE_ID` | Website ID from your Umami dashboard (required to enable tracking). |
| `VITE_UMAMI_DOMAIN` | Origin of your Umami instance, without a trailing slash (e.g. `https://analytics.example.com`). The tracker loads `{domain}/script.js`. |
| `VITE_UMAMI_SCRIPT_URL` | Optional full script URL; use instead of `VITE_UMAMI_DOMAIN` when the script is not at `/script.js`. |

When these variables are unset, no tracker is loaded (default for local development and CI). If the visitor has **Do Not Track** or **Global Privacy Control** enabled, the tracker is not loaded.

**What is collected:** Umami records page URLs and basic visit metadata (referrer, browser/device class, country from IP on the Umami server). KixVault does not send custom events or user-identifying fields. Do not pass emails, usernames, or sneaker collection details into Umami.

**Custom web image with analytics:**

```sh
docker build -f apps/web/Dockerfile \
  --build-arg VITE_UMAMI_WEBSITE_ID=your-website-id \
  --build-arg VITE_UMAMI_DOMAIN=https://analytics.example.com \
  -t kixvault-web:local .
```

**Self-hosted Umami (optional)** — add a service alongside KixVault (see [Umami Docker docs](https://umami.is/docs/running-on-docker)):

```yaml
  umami:
    image: ghcr.io/umami-software/umami:postgresql-latest
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://umami:umami@db:5432/umami
      APP_SECRET: change-me-to-a-long-random-string
    depends_on:
      db:
        condition: service_healthy
```

Create a website in the Umami UI, then pass its ID and your public Umami URL via the build args above.

## Scheduler

The `scheduler` service reuses the API image and runs the weekly pricing refresh job via `croner`. It does not run database migrations — only the `api` service does that on startup.

Default schedule: Sunday 03:00 UTC (`JOB_SCHEDULE=0 3 * * 0`).

Run a one-off refresh manually:

```sh
docker compose run --rm --entrypoint bun scheduler apps/api/dist/jobs/pricing-refresh.js
```

## Image worker

The `image-worker` service downloads pending sneaker images, converts them to WebP with sharp, and stores them on the `kixvault_images` Docker volume. This keeps image fetching outside request paths and retries failed downloads.

Run a one-off image backfill manually:

```sh
docker compose run --rm --entrypoint bun api apps/api/dist/scripts/backfill-image-storage.js
```

Or locally:

```sh
bun run --cwd apps/api backfill:image-storage
```
