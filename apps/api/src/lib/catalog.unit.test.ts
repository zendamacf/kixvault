import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import type { GoatProduct, StockXProduct } from '@kicksdb/sdk';
import {
  mockGetGoatProduct,
  mockGetGoatProducts,
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
  link: 'https://stockx.com/air-jordan-1-chicago',
  description: '<p>Released in 1985, the Air Jordan 1 changed basketball forever.</p>',
  traits: [{ trait: 'Release Date', value: '2015-04-25' }],
} as StockXProduct;

const goatProduct = {
  slug: 'air-jordan-1-chicago-goat',
  name: 'Air Jordan 1 Retro High OG Chicago',
  brand: 'Jordan',
  model: 'Air Jordan 1',
  colorway: 'White/Black-Varsity Red',
  nickname: 'Chicago',
  sku: 'DZ5485-612',
  image_url: 'https://images.goat.com/chicago.png',
  images: ['https://images.goat.com/chicago-alt.png'],
  link: 'https://www.goat.com/sneakers/air-jordan-1-chicago-goat',
  description: 'Released in December 2016, the Nike SB Dunk Low Pro OG QS.',
  release_date: '2016-12-13T23:59:59.999Z',
} as GoatProduct;

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
      imageUrl: 'https://images.stockx.com/chicago.png',
      releaseDate: '2015-04-25',
      description: 'Released in 1985, the Air Jordan 1 changed basketball forever.',
    });
  });

  test('normalizeGoatProduct maps GOAT fields', async () => {
    const { normalizeGoatProduct } = await import('./catalog');

    expect(normalizeGoatProduct(goatProduct)).toEqual({
      catalogSource: 'kicksdb:goat',
      catalogId: 'air-jordan-1-chicago-goat',
      title: 'Air Jordan 1 Retro High OG Chicago',
      brand: 'Jordan',
      model: 'Air Jordan 1',
      colorway: 'White/Black-Varsity Red',
      nickname: 'Chicago',
      sku: 'DZ5485-612',
      imageUrl: 'https://images.goat.com/chicago.png',
      releaseDate: '2016-12-13',
      description: 'Released in December 2016, the Nike SB Dunk Low Pro OG QS.',
    });
  });
});

describe('fetchCatalogProduct', () => {
  beforeEach(() => {
    resetKicksdbSdkMocks();
  });

  test('fetches and normalizes a GOAT product by slug', async () => {
    mockGetGoatProduct.mockImplementation(() =>
      Promise.resolve({
        data: { data: goatProduct },
        error: null,
        response: { status: 200 },
      }),
    );

    const { fetchCatalogProduct } = await import('./catalog');
    const result = await fetchCatalogProduct('kicksdb:goat', 'air-jordan-1-chicago-goat');

    expect(result.catalogSource).toBe('kicksdb:goat');
    expect(result.catalogId).toBe('air-jordan-1-chicago-goat');
    expect(result.releaseDate).toBe('2016-12-13');
    expect(mockGetGoatProduct).toHaveBeenCalledTimes(1);
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

  test('throws CatalogProductNotFoundError when the product is missing', async () => {
    mockGetGoatProduct.mockImplementation(() =>
      Promise.resolve({
        data: null,
        error: { message: 'not found' },
        response: { status: 404 },
      }),
    );

    const { fetchCatalogProduct, CatalogProductNotFoundError } = await import('./catalog');

    await expect(fetchCatalogProduct('kicksdb:goat', 'missing-slug')).rejects.toBeInstanceOf(
      CatalogProductNotFoundError,
    );
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

    const first = await searchCatalog('jordan 1', 10, 'stockx');
    const second = await searchCatalog('jordan 1', 10, 'stockx');

    expect(first).toHaveLength(1);
    expect(second).toEqual(first);
    expect(mockGetStockxProducts).toHaveBeenCalledTimes(1);
  });

  test('searches GOAT when marketplace is goat', async () => {
    mockGetGoatProducts.mockImplementation(() =>
      Promise.resolve({
        data: { data: [goatProduct] },
        error: null,
        response: { status: 200 },
      }),
    );

    const { searchCatalog } = await import('./catalog');
    const results = await searchCatalog('jordan 1', 5, 'goat');

    expect(results[0]?.catalogSource).toBe('kicksdb:goat');
    expect(mockGetGoatProducts).toHaveBeenCalledTimes(1);
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

    await expect(searchCatalog('broken query', 10, 'stockx')).rejects.toBeInstanceOf(
      CatalogSearchError,
    );
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

    const first = await searchCatalog('nonexistent shoe', 10, 'stockx');
    const second = await searchCatalog('nonexistent shoe', 10, 'stockx');

    expect(first).toEqual([]);
    expect(second).toEqual([]);
    expect(mockGetStockxProducts).toHaveBeenCalledTimes(1);
  });
});
