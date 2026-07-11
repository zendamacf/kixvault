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
          stats: { count: 2, totalSpend: 360, avgSpend: 180 },
        }),
    });

    const { statsQueryOptions } = await import('./queries');
    const client = new QueryClient();

    const result = await client.fetchQuery(statsQueryOptions);

    expect(result).toEqual({
      stats: { count: 2, totalSpend: 360, avgSpend: 180 },
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
              imageUrl: null,
              catalogSource: null,
              catalogId: null,
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
            imageUrl: null,
            catalogSource: null,
            catalogId: null,
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
