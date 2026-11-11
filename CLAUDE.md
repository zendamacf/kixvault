# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

KixVault is a sneaker-collection tracker: a Bun workspaces monorepo (`apps/api`, `apps/web`, `packages/db`, `packages/shared`) using Hono, Vite + React, Drizzle on PostgreSQL 18, Biome and TypeScript project references.

## Commands

There are no root `typecheck`/`test` scripts. Run scripts per package with `bun run --cwd <pkg> <script>`; CI does the same for `lint`, `typecheck` and `test:coverage` across all four packages.

```bash
bun install
bun run lint:fix                      # root: biome check --write (whole repo)
bun run --cwd apps/api lint           # per-package lint / typecheck
bun run --cwd apps/api typecheck      # tsc -b
bun run --cwd apps/web typecheck      # runs `tsr generate` first (TanStack Router codegen)

# Local infra + DB (copy .env.dev.example to .env first; Postgres on :5433, Redis on :6379)
bun run dev:up / dev:down / dev:logs
bun run db:generate                   # after editing packages/db/src/schema.ts
bun run db:migrate

# Run
bun run --cwd apps/api dev            # needs ../../.env
bun run --cwd apps/web dev            # :5173, proxies /api to the API
```

### Tests

- `apps/api`: `test:unit` (`src/lib`, `src/middleware`, `src/routes`, `src/jobs`) and `test:integration` (`src/integration`, needs `TEST_DATABASE_URL`). Run `bun run --cwd apps/api db:test:prepare` once to create the isolated test DB; integration tests never touch the dev DB.
- Single test file: `cd apps/api && bun test --isolate src/lib/pricing.unit.test.ts` (add `-t "name"` to filter). For integration, use `bun --env-file=../../.env test --isolate src/integration`.
- `apps/web`, `packages/shared`: `bun test` (web preloads `src/test/setup.ts`, which registers happy-dom). `packages/db`: `bun --env-file=../../.env test` (migration tests need the DB).
- Unit tests are named `*.unit.test.ts` and sit next to the source.

## Architecture

**End-to-end typing.** `apps/api/src/app.ts` builds one chained Hono app and exports `AppType`. The web app imports that type (`@kixvault/api` workspace dep) and uses `hc<AppType>` (`apps/web/src/lib/api.ts`), so route changes show up as web type errors. Keep route registration chained in `app.ts` or the inferred type breaks. Request/response Zod schemas live in `packages/shared` and are used by both sides (`@hono/zod-validator` on the API, forms on the web).

**API (`apps/api/src`).** `routes/` are thin Hono routers mounted under `/api/*`; `lib/` holds the logic (pricing, catalog, images, auth via Lucia with httpOnly session cookies, audit log, email); `middleware/` has request logging, locale, session and rate limiting (Redis-backed store in `lib/rate-limit-store.ts` when `REDIS_URL` is set). `lib/env.ts` is the single place env vars are read. All sneaker routes require a session. Sentry is only enabled when `NODE_ENV=production`, and events are scrubbed through `lib/redact.ts`.

**Background processes share the API image/codebase** but run as separate entrypoints in `src/jobs/`, not in the web server: `run-scheduler.ts` (croner, weekly catalog price refresh via the KicksDB SDK) and `run-image-worker.ts` (downloads sneaker images, converts to WebP with sharp, stores them on a volume; served by `/api/images`). Only the `api` container runs migrations on startup. See `docs/deployment.md` for the compose layout.

**Database (`packages/db`).** `src/schema.ts` is the Drizzle schema; migrations in `drizzle/` are generated with `db:generate` and applied with `db:migrate` — never hand-edit generated SQL/snapshots. The API imports the client/schema from `@kixvault/db`.

**Web (`apps/web`).** Vite + React 19, TanStack Router (file-based, routes in `src/routes/`, generated `routeTree.gen.ts` is not hand-edited), TanStack Query (`src/lib/queries.ts`), Tailwind v4. Components in `src/components/` must not import from routes. Protected routes redirect to `/login` when no session cookie exists. Runtime config comes from `public/runtime-config.js` (written by the container entrypoint), not build-time env.

Read `apps/web/README.md` before UI work. Key points:
- **i18n:** all user-facing copy goes through i18next (`src/i18n/locales/en.json`, US spelling); never concatenate translated fragments. `i18n.unit.test.ts` fails if a literal `t('key')` is missing from `en.json`. Emails have their own catalog at `apps/api/src/lib/email/locales/`.
- **Themes:** each colorway theme is registered in `src/components/theme/themes.ts` plus a `[data-theme]` token block in `src/index.css`; tests check they agree. Don't use the accent for small text; money uses `text-gain`/`text-loss`.
- `biome-a11y.unit.test.ts` enforces accessibility lint rules.

## Conventions

- Biome handles lint and formatting (`biome.json`); don't add ESLint/Prettier.
- Releases use Changesets (`bun run changeset`); user-facing changes to a package need a changeset. `main` is released via the `Release` workflow, and Dependabot PRs get changesets automatically.
- Activity-log behavior (what is recorded, 90-day window, no personal fields in the timeline) is documented in `docs/activity-log.md`; keep audit events free of notes and other personal data.

## Commit format

Conventional Commits, as seen in recent history: `type(scope): lowercase imperative summary (#PR)`, for example `feat(web): add price history chart with chart/table toggle (#137)`. Types in use: `feat`, `fix`, `chore` (`chore(deps): ...` for dependency bumps, `chore(docker): ...`), `docs`. Scope is the area (`web`, `api`, `auth`, `docker`, ...) and is optional. Reference the PR number in parentheses at the end. `Version Packages (#N)` is the Changesets release PR. Older history has unprefixed titles; new commits must use a type.
