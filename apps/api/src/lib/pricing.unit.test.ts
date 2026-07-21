import { describe, expect, mock, test } from 'bun:test';

mock.module('./env', () => ({
  env: {
    databaseUrl: 'postgresql://example.com/db',
    kicksdbApiKey: 'KICKS-test-key',
    port: 3000,
    isProduction: false,
  },
}));

import type { StockXProduct } from '@kicksdb/sdk';

const { computeGainLoss, extractVariantPrices, matchVariantPrice, normalizeSizeValue } =
  await import('./pricing');

const stockxProductWithPrices = {
  slug: 'air-jordan-1-chicago',
  sku: 'DZ5485-612',
  variants: [
    {
      id: 'variant-10',
      size: '10',
      size_type: 'us m',
      prices: [{ price: 250, type: 'standard' }],
    },
    {
      id: 'variant-10-5',
      size: '10.5',
      size_type: 'us m',
      prices: [{ price: 255, type: 'standard' }],
    },
  ],
} as StockXProduct;

describe('normalizeSizeValue', () => {
  test('normalizes whole and half sizes', () => {
    expect(normalizeSizeValue(10)).toBe('10');
    expect(normalizeSizeValue('10.0')).toBe('10');
    expect(normalizeSizeValue(10.5)).toBe('10.5');
  });
});

describe('extractVariantPrices', () => {
  test('extracts standard prices from variants', () => {
    expect(extractVariantPrices(stockxProductWithPrices)).toEqual([
      {
        size: '10',
        sizeType: 'us m',
        price: 250,
        variantId: 'variant-10',
      },
      {
        size: '10.5',
        sizeType: 'us m',
        price: 255,
        variantId: 'variant-10-5',
      },
    ]);
  });
});

describe('matchVariantPrice', () => {
  test('matches numeric sizes to variant prices', () => {
    const variantPrices = extractVariantPrices(stockxProductWithPrices);

    expect(matchVariantPrice(10, variantPrices)?.price).toBe(250);
    expect(matchVariantPrice(10.5, variantPrices)?.price).toBe(255);
    expect(matchVariantPrice(11, variantPrices)).toBeNull();
  });
});

describe('computeGainLoss', () => {
  test('returns the difference when both values exist', () => {
    expect(computeGainLoss('200.00', 250)).toBe(50);
  });

  test('returns null when market price is missing', () => {
    expect(computeGainLoss('200.00', null)).toBeNull();
  });
});
