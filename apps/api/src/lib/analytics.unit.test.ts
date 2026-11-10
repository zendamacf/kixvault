import { describe, expect, test } from 'bun:test';
import {
  type AnalyticsSnapshot,
  type AnalyticsSneaker,
  buildAnalytics,
  buildBrandBreakdown,
  buildConditionBreakdown,
  buildMostWorn,
  buildPortfolioValue,
  buildWearsByMonth,
} from './analytics';

function sneaker(overrides: Partial<AnalyticsSneaker> = {}): AnalyticsSneaker {
  return {
    id: 's1',
    brand: 'Nike',
    model: 'Air Max 1',
    nickname: null,
    condition: 'deadstock',
    size: '10.0',
    sku: 'SKU-1',
    catalogSource: 'kicksdb:stockx',
    purchaseDate: null,
    ...overrides,
  };
}

function snapshot(date: string, price: string, overrides: Partial<AnalyticsSnapshot> = {}) {
  return {
    catalogSource: 'kicksdb:stockx',
    sku: 'SKU-1',
    size: '10.0',
    snapshotDate: date,
    price,
    ...overrides,
  };
}

describe('buildPortfolioValue', () => {
  test('sums the latest known price of each pair per date', () => {
    const sneakers = [sneaker(), sneaker({ id: 's2', sku: 'SKU-2' })];
    const snapshots = [
      snapshot('2026-07-01', '100.00'),
      snapshot('2026-07-08', '110.00'),
      snapshot('2026-07-08', '200.00', { sku: 'SKU-2' }),
      snapshot('2026-07-15', '120.00'),
    ];

    expect(buildPortfolioValue(sneakers, snapshots)).toEqual([
      { date: '2026-07-01', value: 100, pairs: 1 },
      { date: '2026-07-08', value: 310, pairs: 2 },
      // SKU-2 has no snapshot on the 15th, so its last price carries forward.
      { date: '2026-07-15', value: 320, pairs: 2 },
    ]);
  });

  test('ignores snapshots before the purchase date', () => {
    const sneakers = [sneaker({ purchaseDate: '2026-07-08' })];
    const snapshots = [snapshot('2026-07-01', '100.00'), snapshot('2026-07-08', '110.00')];

    expect(buildPortfolioValue(sneakers, snapshots)).toEqual([
      { date: '2026-07-08', value: 110, pairs: 1 },
    ]);
  });

  test('skips pairs without a catalog link and matches sizes numerically', () => {
    const sneakers = [sneaker({ size: '10' }), sneaker({ id: 's2', sku: null })];

    expect(buildPortfolioValue(sneakers, [snapshot('2026-07-01', '100.00')])).toEqual([
      { date: '2026-07-01', value: 100, pairs: 1 },
    ]);
  });

  test('counts two copies of the same pair twice', () => {
    const sneakers = [sneaker(), sneaker({ id: 's2' })];

    expect(buildPortfolioValue(sneakers, [snapshot('2026-07-01', '100.00')])).toEqual([
      { date: '2026-07-01', value: 200, pairs: 2 },
    ]);
  });

  test('returns an empty series with no snapshots', () => {
    expect(buildPortfolioValue([sneaker()], [])).toEqual([]);
  });
});

describe('buildWearsByMonth', () => {
  test('fills empty months and drops wears outside the window', () => {
    const result = buildWearsByMonth(
      [
        { sneakerId: 'a', wornOn: '2026-11-02' },
        { sneakerId: 'a', wornOn: '2026-11-09' },
        { sneakerId: 'b', wornOn: '2026-09-15' },
        { sneakerId: 'b', wornOn: '2025-01-15' },
      ],
      new Date('2026-11-10T12:00:00Z'),
      3,
    );

    expect(result).toEqual([
      { month: '2026-09', count: 1 },
      { month: '2026-10', count: 0 },
      { month: '2026-11', count: 2 },
    ]);
  });

  test('spans a year boundary', () => {
    const result = buildWearsByMonth([], new Date('2026-01-20T00:00:00Z'), 3);

    expect(result.map((point) => point.month)).toEqual(['2025-11', '2025-12', '2026-01']);
  });
});

describe('buildMostWorn', () => {
  test('ranks pairs by wear count using nickname when set', () => {
    const sneakers = [
      sneaker({ id: 'a', model: 'Zeta' }),
      sneaker({ id: 'b', model: 'Beta', nickname: 'Chicago' }),
      sneaker({ id: 'c', model: 'Gamma' }),
    ];
    const wears = [
      { sneakerId: 'a', wornOn: '2026-11-01' },
      { sneakerId: 'b', wornOn: '2026-11-01' },
      { sneakerId: 'b', wornOn: '2026-11-02' },
      { sneakerId: 'gone', wornOn: '2026-11-02' },
    ];

    expect(buildMostWorn(wears, sneakers, 2)).toEqual([
      { sneakerId: 'b', name: 'Chicago', count: 2 },
      { sneakerId: 'a', name: 'Zeta', count: 1 },
    ]);
  });
});

describe('breakdowns', () => {
  test('groups brands beyond the limit into Other', () => {
    const sneakers = [
      sneaker({ id: '1', brand: 'Nike' }),
      sneaker({ id: '2', brand: 'Nike' }),
      sneaker({ id: '3', brand: 'adidas' }),
      sneaker({ id: '4', brand: 'Puma' }),
      sneaker({ id: '5', brand: 'Asics' }),
    ];

    expect(buildBrandBreakdown(sneakers, 2)).toEqual([
      { label: 'Nike', count: 2 },
      { label: 'adidas', count: 1 },
      { label: 'Other', count: 2 },
    ]);
  });

  test('lists conditions in order and omits empty ones', () => {
    const sneakers = [
      sneaker({ id: '1', condition: 'worn' }),
      sneaker({ id: '2', condition: 'deadstock' }),
      sneaker({ id: '3', condition: 'worn' }),
    ];

    expect(buildConditionBreakdown(sneakers)).toEqual([
      { condition: 'deadstock', count: 1 },
      { condition: 'worn', count: 2 },
    ]);
  });
});

describe('buildAnalytics', () => {
  test('reports tracked and total pairs', () => {
    const result = buildAnalytics({
      sneakers: [sneaker(), sneaker({ id: 's2', sku: null, catalogSource: null })],
      snapshots: [],
      wears: [],
      now: new Date('2026-11-10T00:00:00Z'),
    });

    expect(result.trackedPairs).toBe(1);
    expect(result.totalPairs).toBe(2);
    expect(result.wearsByMonth).toHaveLength(12);
  });
});
