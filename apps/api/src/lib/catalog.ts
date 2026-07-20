import {
  type GoatProduct,
  getGoatProduct,
  getGoatProducts,
  getStockxProduct,
  getStockxProducts,
  type StockXProduct,
} from '@kicksdb/sdk';
import type { CatalogMarketplace, CatalogSearchResult, CatalogSource } from '@kixvault/shared';
import { ensureKicksdbClient } from './kicksdb';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MARKET = 'US'; // Other markets require paid plan
const MAX_SEARCH_LIMIT = 20;

type CacheEntry = {
  results: CatalogSearchResult[];
  expiresAt: number;
};

const cache = new Map<string, CacheEntry>();

export function normalizeCatalogSearchQuery(searchQuery: string): string {
  return searchQuery.trim().toLowerCase().replace(/\s+/g, ' ');
}

function buildSearchCacheKey(marketplace: CatalogMarketplace, searchQuery: string): string {
  return `${marketplace}:${normalizeCatalogSearchQuery(searchQuery)}`;
}

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

export class CatalogProductNotFoundError extends Error {
  constructor(message = 'Catalog product not found') {
    super(message);
    this.name = 'CatalogProductNotFoundError';
  }
}

function normalizeDescription(description: string | null | undefined): string | null {
  if (!description?.trim()) {
    return null;
  }

  return (
    description
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() || null
  );
}

export function parseCatalogReleaseDate(value: string | Date | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function getStockxReleaseDate(product: StockXProduct): string | null {
  const releaseDateTrait = product.traits?.find(
    (trait) => trait.trait.toLowerCase() === 'release date',
  );

  return releaseDateTrait ? parseCatalogReleaseDate(releaseDateTrait.value) : null;
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
    releaseDate: getStockxReleaseDate(product),
    description: normalizeDescription(product.description),
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
    releaseDate: parseCatalogReleaseDate(product.release_date),
    description: normalizeDescription(product.description),
  };
}

export async function searchCatalog(
  searchQuery: string,
  limit: number,
  marketplace: CatalogMarketplace = 'stockx',
): Promise<CatalogSearchResult[]> {
  const query = searchQuery.trim();
  const cacheKey = buildSearchCacheKey(marketplace, query);
  const cached = cache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.results.slice(0, limit);
  }

  ensureKicksdbClient();

  const results =
    marketplace === 'goat'
      ? await searchGoatCatalog(query, MAX_SEARCH_LIMIT)
      : await searchStockxCatalog(query, MAX_SEARCH_LIMIT);

  cache.set(cacheKey, {
    results,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return results.slice(0, limit);
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

export async function fetchCatalogProduct(
  catalogSource: CatalogSource,
  catalogId: string,
): Promise<CatalogSearchResult> {
  ensureKicksdbClient();

  if (catalogSource === 'kicksdb:goat') {
    const { data, error, response } = await getGoatProduct({
      path: { id: catalogId },
      query: { market: MARKET },
    });

    if (error) {
      if (response.status === 404) {
        throw new CatalogProductNotFoundError();
      }

      throw new CatalogSearchError('KicksDB request failed', response.status);
    }

    if (!data?.data) {
      throw new CatalogProductNotFoundError();
    }

    return normalizeGoatProduct(data.data);
  }

  if (catalogSource === 'kicksdb:stockx') {
    const { data, error, response } = await getStockxProduct({
      path: { id: catalogId },
      query: {
        market: MARKET,
        'display[traits]': true,
      },
    });

    if (error) {
      if (response.status === 404) {
        throw new CatalogProductNotFoundError();
      }

      throw new CatalogSearchError('KicksDB request failed', response.status);
    }

    if (!data?.data) {
      throw new CatalogProductNotFoundError();
    }

    return normalizeStockxProduct(data.data);
  }

  throw new CatalogSearchError('Unsupported catalog source', 400);
}
