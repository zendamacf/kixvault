import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { resetRateLimitersForTests } from '../middleware/catalog-rate-limit';

class CatalogProductNotFoundError extends Error {
  constructor(message = 'Catalog product not found') {
    super(message);
    this.name = 'CatalogProductNotFoundError';
  }
}

class CatalogSearchError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'CatalogSearchError';
  }
}

const mockGetCatalogProductWithPrices = mock(async () => ({
  product: {
    catalogSource: 'kicksdb:stockx' as const,
    catalogId: 'air-max-1',
    title: 'Nike Air Max 1',
    brand: 'Nike',
    model: 'Air Max 1',
    colorway: 'Anniversary Red',
    nickname: 'Big Bubble',
    sku: 'TEST-SKU-001',
    imageUrl: null,
    gallery360Urls: [],
    releaseDate: '2015-04-25',
    description: 'The original Air Max with visible Air cushioning.',
  },
  variantPrices: [
    {
      size: '10',
      sizeType: 'us m',
      price: 220,
      variantId: 'variant-10',
    },
  ],
}));

const mockStoreMarketPriceAndSnapshot = mock(async () => {});

const mockEnv = {
  kicksdbApiKey: 'KICKS-test-key' as string | undefined,
  databaseUrl: 'postgresql://example.com/db',
  port: 3000,
  isProduction: false,
};

mock.module('../lib/env', () => ({
  env: mockEnv,
}));

mock.module('../lib/kicksdb', () => ({
  isKicksdbConfigured: () => !!mockEnv.kicksdbApiKey,
  ensureKicksdbClient: () => {},
}));

mock.module('../lib/catalog', () => ({
  CatalogProductNotFoundError,
  CatalogSearchError,
}));

mock.module('../lib/pricing', () => ({
  getCatalogProductWithPrices: mockGetCatalogProductWithPrices,
  matchVariantPrice: (size: number, variantPrices: Array<{ size: string; price: number }>) =>
    variantPrices.find((variant) => variant.size === String(size)) ?? null,
  storeMarketPriceAndSnapshot: mockStoreMarketPriceAndSnapshot,
  getMarketPricesForSneakers: mock(async () => new Map()),
  getMarketPriceForSneaker: () => null,
  getPriceSnapshotsForSneaker: mock(async () => []),
  computeGainLoss: () => null,
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

const { sneakerRoutes } = await import('./sneakers');

describe('sneaker routes', () => {
  beforeEach(() => {
    resetRateLimitersForTests();
    mockEnv.kicksdbApiKey = 'KICKS-test-key';
    mockGetCatalogProductWithPrices.mockClear();
    mockStoreMarketPriceAndSnapshot.mockClear();
    mockGetCatalogProductWithPrices.mockImplementation(async () => ({
      product: {
        catalogSource: 'kicksdb:stockx' as const,
        catalogId: 'air-max-1',
        title: 'Nike Air Max 1',
        brand: 'Nike',
        model: 'Air Max 1',
        colorway: 'Anniversary Red',
        nickname: 'Big Bubble',
        sku: 'TEST-SKU-001',
        imageUrl: null,
        gallery360Urls: [],
        releaseDate: '2015-04-25',
        description: 'The original Air Max with visible Air cushioning.',
      },
      variantPrices: [
        {
          size: '10',
          sizeType: 'us m',
          price: 220,
          variantId: 'variant-10',
        },
      ],
    }));
  });

  test('POST /from-catalog returns 503 when KicksDB is not configured', async () => {
    mockEnv.kicksdbApiKey = undefined;

    const response = await sneakerRoutes.request('/from-catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        catalogSource: 'kicksdb:stockx',
        catalogId: 'air-max-1',
        size: 10,
        condition: 'deadstock',
      }),
    });

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ error: 'Catalog is not configured' });
  });

  test('POST /from-catalog returns 404 when the catalog product is missing', async () => {
    mockGetCatalogProductWithPrices.mockImplementationOnce(async () => {
      throw new CatalogProductNotFoundError();
    });

    const response = await sneakerRoutes.request('/from-catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        catalogSource: 'kicksdb:stockx',
        catalogId: 'missing',
        size: 10,
        condition: 'deadstock',
      }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'Catalog product not found' });
  });

  test('POST /from-catalog maps catalog search failures to API errors', async () => {
    mockGetCatalogProductWithPrices.mockImplementationOnce(async () => {
      throw new CatalogSearchError('KicksDB request failed', 502);
    });

    const response = await sneakerRoutes.request('/from-catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        catalogSource: 'kicksdb:stockx',
        catalogId: 'air-max-1',
        size: 10,
        condition: 'deadstock',
      }),
    });

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ error: 'Failed to fetch catalog product' });
  });

  test('GET /:id returns 400 for invalid ids', async () => {
    const response = await sneakerRoutes.request('/not-a-uuid');

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid sneaker id' });
  });

  test('PATCH /:id returns 400 for invalid ids', async () => {
    const response = await sneakerRoutes.request('/not-a-uuid', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: 'Updated' }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid sneaker id' });
  });

  test('DELETE /:id returns 400 for invalid ids', async () => {
    const response = await sneakerRoutes.request('/not-a-uuid', {
      method: 'DELETE',
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid sneaker id' });
  });

  test('POST /:id/retire returns 400 for invalid ids', async () => {
    const response = await sneakerRoutes.request('/not-a-uuid/retire', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ departureType: 'gifted', departedOn: '2025-03-01' }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid sneaker id' });
  });

  test('POST /:id/retire returns 400 when a sold pair has no sale price', async () => {
    const response = await sneakerRoutes.request('/11111111-1111-4111-8111-111111111111/retire', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ departureType: 'sold', departedOn: '2025-03-01' }),
    });

    expect(response.status).toBe(400);
  });

  test('POST /:id/retire returns 400 when a gifted pair has a sale price', async () => {
    const response = await sneakerRoutes.request('/11111111-1111-4111-8111-111111111111/retire', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ departureType: 'gifted', departedOn: '2025-03-01', salePrice: 50 }),
    });

    expect(response.status).toBe(400);
  });

  test('POST /:id/restore returns 400 for invalid ids', async () => {
    const response = await sneakerRoutes.request('/not-a-uuid/restore', { method: 'POST' });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid sneaker id' });
  });

  test('GET / rejects an unknown status', async () => {
    const response = await sneakerRoutes.request('/?status=archived');

    expect(response.status).toBe(400);
  });
});
