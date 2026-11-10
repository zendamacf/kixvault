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

  test('GET /analytics returns charts data for the signed-in user', async () => {
    mockSelect
      .mockResolvedValueOnce([
        {
          id: 'sneaker-1',
          brand: 'Nike',
          model: 'Air Max 1',
          nickname: null,
          condition: 'deadstock',
          size: '10.0',
          sku: 'SKU-1',
          catalogSource: 'kicksdb:stockx',
          purchaseDate: new Date('2026-07-01T00:00:00.000Z'),
        },
      ])
      .mockResolvedValueOnce([
        {
          catalogSource: 'kicksdb:stockx',
          sku: 'SKU-1',
          size: '10.0',
          snapshotDate: new Date('2026-07-08T00:00:00.000Z'),
          price: '150.00',
        },
      ])
      .mockResolvedValueOnce([{ sneakerId: 'sneaker-1', wornOn: '2026-07-09' }]);

    const response = await statsRoutes.request('/analytics');

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      analytics: {
        portfolioValue: unknown;
        trackedPairs: number;
        totalPairs: number;
        mostWorn: unknown;
        brands: unknown;
        conditions: unknown;
      };
    };
    expect(body.analytics.portfolioValue).toEqual([{ date: '2026-07-08', value: 150, pairs: 1 }]);
    expect(body.analytics.trackedPairs).toBe(1);
    expect(body.analytics.totalPairs).toBe(1);
    expect(body.analytics.mostWorn).toEqual([
      { sneakerId: 'sneaker-1', name: 'Air Max 1', count: 1 },
    ]);
    expect(body.analytics.brands).toEqual([{ label: 'Nike', count: 1 }]);
    expect(body.analytics.conditions).toEqual([{ condition: 'deadstock', count: 1 }]);
  });

  test('GET /analytics skips the snapshot query when no pair is catalog-linked', async () => {
    mockSelect.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const response = await statsRoutes.request('/analytics');

    expect(response.status).toBe(200);
    expect(mockSelect).toHaveBeenCalledTimes(2);
  });
});
