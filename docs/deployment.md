# Production Deployment

KixVault is deployed as pre-built Docker images pulled from the GitHub Container Registry (GHCR). A `docker-compose.yml` on the VPS orchestrates the full stack: PostgreSQL, API, web frontend, and Caddy reverse proxy.

## Prerequisites

- A VPS with Docker Engine and Docker Compose v2 installed.
- A domain name pointed at the VPS.
- Access to the GHCR images. If the repository is private, authenticate with a [personal access token](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry#authenticating-with-a-personal-access-token-classic) that has `read:packages` scope:
  ```sh
  echo "$GHCR_PAT" | docker login ghcr.io -u <github-username> --password-stdin
  ```

## GitHub Repository Settings

The following must be configured in the GitHub repository before creating a release:

**Secrets** (Settings > Secrets and variables > Actions > Secrets):

| Secret | Purpose |
|--------|---------|
| `SENTRY_AUTH_TOKEN` | Uploads source maps during the Docker image build |

## Creating a Release

Releases are driven by [changesets](https://github.com/changesets/changesets). Each PR that changes application behaviour should include a changeset file (created via `bun run changeset`).

1. Merge a PR that contains changeset files into `main`.
2. The **Release** workflow detects pending changesets and creates (or updates) a **"Version Packages"** PR that bumps versions in `package.json` and generates changelogs.
3. When the Version Packages PR is merged, the workflow runs again. This time there are no pending changesets, so it detects which apps had version bumps and builds only those Docker images.
4. Images are pushed to GHCR with version tags and `latest`:
   - `ghcr.io/zendamacf/kixvault-api:<version>` / `latest`
   - `ghcr.io/zendamacf/kixvault-web:<version>` / `latest`

API and web versions are independent -- a changeset that only touches `@kixvault/api` will only bump and rebuild the API image.

## VPS Setup

Create a deployment directory and add three files: `docker-compose.yml`, `.env`, and `Caddyfile`.

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

  api:
    image: ghcr.io/zendamacf/kixvault-api:${API_VERSION:-latest}
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-kixvault}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB:-kixvault}
      KICKSDB_API_KEY: ${KICKSDB_API_KEY}
      REDIS_URL: ${REDIS_URL:-}
      SIGNUPS_ENABLED: ${SIGNUPS_ENABLED:-false}
      LOG_LEVEL: ${LOG_LEVEL:-info}
      NODE_ENV: production
      PORT: 3000
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
        required: false

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
    entrypoint: ["bun", "apps/api/dist/jobs/run-scheduler.js"]
    depends_on:
      db:
        condition: service_healthy

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    profiles:
      - redis
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  web:
    image: ghcr.io/zendamacf/kixvault-web:${WEB_VERSION:-latest}
    restart: unless-stopped

  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    environment:
      DOMAIN: ${DOMAIN:-localhost}
      ACME_EMAIL: ${ACME_EMAIL:-}
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - kixvault_caddy_data:/data
      - kixvault_caddy_config:/config
    depends_on:
      - api
      - web
    healthcheck:
      test: ["CMD", "wget", "-q", "-O", "/dev/null", "http://localhost/"]
      interval: 5s
      timeout: 5s
      retries: 12

volumes:
  kixvault_pgdata:
  kixvault_caddy_data:
  kixvault_caddy_config:
```

### `.env`

```sh
# Versions — pin to a release version or use "latest"
API_VERSION=latest
WEB_VERSION=latest

# Caddy
DOMAIN=example.com
ACME_EMAIL=you@example.com

# PostgreSQL
POSTGRES_USER=kixvault
POSTGRES_PASSWORD=change-me-to-a-strong-password
POSTGRES_DB=kixvault

# API
KICKSDB_API_KEY=KICKS-xxxx-xxxx-xxxx-xxxxxxxxxxxx
# Optional — shared catalog search cache across API instances (start redis with: docker compose --profile redis up -d)
REDIS_URL=redis://redis:6379

SIGNUPS_ENABLED=true

# API logging (silent disables request logs)
LOG_LEVEL=info

# Scheduler (optional — weekly catalog price refresh)
JOB_SCHEDULE=0 3 * * 0
PRICING_REFRESH_DELAY_MS=500
```

### `Caddyfile`

```caddyfile
{$DOMAIN:localhost} {
	@api path /api/*
	handle @api {
		reverse_proxy api:3000
	}

	handle {
		reverse_proxy web:80
	}
}
```

## First Deploy

```sh
docker compose pull
docker compose up -d
```

The API container automatically waits for PostgreSQL to be ready and runs database migrations before starting.

## Updating

To deploy a new release:

```sh
# Pull latest images
docker compose pull api web scheduler

# Recreate with new images
docker compose up -d
```

To pin specific versions, update `API_VERSION` and/or `WEB_VERSION` in `.env` and run:

```sh
docker compose pull api web scheduler && docker compose up -d
```

## Scheduler

The `scheduler` service reuses the API image and runs the weekly pricing refresh job via `croner`. It does not run database migrations — only the `api` service does that on startup.

Default schedule: Sunday 03:00 UTC (`JOB_SCHEDULE=0 3 * * 0`).

Run a one-off refresh manually:

```sh
docker compose run --rm --entrypoint bun scheduler apps/api/dist/jobs/pricing-refresh.js
```
