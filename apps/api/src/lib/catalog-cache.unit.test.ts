import { afterEach, describe, expect, test } from 'bun:test';
import type { CatalogSearchResult } from '@kixvault/shared';
import {
  type CatalogSearchCache,
  getCatalogSearchCache,
  resetCatalogSearchCacheForTests,
} from './catalog-cache';

const sampleResult: CatalogSearchResult = {
  catalogSource: 'kicksdb:stockx',
  catalogId: 'air-jordan-1',
  title: 'Air Jordan 1',
  brand: 'Jordan',
  model: 'Air Jordan 1',
  colorway: 'Chicago',
  nickname: 'Chicago',
  sku: 'DZ5485-612',
  imageUrl: 'https://images.stockx.com/example.png',
  gallery360Urls: ['https://images.stockx.com/example.png'],
  releaseDate: '2015-04-25',
  description: 'Classic sneaker.',
};

describe('InMemoryCatalogSearchCache', () => {
  let cache: CatalogSearchCache;

  afterEach(() => {
    resetCatalogSearchCacheForTests();
  });

  test('stores and retrieves search results', async () => {
    cache = getCatalogSearchCache();
    await cache.set('stockx:jordan:10', [sampleResult], 60_000);

    await expect(cache.get('stockx:jordan:10')).resolves.toEqual([sampleResult]);
  });

  test('caches empty result sets', async () => {
    cache = getCatalogSearchCache();
    await cache.set('stockx:missing:10', [], 60_000);

    await expect(cache.get('stockx:missing:10')).resolves.toEqual([]);
  });

  test('expires entries after the TTL', async () => {
    cache = getCatalogSearchCache();
    await cache.set('stockx:jordan:10', [sampleResult], 1);

    await Bun.sleep(5);

    await expect(cache.get('stockx:jordan:10')).resolves.toBeNull();
  });

  test('clear removes all entries', async () => {
    cache = getCatalogSearchCache();
    await cache.set('stockx:jordan:10', [sampleResult], 60_000);
    await cache.clear();

    await expect(cache.get('stockx:jordan:10')).resolves.toBeNull();
  });
});
