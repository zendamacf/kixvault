import { describe, expect, test } from 'bun:test';
import { catalogSearchQuerySchema, catalogSearchResultSchema } from './catalog';

describe('catalogSearchQuerySchema', () => {
  test('applies default limit', () => {
    const result = catalogSearchQuerySchema.safeParse({ q: 'jordan 1' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(10);
    }
  });

  test('coerces limit from a string query value', () => {
    const result = catalogSearchQuerySchema.safeParse({
      q: 'dunk low',
      limit: '5',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(5);
    }
  });

  test('strips unknown query params', () => {
    const result = catalogSearchQuerySchema.safeParse({
      q: 'yeezy',
      marketplace: 'unused',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect('marketplace' in result.data).toBe(false);
    }
  });

  test('rejects queries shorter than 3 characters', () => {
    const result = catalogSearchQuerySchema.safeParse({ q: 'ab' });

    expect(result.success).toBe(false);
  });
});

describe('catalogSearchResultSchema', () => {
  test('accepts a normalized catalog result', () => {
    const result = catalogSearchResultSchema.safeParse({
      catalogSource: 'kicksdb:stockx',
      catalogId: 'air-jordan-1-chicago',
      title: 'Air Jordan 1 Retro High OG Chicago',
      brand: 'Jordan',
      model: 'Air Jordan 1',
      colorway: 'Chicago',
      nickname: 'Chicago',
      sku: 'DZ5485-612',
      imageUrl: 'https://images.stockx.com/example.png',
      gallery360Urls: ['https://images.stockx.com/example.png'],
      releaseDate: '2015-04-25',
      description: 'Released in 1985, the Air Jordan 1 changed basketball forever.',
      catalogUrl: 'https://stockx.com/air-jordan-1-chicago',
    });

    expect(result.success).toBe(true);
  });

  test('rejects invalid catalog source', () => {
    const result = catalogSearchResultSchema.safeParse({
      catalogSource: 'stockx',
      catalogId: 'air-jordan-1',
      title: 'Air Jordan 1',
      brand: 'Jordan',
      model: 'Air Jordan 1',
      colorway: null,
      nickname: null,
      sku: 'DZ5485-612',
      imageUrl: null,
      gallery360Urls: [],
      catalogUrl: null,
    });

    expect(result.success).toBe(false);
  });
});
