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

1. Tag the commit with a semver tag: `git tag v1.0.0 && git push origin v1.0.0`
2. Create a GitHub release from the tag (or use `gh release create v1.0.0`).
3. The **Release** workflow builds and pushes `kixvault-api` and `kixvault-web` images to GHCR, tagged with:
   - The full version (`1.0.0`)
   - Major.minor (`1.0`)
   - `latest`

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
    image: ghcr.io/zendamacf/kixvault-api:${KIXVAULT_VERSION:-latest}
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-kixvault}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB:-kixvault}
      KICKSDB_API_KEY: ${KICKSDB_API_KEY}
      SENTRY_RELEASE: ${SENTRY_RELEASE:-}
      NODE_ENV: production
      PORT: 3000
    depends_on:
      db:
        condition: service_healthy

  web:
    image: ghcr.io/zendamacf/kixvault-web:${KIXVAULT_VERSION:-latest}
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
# Version — pin to a release tag or use "latest"
KIXVAULT_VERSION=latest

# Caddy
DOMAIN=example.com
ACME_EMAIL=you@example.com

# PostgreSQL
POSTGRES_USER=kixvault
POSTGRES_PASSWORD=change-me-to-a-strong-password
POSTGRES_DB=kixvault

# API
KICKSDB_API_KEY=KICKS-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Sentry (optional)
SENTRY_RELEASE=
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
# Pull a specific version
KIXVAULT_VERSION=1.2.0 docker compose pull api web

# Or pull latest
docker compose pull api web

# Recreate with new images
docker compose up -d
```

To pin a specific version permanently, update `KIXVAULT_VERSION` in `.env` and run:

```sh
docker compose pull api web && docker compose up -d
```
