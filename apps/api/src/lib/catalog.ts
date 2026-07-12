import {
  type GoatProduct,
  getGoatProducts,
  getStockxProducts,
  type StockXProduct,
} from '@kicksdb/sdk';
import type { CatalogMarketplace, CatalogSearchResult } from '@kixvault/shared';
import { ensureKicksdbClient } from './kicksdb';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MARKET = 'US'; // Other markets require paid plan

type CacheEntry = {
  results: CatalogSearchResult[];
  expiresAt: number;
};

const cache = new Map<string, CacheEntry>();

export function resetCatalogCacheForTests(): void {
  cache.clear();
}

export class CatalogSearchError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'CatalogSearchError';
  }
}

export function normalizeStockxProduct(product: StockXProduct): CatalogSearchResult {
  return {
    catalogSource: 'kicksdb:stockx',
    catalogId: product.slug,
    title: product.title,
    brand: product.brand,
    model: product.model || product.primary_title,
    colorway: product.secondary_title || null,
    nickname: product.secondary_title || null,
    sku: product.sku,
    imageUrl: product.image || product.gallery?.[0] || null,
  };
}

export function normalizeGoatProduct(product: GoatProduct): CatalogSearchResult {
  return {
    catalogSource: 'kicksdb:goat',
    catalogId: product.slug,
    title: product.name,
    brand: product.brand,
    model: product.model,
    colorway: product.colorway || null,
    nickname: product.nickname || null,
    sku: product.sku,
    imageUrl: product.image_url || product.images?.[0] || null,
  };
}

export async function searchCatalog(
  searchQuery: string,
  limit: number,
  marketplace: CatalogMarketplace = 'stockx',
): Promise<CatalogSearchResult[]> {
  const query = searchQuery.trim();
  const cacheKey = `${marketplace}:${query.toLowerCase()}:${limit}`;
  const cached = cache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.results;
  }

  ensureKicksdbClient();

  const results =
    marketplace === 'goat'
      ? await searchGoatCatalog(query, limit)
      : await searchStockxCatalog(query, limit);

  cache.set(cacheKey, {
    results,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return results;
}

async function searchStockxCatalog(query: string, limit: number): Promise<CatalogSearchResult[]> {
  const { data, error, response } = await getStockxProducts({
    query: {
      query,
      filters: 'product_type=sneakers',
      limit: BigInt(limit),
      market: MARKET,
    },
  });

  if (error) {
    throw new CatalogSearchError('KicksDB request failed', response.status);
  }

  return (data?.data ?? []).map(normalizeStockxProduct);
}

async function searchGoatCatalog(query: string, limit: number): Promise<CatalogSearchResult[]> {
  const { data, error, response } = await getGoatProducts({
    query: {
      query,
      filters: 'product_type=sneakers',
      limit: BigInt(limit),
      market: MARKET,
    },
  });

  if (error) {
    throw new CatalogSearchError('KicksDB request failed', response.status);
  }

  return (data?.data ?? []).map(normalizeGoatProduct);
}
