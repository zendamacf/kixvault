# Production Deployment

KixVault is deployed as pre-built Docker images pulled from the GitHub Container Registry (GHCR). A `docker-compose.yml` on the VPS orchestrates the full stack: PostgreSQL, Redis, API, and web frontend. HTTP routing and TLS are handled by a shared [Traefik](https://traefik.io/) instance on the VPS (not maintained in this repository) via the external `traefik` Docker network.

## Prerequisites

- A VPS with Docker Engine and Docker Compose v2 installed.
- A shared Traefik stack with an external `traefik` Docker network.
- A domain name pointed at the VPS (configured in the Traefik stack).
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

Create a deployment directory and add two files: `docker-compose.yml` and `.env`.

The VPS must already have a `traefik` Docker network (created by the shared Traefik stack). API and web join that network so Traefik can reach them.

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
    networks:
      - default
      - traefik
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
    networks:
      - default
      - traefik
    ports:
      - "${WEB_PORT:-8080}:80"

networks:
  traefik:
    external: true

volumes:
  kixvault_pgdata:
  kixvault_images:
```

### `.env`

```sh
# Versions — pin to a release version or use "latest"
API_VERSION=latest
WEB_VERSION=latest

# Published ports (arbitrary host ports for Traefik or direct access)
API_PORT=3000
WEB_PORT=8080

# PostgreSQL
POSTGRES_USER=kixvault
POSTGRES_PASSWORD=change-me-to-a-strong-password
POSTGRES_DB=kixvault

# API
KICKSDB_API_KEY=KICKS-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Caching
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

## Traefik routing

Traefik is managed outside this repository. Configure the shared Traefik instance to route traffic to the `api` and `web` services on the `traefik` network:

- `/api/*` → `api:3000` (or `host.docker.internal:${API_PORT}` if routing via published ports)
- all other paths → `web:80` (or `host.docker.internal:${WEB_PORT}`)

The published `API_PORT` and `WEB_PORT` values are arbitrary; Traefik can target either the container names on the shared network or the host-mapped ports.

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
