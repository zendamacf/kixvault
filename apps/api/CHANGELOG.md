# @kixvault/api

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
