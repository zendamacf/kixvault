import { describe, expect, test } from 'bun:test';
import {
  formatCondition,
  formatCurrency,
  formatCurrencyPrecise,
  formatDate,
  getCatalogSourceLabel,
} from './utils';

describe('formatCurrency', () => {
  test('formats USD values without cents', () => {
    expect(formatCurrency(180)).toBe('$180');
  });

  test('returns an em dash for empty values', () => {
    expect(formatCurrency(null)).toBe('—');
    expect(formatCurrency(undefined)).toBe('—');
  });
});

describe('formatCurrencyPrecise', () => {
  test('always shows cents', () => {
    expect(formatCurrencyPrecise(12.5)).toBe('$12.50');
    expect(formatCurrencyPrecise(0)).toBe('$0.00');
    expect(formatCurrencyPrecise(null)).toBe('—');
  });
});

describe('formatCondition', () => {
  test('sentence-cases underscored condition values', () => {
    expect(formatCondition('lightly_worn')).toBe('Lightly worn');
    expect(formatCondition('deadstock')).toBe('Deadstock');
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
    expect(getCatalogSourceLabel(null)).toBeNull();
  });
});
