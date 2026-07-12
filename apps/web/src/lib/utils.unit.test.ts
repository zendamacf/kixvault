import { describe, expect, test } from 'bun:test';
import { formatCondition, formatCurrency, formatDate, getCatalogSourceLabel } from './utils';

describe('formatCurrency', () => {
  test('formats USD values without cents', () => {
    expect(formatCurrency(180)).toBe('$180');
  });

  test('returns an em dash for empty values', () => {
    expect(formatCurrency(null)).toBe('—');
    expect(formatCurrency(undefined)).toBe('—');
  });
});

describe('formatCondition', () => {
  test('title-cases underscored condition values', () => {
    expect(formatCondition('lightly_worn')).toBe('Lightly Worn');
  });
});

describe('formatDate', () => {
  test('formats ISO date strings', () => {
    expect(formatDate('2024-06-15')).toMatch(/Jun 15, 2024/);
  });

  test('returns an em dash for empty values', () => {
    expect(formatDate(null)).toBe('—');
  });
});

describe('getCatalogSourceLabel', () => {
  test('maps catalog sources to marketplace labels', () => {
    expect(getCatalogSourceLabel('kicksdb:stockx')).toBe('StockX');
    expect(getCatalogSourceLabel('kicksdb:goat')).toBe('GOAT');
    expect(getCatalogSourceLabel(null)).toBeNull();
  });
});
