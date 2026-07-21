import { describe, expect, test } from 'bun:test';
import {
  isMarketValueApplicable,
  matchVariantPrice,
  normalizeSizeValue,
} from './pricing';

describe('pricing helpers', () => {
  test('normalizes sizes for matching', () => {
    expect(normalizeSizeValue(10)).toBe('10');
    expect(normalizeSizeValue(10.5)).toBe('10.5');
  });

  test('matches variant prices by size', () => {
    const matched = matchVariantPrice(10, [
      { size: '10', sizeType: 'us m', price: 220, variantId: 'variant-10' },
    ]);

    expect(matched?.price).toBe(220);
  });

  test('limits market value to deadstock and lightly worn', () => {
    expect(isMarketValueApplicable('deadstock')).toBe(true);
    expect(isMarketValueApplicable('lightly_worn')).toBe(true);
    expect(isMarketValueApplicable('worn')).toBe(false);
  });
});
