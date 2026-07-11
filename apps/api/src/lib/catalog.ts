import { getStockxProducts, type StockXProduct } from "@kicksdb/sdk";
import type { CatalogSearchResult } from "@kixvault/shared";
import { ensureKicksdbClient } from "./kicksdb.js";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MARKET = "US"; // Other markets require paid plan

type CacheEntry = {
  results: CatalogSearchResult[];
  expiresAt: number;
};

const cache = new Map<string, CacheEntry>();

export class CatalogSearchError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "CatalogSearchError";
  }
}

export function normalizeStockxProduct(product: StockXProduct): CatalogSearchResult {
  return {
    catalogSource: "kicksdb:stockx",
    catalogId: product.slug,
    title: product.title,
    brand: product.brand,
    model: product.model || product.primary_title,
    colorway: product.secondary_title || null,
    sku: product.sku,
    imageUrl: product.image || product.gallery?.[0] || null,
  };
}

export async function searchCatalog(query: string, limit: number): Promise<CatalogSearchResult[]> {
  const cacheKey = `${query.toLowerCase()}:${limit}`;
  const cached = cache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.results;
  }

  ensureKicksdbClient();

  const { data, error, response } = await getStockxProducts({
    query: {
      query,
      limit: BigInt(limit),
      market: MARKET,
    },
  });

  if (error) {
    throw new CatalogSearchError("KicksDB request failed", response.status);
  }

  const results = (data?.data ?? []).map(normalizeStockxProduct);

  cache.set(cacheKey, {
    results,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return results;
}
