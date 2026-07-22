import { describe, expect, test } from 'bun:test';
import { QueryClient } from '@tanstack/react-query';
import { createJsonResponse, installFetchMock } from '@/test/mocks/api';

describe('catalogSearchQueryOptions', () => {
  test('returns catalog results from the API', async () => {
    installFetchMock({
      catalogSearch: async (url) => {
        expect(url.searchParams.get('q')).toBe('jordan');
        expect(url.searchParams.has('marketplace')).toBe(false);

        return createJsonResponse({
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
      },
    });

    const { catalogSearchQueryOptions } = await import('./catalog');
    const client = new QueryClient();

    const result = await client.fetchQuery(catalogSearchQueryOptions('jordan'));

    expect(result.results).toHaveLength(1);
    expect(result.unavailable).toBeUndefined();
  });

  test('marks catalog search as unavailable when the API returns 503', async () => {
    installFetchMock({
      catalogSearch: async () => createJsonResponse({ error: 'Not configured' }, 503),
    });

    const { catalogSearchQueryOptions } = await import('./catalog');
    const client = new QueryClient();

    const result = await client.fetchQuery(catalogSearchQueryOptions('jordan'));

    expect(result).toEqual({
      results: [],
      unavailable: true,
    });
  });
});

describe('catalogProductQueryOptions', () => {
  test('loads catalog product detail with variant prices', async () => {
    installFetchMock({
      catalogProduct: async (url) => {
        expect(url.pathname).toBe('/api/catalog/products/air-jordan-1');

        return createJsonResponse({
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
      },
    });

    const { catalogProductQueryOptions } = await import('./catalog');
    const client = new QueryClient();

    const result = await client.fetchQuery(catalogProductQueryOptions('air-jordan-1'));

    expect(result.variantPrices).toHaveLength(1);
    expect(result.variantPrices[0]?.price).toBe(300);
  });
});
