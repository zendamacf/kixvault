import { describe, expect, test } from 'bun:test';
import { matchVariantPrice, normalizeSizeValue, sortSnapshotsAscending } from './pricing';

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

  test('sorts snapshots oldest-first without mutating the input', () => {
    const input = [
      { snapshotDate: '2026-07-20', price: 250 },
      { snapshotDate: '2026-07-06', price: 230 },
      { snapshotDate: '2026-07-13', price: 240 },
    ];

    expect(sortSnapshotsAscending(input).map((entry) => entry.snapshotDate)).toEqual([
      '2026-07-06',
      '2026-07-13',
      '2026-07-20',
    ]);
    expect(input[0]?.snapshotDate).toBe('2026-07-20');
  });
});
