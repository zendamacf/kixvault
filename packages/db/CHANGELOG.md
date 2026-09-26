# @kixvault/db

## 0.1.2

### Patch Changes

- 506c09a: Updated @biomejs/biome from 2.5.9 to 2.5.10, @sentry/bun from 10.70.0 to 10.71.0, @sentry/hono from 10.70.0 to 10.71.0, hono from 4.13.3 to 4.13.5, sharp from 0.35.3 to 0.35.4, @types/bun from 1.3.14 to 1.4.0, @sentry/react from 10.70.0 to 10.71.0, @tanstack/react-query from 5.101.4 to 5.102.6, @tanstack/react-router from 1.170.31 to 1.170.32, lucide-react from 1.33.0 to 1.34.0, react-hook-form from 7.85.0 to 7.86.0, shadcn from 4.18.0 to 4.19.0, @happy-dom/global-registrator from 20.11.6 to 20.11.8, @tanstack/router-cli from 1.167.32 to 1.167.33, @tanstack/router-plugin from 1.168.34 to 1.168.35, @types/react-dom from 19.2.4 to 19.2.5 (version-update:semver-minor).

## 0.1.1

### Patch Changes

- 2dfcbc8: Remove remaining GOAT catalog support, including historic DB links and pricing data.

## 0.1.0

### Minor Changes

- c35d5f9: Add catalog market pricing foundation: product price cache, price storage on catalog sneaker creation, and enriched sneaker API responses.
- e8d5218: Add weekly pricing refresh scheduler: pricing refresh job, run tracking table, and dedicated Compose scheduler service.
- 37932c1: Add local sneaker image storage with a database schema, Docker volume support, and an image serve route that falls back to remote source URLs.
- cae80f0: Enforce a single primary image per sneaker (360 gallery frames remain separate), return `primaryImage` from the API instead of an `images` array, and serve stored primary images at `/api/images/:sneakerId`.
- 00d0a3a: Add a `sneaker_images` table and API support for storing multiple sneaker image URLs per pair.
- 0d58a95: Store StockX primary images as a one-to-one sneaker relationship and persist 360 gallery frames in a separate table for future animation support.

## 0.0.1

### Patch Changes

- 8c22ab4: Added sneaker release dates & descriptions.
- f866576: Updated @hono/zod-validator from 0.7.6 to 0.8.0, @vitejs/plugin-react from 4.7.0 to 6.0.2, drizzle-orm from 0.44.7 to 0.45.2, lucide-react from 0.525.0 to 1.17.0, typescript from 5.9.3 to 6.0.3, vite from 7.3.6 to 8.0.16, zod from 3.25.76 to 4.4.3 (version-update:semver-major).
- 054b653: Made purchase price optional.
- ddd5829: Added sneaker nicknames and dynamically built catalog URL.
- 0f87127: Added automated unit tests.
- 610d838: Added searching for sneakers in StockX & GOAT via KicksDB integration.
- 77ee015: Initial MVP setup.
- d945b27: Added test coverage with upload to Codecov.
- 610d838: Added searching across multiple fields using tsvector.
