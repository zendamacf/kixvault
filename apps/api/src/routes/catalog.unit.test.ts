import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { resetRateLimitersForTests } from '../middleware/catalog-rate-limit';

class CatalogSearchError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'CatalogSearchError';
  }
}

class CatalogProductNotFoundError extends Error {
  constructor(message = 'Catalog product not found') {
    super(message);
    this.name = 'CatalogProductNotFoundError';
  }
}

const mockSearchCatalog = mock(async () => [
  {
    catalogSource: 'kicksdb:stockx' as const,
    catalogId: 'air-jordan-1',
    title: 'Air Jordan 1',
    brand: 'Jordan',
    model: 'Air Jordan 1',
    colorway: 'Chicago',
    nickname: 'Chicago',
    sku: 'DZ5485-612',
    imageUrl: null,
    imageUrls: [],
    catalogUrl: 'https://stockx.com/air-jordan-1',
  },
]);

mock.module('../lib/catalog', () => ({
  searchCatalog: mockSearchCatalog,
  CatalogSearchError,
  CatalogProductNotFoundError,
}));

const mockFetchAndCacheCatalogProductWithPrices = mock(async () => ({
  product: {
    catalogSource: 'kicksdb:stockx' as const,
    catalogId: 'air-jordan-1',
    title: 'Air Jordan 1',
    brand: 'Jordan',
    model: 'Air Jordan 1',
    colorway: 'Chicago',
    nickname: 'Chicago',
    sku: 'DZ5485-612',
    imageUrl: null,
    imageUrls: [],
    releaseDate: null,
    description: null,
  },
  variantPrices: [
    {
      size: '10',
      sizeType: 'us m',
      price: 300,
      variantId: 'variant-10',
    },
  ],
}));

mock.module('../lib/pricing', () => ({
  fetchAndCacheCatalogProductWithPrices: mockFetchAndCacheCatalogProductWithPrices,
}));

mock.module('../lib/env', () => ({
  env: {
    kicksdbApiKey: 'KICKS-test-key',
    databaseUrl: 'postgresql://example.com/db',
    port: 3000,
    isProduction: false,
  },
}));

mock.module('../lib/kicksdb', () => ({
  isKicksdbConfigured: () => true,
  ensureKicksdbClient: () => {},
}));

mock.module('../middleware/session', () => ({
  sessionMiddleware: async (
    c: { set: (key: 'user' | 'session', value: unknown) => void },
    next: () => Promise<void>,
  ) => {
    c.set('user', { id: 'user-1', email: 'user@example.com' });
    c.set('session', { id: 'session-1', fresh: false });
    await next();
  },
  requireAuth: async (_c: unknown, next: () => Promise<void>) => next(),
}));

const { catalogRoutes } = await import('./catalog');

describe('catalog routes', () => {
  beforeEach(() => {
    resetRateLimitersForTests();
    mockSearchCatalog.mockClear();
    mockFetchAndCacheCatalogProductWithPrices.mockClear();
  });

  test('returns search results when KicksDB is configured', async () => {
    const response = await catalogRoutes.request('/search?q=jordan&limit=10');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      results: [
        {
          catalogSource: 'kicksdb:stockx',
          catalogId: 'air-jordan-1',
          title: 'Air Jordan 1',
          brand: 'Jordan',
          model: 'Air Jordan 1',
          colorway: 'Chicago',
          nickname: 'Chicago',
          sku: 'DZ5485-612',
          imageUrl: null,
          imageUrls: [],
          catalogUrl: 'https://stockx.com/air-jordan-1',
        },
      ],
    });
    expect(mockSearchCatalog).toHaveBeenCalledWith('jordan', 10);
  });

  test('returns catalog product detail with variant prices', async () => {
    const response = await catalogRoutes.request('/products/air-jordan-1');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      product: {
        catalogSource: 'kicksdb:stockx',
        catalogId: 'air-jordan-1',
        title: 'Air Jordan 1',
        brand: 'Jordan',
        model: 'Air Jordan 1',
        colorway: 'Chicago',
        nickname: 'Chicago',
        sku: 'DZ5485-612',
        imageUrl: null,
        imageUrls: [],
        releaseDate: null,
        description: null,
      },
      variantPrices: [
        {
          size: '10',
          sizeType: 'us m',
          price: 300,
          variantId: 'variant-10',
        },
      ],
    });
    expect(mockFetchAndCacheCatalogProductWithPrices).toHaveBeenCalledWith(
      'kicksdb:stockx',
      'air-jordan-1',
    );
  });

  test('maps catalog product failures to API errors', async () => {
    mockSearchCatalog.mockImplementationOnce(async () => {
      throw new CatalogSearchError('KicksDB request failed', 502);
    });

    const response = await catalogRoutes.request('/search?q=jordan&limit=10');

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ error: 'Catalog search failed' });
  });

  test('maps catalog product fetch failures to API errors', async () => {
    mockFetchAndCacheCatalogProductWithPrices.mockImplementationOnce(async () => {
      throw new CatalogSearchError('KicksDB request failed', 502);
    });

    const response = await catalogRoutes.request('/products/air-jordan-1');

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ error: 'Failed to fetch catalog product' });
  });
});
