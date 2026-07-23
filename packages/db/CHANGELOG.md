# @kixvault/db

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
