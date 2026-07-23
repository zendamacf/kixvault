import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import type { StockXProduct } from '@kicksdb/sdk';
import {
  mockGetStockxProduct,
  mockGetStockxProducts,
  mockKicksdbSdk,
  resetKicksdbSdkMocks,
} from '../test/mocks/kicksdb';

mockKicksdbSdk();

mock.module('./env', () => ({
  env: {
    kicksdbApiKey: 'KICKS-test-key',
    databaseUrl: 'postgresql://example.com/db',
    port: 3000,
    isProduction: false,
  },
}));

const stockxProduct = {
  slug: 'air-jordan-1-chicago',
  title: 'Air Jordan 1 Retro High OG Chicago',
  brand: 'Jordan',
  model: 'Air Jordan 1',
  primary_title: 'Air Jordan 1 Retro High OG',
  secondary_title: 'Chicago',
  sku: 'DZ5485-612',
  image: 'https://images.stockx.com/chicago.png',
  gallery: ['https://images.stockx.com/chicago-alt.png'],
  gallery_360: [
    'https://images.stockx.com/360/chicago-01.png',
    'https://images.stockx.com/360/chicago-02.png',
  ],
  link: 'https://stockx.com/air-jordan-1-chicago',
  description: '<p>Released in 1985, the Air Jordan 1 changed basketball forever.</p>',
  traits: [{ trait: 'Release Date', value: '2015-04-25' }],
} as StockXProduct;

describe('catalog normalization', () => {
  test('normalizeStockxProduct maps StockX fields', async () => {
    const { normalizeStockxProduct } = await import('./catalog');

    expect(normalizeStockxProduct(stockxProduct)).toEqual({
      catalogSource: 'kicksdb:stockx',
      catalogId: 'air-jordan-1-chicago',
      title: 'Air Jordan 1 Retro High OG Chicago',
      brand: 'Jordan',
      model: 'Air Jordan 1',
      colorway: 'Chicago',
      nickname: 'Chicago',
      sku: 'DZ5485-612',
      imageUrl: 'https://images.stockx.com/chicago.png?bg-remove=true',
      gallery360Urls: [
        'https://images.stockx.com/360/chicago-01.png?bg-remove=true',
        'https://images.stockx.com/360/chicago-02.png?bg-remove=true',
      ],
      releaseDate: '2015-04-25',
      description: 'Released in 1985, the Air Jordan 1 changed basketball forever.',
    });
  });

  test('extractStockxPrimaryImageUrl uses only the primary image', async () => {
    const { extractStockxPrimaryImageUrl } = await import('./catalog');

    expect(extractStockxPrimaryImageUrl(stockxProduct)).toBe(
      'https://images.stockx.com/chicago.png?bg-remove=true',
    );
  });

  test('extractStockxGallery360Urls ignores the regular gallery', async () => {
    const { extractStockxGallery360Urls } = await import('./catalog');

    expect(
      extractStockxGallery360Urls({
        ...stockxProduct,
        gallery: [
          'https://images.stockx.com/chicago.png',
          'https://images.stockx.com/chicago-alt.png',
        ],
        gallery_360: [
          'https://images.stockx.com/360/chicago-01.png',
          'https://images.stockx.com/360/chicago-01.png',
          'https://images.stockx.com/360/chicago-02.png',
        ],
      } as StockXProduct),
    ).toEqual([
      'https://images.stockx.com/360/chicago-01.png?bg-remove=true',
      'https://images.stockx.com/360/chicago-02.png?bg-remove=true',
    ]);
  });
});

describe('fetchCatalogProduct', () => {
  beforeEach(async () => {
    resetKicksdbSdkMocks();
    const catalog = await import('./catalog');
    catalog.resetCatalogCacheForTests();
  });

  afterEach(async () => {
    const catalog = await import('./catalog');
    catalog.resetCatalogCacheForTests();
  });

  test('fetches and normalizes a StockX product by slug', async () => {
    mockGetStockxProduct.mockImplementation(() =>
      Promise.resolve({
        data: { data: stockxProduct },
        error: null,
        response: { status: 200 },
      }),
    );

    const { fetchCatalogProduct } = await import('./catalog');
    const result = await fetchCatalogProduct('kicksdb:stockx', 'air-jordan-1-chicago');

    expect(result.catalogSource).toBe('kicksdb:stockx');
    expect(result.catalogId).toBe('air-jordan-1-chicago');
    expect(result.releaseDate).toBe('2015-04-25');
    expect(mockGetStockxProduct).toHaveBeenCalledTimes(1);
  });

  test('rejects detached GOAT catalog sources', async () => {
    const { fetchCatalogProduct, CatalogSearchError } = await import('./catalog');

    await expect(fetchCatalogProduct('kicksdb:goat', 'missing-slug')).rejects.toBeInstanceOf(
      CatalogSearchError,
    );
  });

  test('throws CatalogProductNotFoundError when the product is missing', async () => {
    mockGetStockxProduct.mockImplementation(() =>
      Promise.resolve({
        data: null,
        error: { message: 'not found' },
        response: { status: 404 },
      }),
    );

    const { fetchCatalogProduct, CatalogProductNotFoundError } = await import('./catalog');

    await expect(fetchCatalogProduct('kicksdb:stockx', 'missing-slug')).rejects.toBeInstanceOf(
      CatalogProductNotFoundError,
    );
  });

  test('caches product lookups for repeated requests', async () => {
    mockGetStockxProduct.mockImplementation(() =>
      Promise.resolve({
        data: { data: stockxProduct },
        error: null,
        response: { status: 200 },
      }),
    );

    const { fetchCatalogProduct } = await import('./catalog');

    const first = await fetchCatalogProduct('kicksdb:stockx', 'air-jordan-1-chicago');
    const second = await fetchCatalogProduct('kicksdb:stockx', 'air-jordan-1-chicago');

    expect(second).toEqual(first);
    expect(mockGetStockxProduct).toHaveBeenCalledTimes(1);
  });

  test('returns a product from the search cache without calling KicksDB', async () => {
    mockGetStockxProducts.mockImplementation(() =>
      Promise.resolve({
        data: { data: [stockxProduct] },
        error: null,
        response: { status: 200 },
      }),
    );

    const { searchCatalog, fetchCatalogProduct } = await import('./catalog');

    await searchCatalog('jordan 1', 10);
    const result = await fetchCatalogProduct('kicksdb:stockx', 'air-jordan-1-chicago');

    expect(result.catalogId).toBe('air-jordan-1-chicago');
    expect(mockGetStockxProduct).not.toHaveBeenCalled();
  });
});

describe('normalizeCatalogSearchQuery', () => {
  test('collapses internal whitespace and lowercases', async () => {
    const { normalizeCatalogSearchQuery } = await import('./catalog');

    expect(normalizeCatalogSearchQuery('  Jordan   1  ')).toBe('jordan 1');
  });
});

describe('searchCatalog', () => {
  beforeEach(async () => {
    resetKicksdbSdkMocks();
    const catalog = await import('./catalog');
    catalog.resetCatalogCacheForTests();
  });

  afterEach(async () => {
    const catalog = await import('./catalog');
    catalog.resetCatalogCacheForTests();
  });

  test('searches StockX and caches repeated queries', async () => {
    mockGetStockxProducts.mockImplementation(() =>
      Promise.resolve({
        data: { data: [stockxProduct] },
        error: null,
        response: { status: 200 },
      }),
    );

    const { searchCatalog } = await import('./catalog');

    const first = await searchCatalog('jordan 1', 10);
    const second = await searchCatalog('jordan 1', 10);

    expect(first).toHaveLength(1);
    expect(second).toEqual(first);
    expect(mockGetStockxProducts).toHaveBeenCalledTimes(1);
  });

  test('throws CatalogSearchError when the SDK returns an error', async () => {
    mockGetStockxProducts.mockImplementation(() =>
      Promise.resolve({
        data: null,
        error: { message: 'upstream failure' },
        response: { status: 502 },
      }),
    );

    const { searchCatalog, CatalogSearchError } = await import('./catalog');

    await expect(searchCatalog('broken query', 10)).rejects.toBeInstanceOf(CatalogSearchError);
  });

  test('caches empty search results', async () => {
    mockGetStockxProducts.mockImplementation(() =>
      Promise.resolve({
        data: { data: [] },
        error: null,
        response: { status: 200 },
      }),
    );

    const { searchCatalog } = await import('./catalog');

    const first = await searchCatalog('nonexistent shoe', 10);
    const second = await searchCatalog('nonexistent shoe', 10);

    expect(first).toEqual([]);
    expect(second).toEqual([]);
    expect(mockGetStockxProducts).toHaveBeenCalledTimes(1);
  });

  test('reuses cache across queries that differ only by whitespace', async () => {
    mockGetStockxProducts.mockImplementation(() =>
      Promise.resolve({
        data: { data: [stockxProduct] },
        error: null,
        response: { status: 200 },
      }),
    );

    const { searchCatalog } = await import('./catalog');

    await searchCatalog('jordan  1', 10);
    await searchCatalog('  JORDAN 1  ', 10);

    expect(mockGetStockxProducts).toHaveBeenCalledTimes(1);
  });

  test('reuses cache across different result limits', async () => {
    mockGetStockxProducts.mockImplementation(() =>
      Promise.resolve({
        data: { data: [stockxProduct] },
        error: null,
        response: { status: 200 },
      }),
    );

    const { searchCatalog } = await import('./catalog');

    await searchCatalog('jordan 1', 5);
    await searchCatalog('jordan 1', 10);

    expect(mockGetStockxProducts).toHaveBeenCalledTimes(1);
    expect(mockGetStockxProducts).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ limit: 20n }),
      }),
    );
  });
});
