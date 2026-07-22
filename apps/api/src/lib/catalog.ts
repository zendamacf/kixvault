import { getStockxProduct, getStockxProducts, type StockXProduct } from '@kicksdb/sdk';
import { catalogSources, type CatalogMarketplace, type CatalogSearchResult, type CatalogSource } from '@kixvault/shared';
import { getCatalogSearchCache, resetCatalogSearchCacheForTests } from './catalog-cache';
import { ensureKicksdbClient } from './kicksdb';
import { normalizeSneakerImageUrls } from './sneaker-images';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MARKET = 'US'; // Other markets require paid plan
const MAX_SEARCH_LIMIT = 20;

type ProductCacheEntry = {
  result: CatalogSearchResult;
  expiresAt: number;
};

type SearchResultIndexEntry = {
  result: CatalogSearchResult;
  expiresAt: number;
};

const productCache = new Map<string, ProductCacheEntry>();
const searchResultIndex = new Map<string, SearchResultIndexEntry>();

function getProductCacheKey(catalogSource: CatalogSource, catalogId: string): string {
  return `${catalogSource}:${catalogId}`;
}

function getSearchResultIndexKey(catalogSource: CatalogSource, catalogId: string): string {
  return `${catalogSource}:${catalogId}`;
}

function indexSearchResults(results: CatalogSearchResult[], expiresAt: number): void {
  for (const result of results) {
    searchResultIndex.set(getSearchResultIndexKey(result.catalogSource, result.catalogId), {
      result,
      expiresAt,
    });
  }
}

function getIndexedSearchResult(
  catalogSource: CatalogSource,
  catalogId: string,
): CatalogSearchResult | null {
  const indexed = searchResultIndex.get(getSearchResultIndexKey(catalogSource, catalogId));

  if (!indexed || indexed.expiresAt <= Date.now()) {
    if (indexed) {
      searchResultIndex.delete(getSearchResultIndexKey(catalogSource, catalogId));
    }

    return null;
  }

  return indexed.result;
}

export function normalizeCatalogSearchQuery(searchQuery: string): string {
  return searchQuery.trim().toLowerCase().replace(/\s+/g, ' ');
}

function buildSearchCacheKey(searchQuery: string): string {
  return `stockx:${normalizeCatalogSearchQuery(searchQuery)}`;
}

export function resetCatalogCacheForTests(): void {
  resetCatalogSearchCacheForTests();
  productCache.clear();
  searchResultIndex.clear();
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

export function extractStockxImageUrls(product: StockXProduct): string[] {
  return normalizeSneakerImageUrls([product.image, ...(product.gallery ?? [])]);
}

export function normalizeStockxProduct(product: StockXProduct): CatalogSearchResult {
  const imageUrls = extractStockxImageUrls(product);

  return {
    catalogSource: 'kicksdb:stockx',
    catalogId: product.slug,
    title: product.title,
    brand: product.brand,
    model: product.model || product.primary_title,
    colorway: product.secondary_title || null,
    nickname: product.secondary_title || null,
    sku: product.sku,
    imageUrl: imageUrls[0] ?? null,
    imageUrls,
    releaseDate: getStockxReleaseDate(product),
    description: normalizeDescription(product.description),
  };
}

export async function searchCatalog(
  searchQuery: string,
  limit: number,
  _marketplace: CatalogMarketplace = 'stockx',
): Promise<CatalogSearchResult[]> {
  const query = searchQuery.trim();
  const cacheKey = buildSearchCacheKey(query);
  const searchCache = getCatalogSearchCache();
  const cached = await searchCache.get(cacheKey);

  if (cached) {
    return cached.slice(0, limit);
  }

  ensureKicksdbClient();

  const results = await searchStockxCatalog(query, MAX_SEARCH_LIMIT);
  const expiresAt = Date.now() + CACHE_TTL_MS;

  await searchCache.set(cacheKey, results, CACHE_TTL_MS);
  indexSearchResults(results, expiresAt);

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

export async function fetchCatalogProduct(
  catalogSource: CatalogSource,
  catalogId: string,
): Promise<CatalogSearchResult> {
  if (!catalogSources.includes(catalogSource)) {
    throw new CatalogSearchError('Unsupported catalog source', 400);
  }

  const cachedResult = getIndexedSearchResult(catalogSource, catalogId);

  if (cachedResult) {
    return cachedResult;
  }

  const productCacheKey = getProductCacheKey(catalogSource, catalogId);
  const cachedProduct = productCache.get(productCacheKey);

  if (cachedProduct && cachedProduct.expiresAt > Date.now()) {
    return cachedProduct.result;
  }

  ensureKicksdbClient();

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

  const product = normalizeStockxProduct(data.data);

  productCache.set(productCacheKey, {
    result: product,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return product;
}
