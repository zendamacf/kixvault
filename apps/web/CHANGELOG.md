# @kixvault/web

## 0.0.1

### Patch Changes

- b788c21: Added smoke test for deployment by validating that the Docker Compose services are available.
- 0c8af25: Restricted Sentry to production environments.
- 5a51b4d: Limited catalog-linked sneaker edits to collection fields only.
- 5a51b4d: Added documentation of components.
- 8c22ab4: Added sneaker release dates & descriptions.
- d352853: Added automated unit tests.
- f866576: Updated @hono/zod-validator from 0.7.6 to 0.8.0, @vitejs/plugin-react from 4.7.0 to 6.0.2, drizzle-orm from 0.44.7 to 0.45.2, lucide-react from 0.525.0 to 1.17.0, typescript from 5.9.3 to 6.0.3, vite from 7.3.6 to 8.0.16, zod from 3.25.76 to 4.4.3 (version-update:semver-major).
- 0c8af25: Adds changeset-driven release workflow that builds and pushes Docker images to GHCR.
- 054b653: Made purchase price optional.
- 5be7002: Added theming, along with brand-specific badges.
- ddd5829: Added sneaker nicknames and dynamically built catalog URL.
- 610d838: Added searching for sneakers in StockX & GOAT via KicksDB integration.
- 77ee015: Initial MVP setup.
- 5a51b4d: Improved sneaker page layout with shared back links, consistent page width, catalog search view transitions, and larger catalog thumbnails.
- 5a51b4d: Split sneaker add flow into separate catalog search and manual entry forms.
- d945b27: Added test coverage with upload to Codecov.
- 50cbcb6: Set up Sentry integration.
- 610d838: Added searching across multiple fields using tsvector.
- 054b653: Adopted shadcn/ui components instead of bespoke components.
- Updated dependencies [b788c21]
- Updated dependencies [8c22ab4]
- Updated dependencies [f866576]
- Updated dependencies [0c8af25]
- Updated dependencies [054b653]
- Updated dependencies [ddd5829]
- Updated dependencies [0f87127]
- Updated dependencies [054b653]
- Updated dependencies [d352853]
- Updated dependencies [610d838]
- Updated dependencies [77ee015]
- Updated dependencies [5a51b4d]
- Updated dependencies [d945b27]
- Updated dependencies [50cbcb6]
- Updated dependencies [610d838]
  - @kixvault/api@0.0.1
  - @kixvault/shared@0.0.1
