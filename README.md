# KixVault

Built for Sneaker Collectors.

## Stack

- **Frontend:** Vite + React (`apps/web`)
- **Backend:** Hono on Bun (`apps/api`)
- **Database:** PostgreSQL 18 + Drizzle (`packages/db`)
- **Shared types/schemas:** `packages/shared`
- **Tooling:** Bun workspaces, Biome, TypeScript project references

## Getting started

```bash
# Install dependencies
bun install

# Lint and format
bun run check

# Typecheck all packages
bun run typecheck

# Run API (requires .env with DATABASE_URL)
bun run --cwd apps/api dev

# Run web (port 5173, proxies /api to API)
bun run --cwd apps/web dev
```

## Frontend

The web app uses TanStack Router, TanStack Query, Tailwind CSS, and a typed Hono RPC client (`hc<AppType>`).

Protected routes redirect to `/login` when no session cookie is present.

The dashboard shows collection stats (total pairs, spend, average per pair), debounced brand search, condition filters, sorting, loading skeletons, and distinct empty states for an empty vault vs. no filter matches.

## API

Auth uses Lucia with httpOnly session cookies. All sneaker routes require a valid session.

The API exports `AppType` from `apps/api/src/app.ts` for a typed Hono RPC client (`hc`) in the frontend.

## Production (Docker Compose)

Deploy the full stack — PostgreSQL 18, API, static web, and Caddy reverse proxy — with:

```bash
cp .env.prod.example .env
# Set POSTGRES_PASSWORD (required) and DOMAIN for your VPS

bun run prod:up
```

| Service | Role |
|---------|------|
| `db` | PostgreSQL 18 |
| `api` | Hono API on Bun (runs migrations on startup) |
| `web` | Nginx serving the Vite production build |
| `caddy` | Reverse proxy — `/api/*` → API, everything else → web |

Open `http://localhost` (or your `DOMAIN`). Caddy obtains HTTPS automatically when `DOMAIN` is a public hostname and `ACME_EMAIL` is set.

```bash
bun run prod:logs   # follow logs
bun run prod:down   # stop stack
```

## Database

Local development uses PostgreSQL 18 via Docker Compose.

```bash
# Copy env template and adjust if needed
cp .env.dev.example .env

# Start Postgres 18
bun run dev:up

# Apply migrations
bun run db:migrate
```

After changing the schema in `packages/db/src/schema.ts`:

```bash
bun run db:generate   # create a new migration
bun run db:migrate    # apply it
```

Default connection string in [.env.dev.example](.env.dev.example).

## Monorepo layout

```
apps/
  api/     Hono API server
  web/     Vite React SPA
packages/
  db/      Drizzle schema, client, and migrations
  shared/  Zod schemas and shared types
```

## Schema

| Table | Purpose |
|-------|---------|
| `users` | Account credentials (Lucia auth) |
| `sessions` | Active login sessions |
| `sneakers` | Collection entries per user |
