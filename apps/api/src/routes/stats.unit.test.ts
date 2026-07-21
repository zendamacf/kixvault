import { beforeEach, describe, expect, mock, test } from 'bun:test';

const mockSelect = mock(async () => []);
const mockGetMarketPricesForSneakers = mock(async () => new Map());

mock.module('../lib/env', () => ({
  env: {
    databaseUrl: 'postgresql://example.com/db',
    kicksdbApiKey: 'KICKS-test-key',
    port: 3000,
    isProduction: false,
  },
}));

mock.module('../lib/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: mockSelect,
      }),
    }),
  },
}));

mock.module('../lib/pricing', () => ({
  getMarketPricesForSneakers: mockGetMarketPricesForSneakers,
  getMarketPriceForSneaker: (
    row: { catalogSource: string | null; sku: string | null; size: string },
    prices: Map<string, { price: number }>,
  ) => {
    if (!row.catalogSource || !row.sku) {
      return null;
    }

    return prices.get(`${row.catalogSource}:${row.sku}:${row.size}`) ?? null;
  },
  computeGainLoss: (purchasePrice: string | null, marketPrice: number | null) => {
    if (marketPrice === null || !purchasePrice) {
      return null;
    }

    return marketPrice - Number(purchasePrice);
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
  requireAuth: async (c: { get: (key: 'user') => unknown }, next: () => Promise<void>) => {
    if (!c.get('user')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    await next();
  },
}));

const { statsRoutes } = await import('./stats');

describe('stats routes', () => {
  beforeEach(() => {
    mockSelect.mockReset();
    mockGetMarketPricesForSneakers.mockReset();
  });

  test('GET / returns collection stats with market aggregates', async () => {
    mockSelect.mockResolvedValueOnce([
      {
        catalogSource: 'kicksdb:stockx',
        sku: 'SKU-1',
        size: '10',
        condition: 'deadstock',
        purchasePrice: '200.00',
      },
      {
        catalogSource: null,
        sku: null,
        size: '9',
        condition: 'worn',
        purchasePrice: '100.00',
      },
    ]);

    mockGetMarketPricesForSneakers.mockResolvedValueOnce(
      new Map([
        [
          'kicksdb:stockx:SKU-1:10',
          { price: 250, pricedAt: new Date('2026-07-20T00:00:00.000Z'), currency: 'USD' },
        ],
      ]),
    );

    const response = await statsRoutes.request('/');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      stats: {
        count: 2,
        totalSpend: 300,
        avgSpend: 150,
        totalMarketValue: 250,
        totalGainLoss: 50,
      },
    });
  });
});
