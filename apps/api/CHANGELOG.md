# @kixvault/api

## 0.1.1

### Patch Changes

- 73a847f: Updated Redis to be required for deployment.
- 73a847f: Updated $0 pricing data to be treated as unavailable.
- 2dfcbc8: Remove remaining GOAT catalog support, including historic DB links and pricing data.
- Updated dependencies [2dfcbc8]
  - @kixvault/db@0.1.1
  - @kixvault/shared@0.1.1

## 0.1.0

### Minor Changes

- e2ddce9: Fetch sneaker images asynchronously after create/update, resize them with sharp, and store WebP files on the local image volume.
- c35d5f9: Add catalog market pricing foundation: product price cache, price storage on catalog sneaker creation, and enriched sneaker API responses.
- e8d5218: Add weekly pricing refresh scheduler: pricing refresh job, run tracking table, and dedicated Compose scheduler service.
- b497fc7: Add collection market value stats and per-sneaker price history from stored snapshots.
- 5cfb12d: Store catalog primary and gallery images when adding sneakers from StockX or GOAT, and add a backfill script for existing catalog-linked pairs.
- a3d34dc: Expose stored 360 gallery frames on sneaker API responses and via dedicated image routes.
- 4ab068a: Add an image storage backfill script and optional image worker service for processing pending sneaker image downloads.
- 37932c1: Add local sneaker image storage with a database schema, Docker volume support, and an image serve route that falls back to remote source URLs.
- cae80f0: Enforce a single primary image per sneaker (360 gallery frames remain separate), return `primaryImage` from the API instead of an `images` array, and serve stored primary images at `/api/images/:sneakerId`.
- 00d0a3a: Add a `sneaker_images` table and API support for storing multiple sneaker image URLs per pair.
- 0d58a95: Store StockX primary images as a one-to-one sneaker relationship and persist 360 gallery frames in a separate table for future animation support.

### Patch Changes

- d2b33aa: Preserve transparent backgrounds when fetching sneaker images by stripping StockX background CDN params, requesting imgix background removal, and retaining alpha during WebP conversion.
- 8fbfaad: Remove GOAT catalog search, product fetch, and pricing refresh paths while keeping existing GOAT-linked sneakers readable in the database.
- 8709445: Simplify catalog APIs and clients to StockX-only routes by removing marketplace parameters and GOAT CDN preconnect hints.
- 4f4deef: Updated market prices to display for all wear conditions.
- 9bb478a: Add lazy-loaded image carousels across the collection and sneaker views, and remove the deprecated sneaker `imageUrl` field from API responses.
- b572e5f: Fixed StockX fetching opaque URLs.
- Updated dependencies [c35d5f9]
- Updated dependencies [e8d5218]
- Updated dependencies [b497fc7]
- Updated dependencies [5cfb12d]
- Updated dependencies [37932c1]
- Updated dependencies [cae80f0]
- Updated dependencies [8fbfaad]
- Updated dependencies [8709445]
- Updated dependencies [00d0a3a]
- Updated dependencies [0d58a95]
  - @kixvault/db@0.1.0
  - @kixvault/shared@0.1.0

## 0.0.4

### Patch Changes

- 740e68f: Added plain-text API request logging with `X-Request-Id` propagation, authenticated user IDs, and `LOG_LEVEL` control.
- 76ea3f8: Delete API source map files from the production image after they are uploaded to Sentry.
- acb7c3a: Normalize catalog search cache keys and share cached result sets across different limits.
- c597b91: Cache catalog product fetches for 24 hours to reduce repeat KicksDB API calls.
- 839e39e: Add per-user rate limits on catalog search and from-catalog endpoints.
- fb804cc: Add optional Redis-backed shared cache for catalog search via `REDIS_URL`.
- 5116010: Reuse cached catalog search results when fetching a product before calling KicksDB.
- e852fac: Increase catalog search debounce to 2 seconds and require at least 3 characters before searching.
- 76ea3f8: Pass `SENTRY_AUTH_TOKEN` as a Docker BuildKit secret during image builds instead of a build arg.
- 6dd821b: Gate API Sentry initialization on production so local development does not report to Sentry.
- 02c04c0: Associate Sentry releases with the Git commit that produced each Docker image build.
- 88c5a8d: Attach authenticated user IDs to Sentry events in the API and web apps.
- 0df3308: Added `SIGNUPS_ENABLED` environment variable to allowing new users to sign themselves up.
- Updated dependencies [e852fac]
  - @kixvault/shared@0.0.2

## 0.0.3

### Patch Changes

- 0043e1c: Fix API Docker build sourcemap upload by installing CA certificates for sentry-cli TLS verification.

## 0.0.2

### Patch Changes

- f9512c4: Fix release workflow Docker builds by setting up Buildx before exporting GitHub Actions build cache.

## 0.0.1

### Patch Changes

- b788c21: Added smoke test for deployment by validating that the Docker Compose services are available.
- 8c22ab4: Added sneaker release dates & descriptions.
- f866576: Updated @hono/zod-validator from 0.7.6 to 0.8.0, @vitejs/plugin-react from 4.7.0 to 6.0.2, drizzle-orm from 0.44.7 to 0.45.2, lucide-react from 0.525.0 to 1.17.0, typescript from 5.9.3 to 6.0.3, vite from 7.3.6 to 8.0.16, zod from 3.25.76 to 4.4.3 (version-update:semver-major).
- 0c8af25: Adds changeset-driven release workflow that builds and pushes Docker images to GHCR.
- 054b653: Made purchase price optional.
- ddd5829: Added sneaker nicknames and dynamically built catalog URL.
- 054b653: Fixed tests truncating all tables in a development database.
- d352853: Added automated unit and integration tests.
- 610d838: Added searching for sneakers in StockX & GOAT via KicksDB integration.
- 77ee015: Initial MVP setup.
- 5a51b4d: Added `POST /api/sneakers/from-catalog` to re-fetch catalog product data server-side on create and moved manual create to `POST /api/sneakers/custom`.
- d945b27: Added test coverage with upload to Codecov.
- 50cbcb6: Set up Sentry integration.
- 610d838: Added searching across multiple fields using tsvector.
