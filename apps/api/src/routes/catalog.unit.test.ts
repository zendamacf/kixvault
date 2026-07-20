import { describe, expect, mock, test } from 'bun:test';

class CatalogSearchError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'CatalogSearchError';
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
    catalogUrl: 'https://stockx.com/air-jordan-1',
  },
]);

const mockSearchCatalogByBarcode = mock(async () => [
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
    releaseDate: '2015-04-25',
    description: null,
  },
]);

mock.module('../lib/catalog', () => ({
  searchCatalog: mockSearchCatalog,
  searchCatalogByBarcode: mockSearchCatalogByBarcode,
  CatalogSearchError,
}));

mock.module('../lib/env', () => ({
  env: {
    kicksdbApiKey: 'KICKS-test-key',
    databaseUrl: 'postgresql://example.com/db',
    port: 3000,
    isProduction: false,
  },
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
  test('returns search results when KicksDB is configured', async () => {
    const response = await catalogRoutes.request('/search?q=jordan&limit=10&marketplace=stockx');

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
          catalogUrl: 'https://stockx.com/air-jordan-1',
        },
      ],
    });
    expect(mockSearchCatalog).toHaveBeenCalledWith('jordan', 10, 'stockx');
  });

  test('returns barcode lookup results when KicksDB is configured', async () => {
    const response = await catalogRoutes.request('/barcode?code=197863114996&limit=10');

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
          releaseDate: '2015-04-25',
          description: null,
        },
      ],
    });
    expect(mockSearchCatalogByBarcode).toHaveBeenCalledWith('197863114996', 10);
  });

  test('maps barcode lookup failures to API errors', async () => {
    mockSearchCatalogByBarcode.mockImplementationOnce(async () => {
      throw new CatalogSearchError('KicksDB request failed', 502);
    });

    const response = await catalogRoutes.request('/barcode?code=197863114996&limit=10');

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ error: 'Barcode lookup failed' });
  });

  test('maps catalog search failures to API errors', async () => {
    mockSearchCatalog.mockImplementationOnce(async () => {
      throw new CatalogSearchError('KicksDB request failed', 502);
    });

    const response = await catalogRoutes.request('/search?q=jordan&limit=10&marketplace=stockx');

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ error: 'Catalog search failed' });
  });
});
