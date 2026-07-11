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

## API

Auth uses Lucia with httpOnly session cookies. All sneaker routes require a valid session.

The API exports `AppType` from `apps/api/src/index.ts` for a typed Hono RPC client (`hc`) in the frontend.

## Database

Local development uses PostgreSQL 18 via Docker Compose.

```bash
# Copy env template and adjust if needed
cp .env.example .env

# Start Postgres 18
bun run db:up

# Apply migrations
bun run db:migrate

# Open Drizzle Studio (optional)
bun run db:studio
```

After changing the schema in `packages/db/src/schema.ts`:

```bash
bun run db:generate   # create a new migration
bun run db:migrate    # apply it
```

Default connection string (see `.env.example`):

```
postgresql://kixvault:kixvault@localhost:5432/kixvault
```

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
