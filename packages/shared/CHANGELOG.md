# @kixvault/shared

## 0.1.3

### Patch Changes

- d3acb10: Updated @biomejs/biome from 2.5.10 to 2.5.11, @hono/zod-validator from 0.9.0 to 0.9.1, @sentry/bun from 10.71.0 to 10.73.0, @sentry/hono from 10.71.0 to 10.73.0, @sentry/cli from 3.6.2 to 3.7.0, @sentry/react from 10.71.0 to 10.73.0, @tanstack/react-query from 5.102.6 to 5.102.8, lucide-react from 1.34.0 to 1.39.0, react-hook-form from 7.86.0 to 7.87.0, shadcn from 4.19.0 to 4.20.1, zod from 4.4.3 to 4.5.4, @happy-dom/global-registrator from 20.11.8 to 20.13.2, @testing-library/react from 16.3.2 to 16.3.3, @vitejs/plugin-react from 6.1.0 to 6.1.1 (version-update:semver-minor).

## 0.1.2

### Patch Changes

- 6f8a9ca: Automatically remove pair from Grails when added to your Collection.

## 0.1.1

### Patch Changes

- 2dfcbc8: Remove remaining GOAT catalog support, including historic DB links and pricing data.

## 0.1.0

### Minor Changes

- c35d5f9: Add catalog market pricing foundation: product price cache, price storage on catalog sneaker creation, and enriched sneaker API responses.
- b497fc7: Add collection market value stats and per-sneaker price history from stored snapshots.
- 5cfb12d: Store catalog primary and gallery images when adding sneakers from StockX or GOAT, and add a backfill script for existing catalog-linked pairs.
- cae80f0: Enforce a single primary image per sneaker (360 gallery frames remain separate), return `primaryImage` from the API instead of an `images` array, and serve stored primary images at `/api/images/:sneakerId`.
- 00d0a3a: Add a `sneaker_images` table and API support for storing multiple sneaker image URLs per pair.
- 0d58a95: Store StockX primary images as a one-to-one sneaker relationship and persist 360 gallery frames in a separate table for future animation support.

### Patch Changes

- 8fbfaad: Remove GOAT catalog search, product fetch, and pricing refresh paths while keeping existing GOAT-linked sneakers readable in the database.
- 8709445: Simplify catalog APIs and clients to StockX-only routes by removing marketplace parameters and GOAT CDN preconnect hints.

## 0.0.2

### Patch Changes

- e852fac: Increase catalog search debounce to 2 seconds and require at least 3 characters before searching.

## 0.0.1

### Patch Changes

- 8c22ab4: Added sneaker release dates & descriptions.
- f866576: Updated @hono/zod-validator from 0.7.6 to 0.8.0, @vitejs/plugin-react from 4.7.0 to 6.0.2, drizzle-orm from 0.44.7 to 0.45.2, lucide-react from 0.525.0 to 1.17.0, typescript from 5.9.3 to 6.0.3, vite from 7.3.6 to 8.0.16, zod from 3.25.76 to 4.4.3 (version-update:semver-major).
- 054b653: Made purchase price optional.
- ddd5829: Added sneaker nicknames and dynamically built catalog URL.
- 0f87127: Added automated unit tests.
- 610d838: Added searching for sneakers in StockX & GOAT via KicksDB integration.
- 77ee015: Initial MVP setup.
- 5a51b4d: Added `POST /api/sneakers/from-catalog` to re-fetch catalog product data server-side on create and moved manual create to `POST /api/sneakers/custom`.
- d945b27: Added test coverage with upload to Codecov.
- 610d838: Added searching across multiple fields using tsvector.
