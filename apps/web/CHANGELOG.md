# @kixvault/web

## 0.1.0

### Minor Changes

- b497fc7: Add collection market value stats and per-sneaker price history from stored snapshots.
- b516b67: Show catalog market prices during sneaker selection and on collection cards and detail pages.
- 9bb478a: Add lazy-loaded image carousels across the collection and sneaker views, and remove the deprecated sneaker `imageUrl` field from API responses.

### Patch Changes

- 0aa277d: Add CDN preconnect hints for StockX and GOAT image hosts to reduce first-image load latency.
- b14eafe: Lazy-render sneaker image carousel slides so only the active slide and its neighbor mount image elements.
- cae80f0: Enforce a single primary image per sneaker (360 gallery frames remain separate), return `primaryImage` from the API instead of an `images` array, and serve stored primary images at `/api/images/:sneakerId`.
- c69205a: Show only the primary sneaker image in collection and detail views, and remove the unused carousel UI primitive.
- 8709445: Simplify catalog APIs and clients to StockX-only routes by removing marketplace parameters and GOAT CDN preconnect hints.
- 7a20ebf: Remove the GOAT marketplace selector from catalog search and default new sneaker lookups to StockX.
- 4f4deef: Updated market prices to display for all wear conditions.
- 333a82c: Fixed sneaker card condition badge overflowing, refactored condition badge into component, and updated layout of sneaker detail page.
- Updated dependencies [e2ddce9]
- Updated dependencies [c35d5f9]
- Updated dependencies [e8d5218]
- Updated dependencies [b497fc7]
- Updated dependencies [5cfb12d]
- Updated dependencies [a3d34dc]
- Updated dependencies [4ab068a]
- Updated dependencies [37932c1]
- Updated dependencies [d2b33aa]
- Updated dependencies [cae80f0]
- Updated dependencies [8fbfaad]
- Updated dependencies [8709445]
- Updated dependencies [4f4deef]
- Updated dependencies [9bb478a]
- Updated dependencies [00d0a3a]
- Updated dependencies [0d58a95]
- Updated dependencies [b572e5f]
  - @kixvault/api@0.1.0
  - @kixvault/shared@0.1.0

## 0.0.4

### Patch Changes

- e852fac: Increase catalog search debounce to 2 seconds and require at least 3 characters before searching.
- e20824f: Updated @happy-dom/global-registrator from 17.6.3 to 20.10.6, lucide-react from 1.17.0 to 1.20.0 (version-update:semver-major).
- 76ea3f8: Pass `SENTRY_AUTH_TOKEN` as a Docker BuildKit secret during image builds instead of a build arg.
- 76ea3f8: Fixed web Docker source map uploads by installing CA certificates, setting an explicit Sentry release name, and removing map files after upload. Removed the unnecessary `SENTRY_RELEASE` override from deployment documentation.
- 02c04c0: Associate Sentry releases with the Git commit that produced each Docker image build.
- 88c5a8d: Attach authenticated user IDs to Sentry events in the API and web apps.
- 0df3308: Added `SIGNUPS_ENABLED` environment variable to allowing new users to sign themselves up.
- 76ea3f8: Added root route error handling with a fallback UI and Sentry reporting for TanStack Router errors.
- Updated dependencies [740e68f]
- Updated dependencies [76ea3f8]
- Updated dependencies [acb7c3a]
- Updated dependencies [c597b91]
- Updated dependencies [839e39e]
- Updated dependencies [fb804cc]
- Updated dependencies [5116010]
- Updated dependencies [e852fac]
- Updated dependencies [76ea3f8]
- Updated dependencies [6dd821b]
- Updated dependencies [02c04c0]
- Updated dependencies [88c5a8d]
- Updated dependencies [0df3308]
  - @kixvault/api@0.0.4
  - @kixvault/shared@0.0.2

## 0.0.3

### Patch Changes

- Updated dependencies [0043e1c]
  - @kixvault/api@0.0.3

## 0.0.2

### Patch Changes

- f9512c4: Fix release workflow Docker builds by setting up Buildx before exporting GitHub Actions build cache.
- Updated dependencies [f9512c4]
  - @kixvault/api@0.0.2

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
