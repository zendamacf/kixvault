import { describe, expect, test } from 'bun:test';
import { QueryClient } from '@tanstack/react-query';
import { createJsonResponse, installFetchMock } from '@/test/mocks/api';

describe('catalogSearchQueryOptions', () => {
  test('returns catalog results from the API', async () => {
    installFetchMock({
      catalogSearch: async (url) => {
        expect(url.searchParams.get('q')).toBe('jordan');
        expect(url.searchParams.get('marketplace')).toBe('stockx');

        return createJsonResponse({
          results: [
            {
              catalogSource: 'kicksdb:stockx',
              catalogId: 'air-jordan-1',
              title: 'Air Jordan 1',
              brand: 'Jordan',
              model: 'Air Jordan 1',
              colorway: 'Chicago',
              sku: 'DZ5485-612',
              imageUrl: null,
            },
          ],
        });
      },
    });

    const { catalogSearchQueryOptions } = await import('./catalog');
    const client = new QueryClient();

    const result = await client.fetchQuery(catalogSearchQueryOptions('jordan', 'stockx'));

    expect(result.results).toHaveLength(1);
    expect(result.unavailable).toBeUndefined();
  });

  test('marks catalog search as unavailable when the API returns 503', async () => {
    installFetchMock({
      catalogSearch: async () => createJsonResponse({ error: 'Not configured' }, 503),
    });

    const { catalogSearchQueryOptions } = await import('./catalog');
    const client = new QueryClient();

    const result = await client.fetchQuery(catalogSearchQueryOptions('jordan', 'goat'));

    expect(result).toEqual({
      results: [],
      unavailable: true,
    });
  });
});
