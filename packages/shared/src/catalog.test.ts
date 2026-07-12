import { describe, expect, test } from 'bun:test';
import { buildCatalogUrl } from './catalog';

describe('buildCatalogUrl', () => {
  test('returns the provided link when available', () => {
    expect(
      buildCatalogUrl('kicksdb:stockx', 'air-jordan-1', 'https://stockx.com/custom-link'),
    ).toBe('https://stockx.com/custom-link');
  });

  test('builds StockX URLs from slug', () => {
    expect(buildCatalogUrl('kicksdb:stockx', 'air-jordan-1-chicago')).toBe(
      'https://stockx.com/air-jordan-1-chicago',
    );
  });

  test('builds GOAT URLs from slug', () => {
    expect(buildCatalogUrl('kicksdb:goat', 'air-jordan-1-chicago-goat')).toBe(
      'https://www.goat.com/sneakers/air-jordan-1-chicago-goat',
    );
  });

  test('returns null when slug is missing', () => {
    expect(buildCatalogUrl('kicksdb:stockx', '')).toBeNull();
  });
});
