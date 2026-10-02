import { describe, expect, test } from 'bun:test';
import { QueryClient } from '@tanstack/react-query';
import { createJsonResponse, installFetchMock } from '@/test/mocks/api';

describe('sessionQueryOptions', () => {
  test('loads the current user session', async () => {
    installFetchMock({
      authMe: async () =>
        createJsonResponse({
          user: { id: 'user-1', email: 'collector@example.com' },
        }),
    });

    const { sessionQueryOptions } = await import('./queries');
    const client = new QueryClient();

    const result = await client.fetchQuery(sessionQueryOptions);

    expect(result).toEqual({
      user: { id: 'user-1', email: 'collector@example.com' },
    });
  });
});

describe('statsQueryOptions', () => {
  test('loads collection stats', async () => {
    installFetchMock({
      stats: async () =>
        createJsonResponse({
          stats: {
            count: 2,
            totalSpend: 360,
            avgSpend: 180,
            totalMarketValue: 400,
            totalGainLoss: 40,
          },
        }),
    });

    const { statsQueryOptions } = await import('./queries');
    const client = new QueryClient();

    const result = await client.fetchQuery(statsQueryOptions);

    expect(result).toEqual({
      stats: {
        count: 2,
        totalSpend: 360,
        avgSpend: 180,
        totalMarketValue: 400,
        totalGainLoss: 40,
      },
    });
  });
});

describe('sneakersQueryOptions', () => {
  test('loads filtered sneakers', async () => {
    installFetchMock({
      sneakers: async (url) => {
        expect(url.searchParams.get('search')).toBe('Nike');
        expect(url.searchParams.get('condition')).toBe('deadstock');

        return createJsonResponse({
          sneakers: [
            {
              id: '11111111-1111-4111-8111-111111111111',
              userId: 'user-1',
              brand: 'Nike',
              model: 'Air Max 1',
              colorway: 'Anniversary Red',
              size: 10,
              condition: 'deadstock',
              purchasePrice: 180,
              purchaseDate: '2024-06-15',
              notes: null,
              sku: null,
              primaryImage: null,
              catalogSource: null,
              catalogId: null,
              catalogUrl: null,
              nickname: null,
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-02T00:00:00.000Z',
            },
          ],
        });
      },
    });

    const { sneakersQueryOptions } = await import('./queries');
    const client = new QueryClient();

    const result = await client.fetchQuery(
      sneakersQueryOptions({
        search: 'Nike',
        condition: 'deadstock',
        sort: 'brand',
        order: 'asc',
      }),
    );

    expect(result.sneakers).toHaveLength(1);
    expect(result.sneakers[0]?.brand).toBe('Nike');
  });
});

describe('sneakerPriceHistoryQueryOptions', () => {
  test('loads price history for a sneaker', async () => {
    installFetchMock({
      sneakers: async (url) => {
        if (url.pathname.endsWith('/price-history')) {
          return createJsonResponse({
            history: [{ snapshotDate: '2026-07-20', price: 250, currency: 'USD' }],
          });
        }

        return createJsonResponse({ error: 'Unhandled sneaker route' }, 404);
      },
    });

    const { sneakerPriceHistoryQueryOptions } = await import('./queries');
    const client = new QueryClient();

    const result = await client.fetchQuery(sneakerPriceHistoryQueryOptions('sneaker-1'));

    expect(result.history).toHaveLength(1);
    expect(result.history[0]?.price).toBe(250);
  });
});

describe('wishlistQueryOptions', () => {
  test('loads grails for the signed-in user', async () => {
    installFetchMock({
      wishlist: async () =>
        createJsonResponse({
          items: [
            {
              id: '11111111-1111-4111-8111-111111111111',
              userId: 'user-1',
              brand: 'Nike',
              model: 'Dunk Low',
              colorway: null,
              priority: 'high',
              notes: null,
              sku: null,
              catalogSource: null,
              catalogId: null,
              catalogUrl: null,
              nickname: null,
              releaseDate: null,
              description: null,
              imageUrl: null,
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          ],
        }),
    });

    const { wishlistQueryOptions } = await import('./queries');
    const client = new QueryClient();
    const result = await client.fetchQuery(wishlistQueryOptions);

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.priority).toBe('high');
  });
});

describe('wishlistItemQueryOptions', () => {
  test('loads a single grail by id', async () => {
    installFetchMock({
      wishlist: async (url) =>
        createJsonResponse({
          item: {
            id: url.pathname.split('/').at(-1),
            userId: 'user-1',
            brand: 'Asics',
            model: 'Kayano',
            colorway: null,
            priority: 'medium',
            notes: null,
            sku: null,
            catalogSource: null,
            catalogId: null,
            catalogUrl: null,
            nickname: null,
            releaseDate: null,
            description: null,
            imageUrl: null,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        }),
    });

    const { wishlistItemQueryOptions } = await import('./queries');
    const client = new QueryClient();
    const result = await client.fetchQuery(
      wishlistItemQueryOptions('11111111-1111-4111-8111-111111111111'),
    );

    expect(result.item.brand).toBe('Asics');
  });
});

describe('sneakerQueryOptions', () => {
  test('loads a single sneaker by id', async () => {
    installFetchMock({
      sneakers: async (url) =>
        createJsonResponse({
          sneaker: {
            id: url.pathname.split('/').at(-1),
            userId: 'user-1',
            brand: 'Nike',
            model: 'Air Max 1',
            colorway: null,
            size: 10,
            condition: 'deadstock',
            purchasePrice: 180,
            purchaseDate: null,
            notes: null,
            sku: null,
            primaryImage: null,
            catalogSource: null,
            catalogId: null,
            catalogUrl: null,
            nickname: null,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-02T00:00:00.000Z',
          },
        }),
    });

    const { sneakerQueryOptions } = await import('./queries');
    const client = new QueryClient();

    const result = await client.fetchQuery(
      sneakerQueryOptions('11111111-1111-4111-8111-111111111111'),
    );

    expect(result.sneaker.brand).toBe('Nike');
  });
});
