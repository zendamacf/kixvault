# KixVault

Built for Sneaker Collectors.

## Stack

- **Frontend:** Vite + React (`apps/web`)
- **Backend:** Hono on Bun (`apps/api`)
- **Database package:** Drizzle (`packages/db`)
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

# Run API (port 3000)
bun run --cwd apps/api dev

# Run web (port 5173, proxies /api to API)
bun run --cwd apps/web dev
```

## Monorepo layout

```
apps/
  api/     Hono API server
  web/     Vite React SPA
packages/
  db/      Drizzle schema and client
  shared/  Zod schemas and shared types
```
