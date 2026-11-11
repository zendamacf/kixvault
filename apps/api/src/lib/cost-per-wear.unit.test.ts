import { describe, expect, test } from 'bun:test';
import { computeCostPerWear } from './cost-per-wear';

describe('computeCostPerWear', () => {
  test('divides price by wears and rounds to cents', () => {
    expect(computeCostPerWear('100.00', 3)).toBe(33.33);
    expect(computeCostPerWear(180, 4)).toBe(45);
  });

  test('returns null without a price or wears', () => {
    expect(computeCostPerWear(null, 5)).toBeNull();
    expect(computeCostPerWear('120', 0)).toBeNull();
  });

  test('returns 0 for a free pair', () => {
    expect(computeCostPerWear('0', 2)).toBe(0);
  });
});
