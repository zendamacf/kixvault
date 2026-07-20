# Dual Catalog Linking Plan (StockX + GOAT)

This document describes what is needed to automatically store **both** StockX and GOAT catalog IDs when a sneaker is added via either marketplace, so KixVault can use the best data from each source.

**Status:** Planning only — no implementation has started.

## Goals

- When a sneaker is created from one catalog (StockX or GOAT), also persist the other marketplace's catalog ID.
- Enable downstream features that benefit from both sources:
  - **StockX** — richer product data and batch pricing API.
  - **GOAT** — better images (transparent backgrounds).
- Resolve cross-catalog links server-side at creation time; no change to the user search flow.

## Non-Goals (v1)

- Supporting marketplaces beyond StockX and GOAT (Flight Club, Shopify, etc.).
- Manual catalog-link editing in the UI.
- Real-time cross-catalog resolution on every page load.
- Re-fetching or re-normalizing all metadata fields from both sources on every create.

---

## Current State

### Single catalog reference per sneaker

The `sneakers` table stores one external catalog reference:

| Column | Type | Purpose |
|--------|------|---------|
| `catalog_source` | `text` | e.g. `kicksdb:stockx` or `kicksdb:goat` |
| `catalog_id` | `text` | Marketplace slug (not numeric ID) |
| `sku` | `text` | Product SKU; also used as the catalog-linked flag |
| `image_url` | `text` | Thumbnail from the source catalog used at create time |

Defined in `packages/db/src/schema.ts`. Catalog columns were added incrementally via migrations `0001`–`0005`. There is no junction table, no second catalog pair, and no unique constraint on `(catalog_source, catalog_id)`.

### Creation flow

1. User searches one marketplace in `CatalogSearchPicker` (StockX or GOAT).
2. User selects a result and submits collection fields via `POST /api/sneakers/from-catalog`.
3. API re-fetches the product via `fetchCatalogProduct()` in `apps/api/src/lib/catalog.ts` (authoritative, not the cached search result).
4. API inserts one `(catalogSource, catalogId)` pair plus normalized metadata.

The entire stack assumes a single catalog:

| Layer | Assumption |
|-------|------------|
| **DB** | One `catalog_source` + `catalog_id` |
| **API response** | Single `catalogUrl` via `formatSneaker()` |
| **Edit guards** | `catalogSource` / `catalogId` locked when `sku` is set |
| **UI** | One "View on StockX/GOAT" link on the detail page |
| **KicksDB usage** | Standard API only (`getStockxProduct`, `getGoatProduct`, etc.) |

### No cross-catalog matching exists

- No service, utility, or background job matches StockX ↔ GOAT.
- No SKU-based lookup across marketplaces at create time.
- `buildCatalogUrl()` supports an optional `link` override, but normalization does not capture the SDK's `link` field — URLs are rebuilt from slug.
- The only implicit cross-catalog signal is **SKU** (same SKU can appear in both marketplaces' search results, as shown in unit tests), but nothing uses it to link them.

### KicksDB integration

All catalog I/O goes through `@kicksdb/sdk` (`apps/api/src/lib/kicksdb.ts`, `apps/api/src/lib/catalog.ts`):

| SDK function | Currently used for |
|--------------|-------------------|
| `getStockxProducts` | Catalog search (StockX) |
| `getGoatProducts` | Catalog search (GOAT) |
| `getStockxProduct` | Single product fetch on create |
| `getGoatProduct` | Single product fetch on create |

Catalog search uses an in-memory 24h cache keyed by `{marketplace}:{query}:{limit}`. Product fetches are not cached. Market is hardcoded to `US`.

**Not currently used:** KicksDB Unified API (`GET /v3/unified/products/{identifier}`), which cross-matches products across platforms and returns entries with `shop_name` (`stockx`, `goat`, etc.), `slug`, and shared `metadata.cluster_id`. This is a **premium/paid** KicksDB feature (~340k of 1.6M products have at least one cross-platform match).

---

## Architecture Options

### Option A — Dual columns on `sneakers` (recommended for two marketplaces)

Add nullable columns:

```sql
stockx_catalog_id text,
goat_catalog_id   text
```

**Pros:** Simple queries, no joins, maps directly to the two-marketplace use case, easy to pass StockX slug into batch pricing.

**Cons:** Does not generalize if more marketplaces are added later.

### Option B — Junction table `sneaker_catalog_links`

```sql
sneaker_catalog_links (
  sneaker_id      uuid REFERENCES sneakers(id),
  catalog_source  text,   -- 'kicksdb:stockx' | 'kicksdb:goat'
  catalog_id      text,
  image_url       text,   -- optional per-marketplace image
  PRIMARY KEY (sneaker_id, catalog_source)
)
```

**Pros:** Extensible, can store per-marketplace images/metadata, cleaner if more platforms are added.

**Cons:** More complex reads/writes, migration of existing data, every sneaker query needs a join or secondary fetch.

### Option C — Keep primary pair, add secondary pair

Keep `catalog_source` / `catalog_id` as the user's chosen source; add `secondary_catalog_source` / `secondary_catalog_id`.

**Pros:** Smallest conceptual change, backward compatible.

**Cons:** Asymmetric model; awkward once both IDs should always be stored; harder to reason about which is "primary" for display vs pricing.

**Recommendation:** Option A unless more marketplaces are expected soon — then Option B.

---

## Matching Strategy Options

How to find the other marketplace's slug after fetching the primary product.

### Strategy 1 — KicksDB Unified API (best accuracy)

```http
GET /v3/unified/products/{slug-or-sku}
```

**Flow:**

1. Fetch primary product (existing behavior).
2. Call unified API with primary slug (or SKU).
3. Filter results by `shop_name === 'stockx'` and `shop_name === 'goat'`.
4. Store both slugs.

**Pros:** Purpose-built cross-matching, handles slug differences between platforms, supports `similarity` threshold (default 0.85).

**Cons:** Premium/paid KicksDB feature; not currently integrated; SDK may need a new method or raw HTTP call; not 100% coverage.

### Strategy 2 — SKU cross-search via existing `searchCatalog()` (fallback / free tier)

After fetching the primary product, search the other marketplace by SKU:

```ts
searchCatalog(catalogProduct.sku, 5, otherMarketplace)
// pick result where result.sku === catalogProduct.sku (exact match)
```

**Pros:** Uses existing code; no new API tier required.

**Cons:** SKU collisions (GS/TD/PS variants); slug formats differ across platforms; search ranking may not return the correct variant first; less reliable than Unified API.

### Strategy 3 — Hybrid (recommended production approach)

1. Try Unified API first (if key has access).
2. Fall back to SKU cross-search.
3. If no match found, store only the primary ID (partial link).

**Recommendation:** Strategy 3.

---

## Metadata & Image Strategy

Storing both IDs is not enough for "best of both worlds" — the system must also decide which source wins for display fields.

| Field | Suggested source | Rationale |
|-------|------------------|-----------|
| `imageUrl` | **GOAT** when linked | Transparent backgrounds |
| `brand`, `model`, `sku`, `description` | **StockX** when linked | Richer traits/data |
| `colorway`, `nickname`, `releaseDate` | Primary catalog, or StockX-preferring merge | StockX `secondary_title` doubles as nickname today |

**Image options:**

| Approach | Description |
|----------|-------------|
| **A. Prefer GOAT image at write time** | On create, if GOAT link resolves, set `imageUrl` from GOAT regardless of which marketplace was searched. Simplest. |
| **B. Store per-marketplace images** | `goat_image_url` column or in junction table; pick at read time. More flexible. |
| **C. Resolve at read time** | Don't store GOAT image; fetch on demand. Adds latency and API cost. Not recommended. |

**Recommendation:** Approach A for v1 (GOAT image at write time when available).

---

## Implementation Plan

### Phase 1 — Schema & types

1. Add migration: `stockx_catalog_id` and `goat_catalog_id` (nullable `text`).
2. Migrate existing rows:
   - `catalog_source = 'kicksdb:stockx'` → populate `stockx_catalog_id` from `catalog_id`.
   - `catalog_source = 'kicksdb:goat'` → populate `goat_catalog_id` from `catalog_id`.
3. Update Drizzle schema (`packages/db/src/schema.ts`).
4. Update shared types and Zod schemas (`packages/shared`).

**Open decision:** Deprecate `catalog_source` / `catalog_id` eventually, or keep them as "user's selected primary" for backward compatibility. Keeping them avoids a breaking API change in v1.

### Phase 2 — Cross-catalog resolution service

New module, e.g. `apps/api/src/lib/catalog-linking.ts`:

```ts
resolveCatalogLinks(primary: CatalogSearchResult): Promise<{
  stockxCatalogId: string | null;
  goatCatalogId: string | null;
  goatImageUrl: string | null;
}>
```

Responsibilities:

- Call Unified API (or SKU fallback).
- Handle no-match gracefully (return `null` for missing side).
- Disambiguate multiple matches (prefer exact SKU + same `product_type`, use `similarity` param).
- Unit tests for: both found, only primary found, ambiguous SKU, API failure.

### Phase 3 — Update `from-catalog` creation flow

```
UI → POST /from-catalog {catalogSource, catalogId, ...}
  → fetchCatalogProduct(primary)
  → resolveCatalogLinks(primary)
  → INSERT with stockx_catalog_id, goat_catalog_id, imageUrl (GOAT preferred)
  → response with catalogUrls
```

Changes to `apps/api/src/routes/sneakers.ts`.

**Failure mode options:**

- **Fail open (recommended):** Create sneaker with partial links if secondary lookup fails.
- **Fail closed:** Reject create if secondary cannot be resolved (worse UX).

### Phase 4 — API response shape

Extend `formatSneaker()`:

```ts
// Current
catalogUrl: string | null

// Proposed
catalogUrls: {
  stockx: string | null;
  goat: string | null;
}
// Keep catalogUrl as deprecated alias to primary during transition
```

Update:

- `apps/api/src/lib/sneakers.ts` — `formatSneaker`, `getCatalogLinkedModelFieldViolations`, `buildSneakerUpdate`
- `apps/web/src/lib/queries.ts` — `Sneaker` type
- Integration tests in `apps/api/src/integration/api.integration.test.ts`

### Phase 5 — UI updates

| File | Change |
|------|--------|
| `apps/web/src/routes/_authenticated/sneakers/$sneakerId/index.tsx` | Show both "View on StockX" and "View on GOAT" when available |
| `apps/web/src/components/sneakers/sneaker-card.tsx` | Already uses `imageUrl` — benefits automatically if GOAT image is stored |
| `apps/web/src/components/sneakers/catalog-sneaker-summary.tsx` | Optional: show both links in preview |

No change needed to the search picker — user still picks one marketplace; linking happens server-side.

### Phase 6 — Backfill existing sneakers

One-off script or migration job for rows where `sku IS NOT NULL` and either `stockx_catalog_id` or `goat_catalog_id` is missing. For each row, call `resolveCatalogLinks()` and update. Run in batches with rate limiting.

### Phase 7 — Future: StockX batch pricing

Once `stockx_catalog_id` is reliably stored, a pricing feature can call `POST /v3/stockx/prices` with StockX slugs/IDs without requiring the user to have originally searched StockX. See `docs/sneaker-market-pricing-plan.md` for related pricing architecture.

---

## Risk & Edge Cases

| Risk | Mitigation |
|------|------------|
| Unified API requires paid tier | Confirm KicksDB plan; implement SKU fallback |
| ~20% of products have no cross-match | Fail open; store partial links; optional UI indicator |
| GS/TD/PS SKU collisions | Prefer Unified API; filter by `product_type` and adult sizing |
| Extra latency on create (+1 API call) | Acceptable for create; could async-enrich later if needed |
| Wrong match stored | Store match confidence or `cluster_id` for debugging; allow manual override later |
| Existing `catalog_source`/`catalog_id` semantics | Keep as "primary" for backward compat; document clearly |

---

## Recommended Path

| Decision | Recommendation |
|----------|----------------|
| **Schema** | Option A — `stockx_catalog_id` + `goat_catalog_id` columns |
| **Matching** | Strategy 3 — Unified API with SKU fallback |
| **Images** | Prefer GOAT `imageUrl` at write time when GOAT link resolves |
| **Failure mode** | Fail open — always create; partial links are OK |
| **API response** | Add `catalogUrls`; keep `catalogUrl` as primary alias during transition |
| **Scope** | Server-side auto-link on create + backfill script; no UI picker changes needed |

---

## Files That Would Change

| Area | Files |
|------|-------|
| **DB** | `packages/db/src/schema.ts`, new Drizzle migration |
| **Shared** | `packages/shared/src/schemas/sneaker.ts`, possibly `catalog.ts` |
| **API core** | `apps/api/src/lib/catalog.ts`, new `catalog-linking.ts`, `apps/api/src/lib/sneakers.ts` |
| **API routes** | `apps/api/src/routes/sneakers.ts` |
| **KicksDB** | `apps/api/src/lib/kicksdb.ts` (Unified API client), mocks |
| **Tests** | `catalog.unit.test.ts`, `api.integration.test.ts`, new linking unit tests |
| **Web** | `queries.ts`, sneaker detail page, possibly `utils.ts` |

---

## Open Questions

1. **KicksDB plan tier** — Is Unified API (`/v3/unified/products`) available on the current API key? This determines whether Strategy 1 is viable or SKU fallback is needed from day one.
2. **Partial links** — Should creation succeed if only one marketplace ID is found, or should it be all-or-nothing?
3. **Primary catalog semantics** — Keep `catalog_source`/`catalog_id` as "what the user searched", or migrate fully to the dual-column model and drop the old fields?
4. **Image override** — Always prefer GOAT images when both are linked, or only when the user added via StockX?
5. **Backfill priority** — Enrich existing catalog-linked sneakers immediately, or only apply to new creates going forward?
