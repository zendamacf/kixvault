import { describe, expect, test } from 'bun:test';
import {
  type AnalyticsSnapshot,
  type AnalyticsSneaker,
  buildAnalytics,
  buildBrandBreakdown,
  buildConditionBreakdown,
  buildCostPerWear,
  buildMostWorn,
  buildPortfolioValue,
  buildRealized,
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

describe('buildCostPerWear', () => {
  const sneakers = [
    sneaker({ id: 'a', model: 'Alpha', purchasePrice: '100' }),
    sneaker({ id: 'b', model: 'Beta', purchasePrice: '90' }),
    sneaker({ id: 'c', model: 'Gamma', purchasePrice: null }),
    sneaker({ id: 'd', model: 'Delta', purchasePrice: '50' }),
  ];
  const wears = [
    { sneakerId: 'a', wornOn: '2026-11-01' },
    { sneakerId: 'b', wornOn: '2026-11-01' },
    { sneakerId: 'b', wornOn: '2026-11-02' },
    { sneakerId: 'b', wornOn: '2026-11-03' },
    { sneakerId: 'c', wornOn: '2026-11-01' },
  ];

  test('ranks pairs with a price and wears, lowest first for best', () => {
    const result = buildCostPerWear(wears, sneakers, 5);

    expect(result.best.map((entry) => [entry.sneakerId, entry.costPerWear])).toEqual([
      ['b', 30],
      ['a', 100],
    ]);
    expect(result.worst.map((entry) => entry.sneakerId)).toEqual(['a', 'b']);
  });

  test('averages total paid over total wears', () => {
    expect(buildCostPerWear(wears, sneakers).average).toBe(47.5);
  });

  test('returns empty lists when nothing qualifies', () => {
    expect(buildCostPerWear([], sneakers)).toEqual({ average: null, best: [], worst: [] });
  });

  test('is included in buildAnalytics for active pairs only', () => {
    const retired = sneaker({
      id: 'r',
      purchasePrice: '10',
      departureType: 'sold',
      departedOn: '2026-10-01',
    });
    const result = buildAnalytics({
      sneakers: [...sneakers, retired],
      snapshots: [],
      wears: [...wears, { sneakerId: 'r', wornOn: '2026-09-01' }],
      now: new Date('2026-11-11T00:00:00Z'),
    });

    expect(result.costPerWear.best.map((entry) => entry.sneakerId)).toEqual(['b', 'a']);
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

describe('retired pairs', () => {
  test('portfolio value keeps a pair up to its departure date and drops it after', () => {
    const sneakers = [
      sneaker({ departureType: 'sold', departedOn: '2026-07-08' }),
      sneaker({ id: 's2', sku: 'SKU-2' }),
    ];
    const snapshots = [
      snapshot('2026-07-01', '100.00'),
      snapshot('2026-07-08', '110.00'),
      snapshot('2026-07-15', '120.00'),
      snapshot('2026-07-01', '200.00', { sku: 'SKU-2' }),
      snapshot('2026-07-15', '210.00', { sku: 'SKU-2' }),
    ];

    expect(buildPortfolioValue(sneakers, snapshots)).toEqual([
      { date: '2026-07-01', value: 300, pairs: 2 },
      { date: '2026-07-08', value: 310, pairs: 2 },
      { date: '2026-07-15', value: 210, pairs: 1 },
    ]);
  });

  test('buildRealized totals sold pairs and leaves other departures out', () => {
    const result = buildRealized([
      sneaker({
        id: 'a',
        model: 'Dunk',
        departureType: 'sold',
        departedOn: '2026-03-01',
        salePrice: '250.00',
        purchasePrice: '180.00',
      }),
      sneaker({
        id: 'b',
        model: 'Jordan 1',
        departureType: 'sold',
        departedOn: '2026-05-01',
        salePrice: '150.00',
        purchasePrice: '200.00',
      }),
      sneaker({ id: 'c', departureType: 'gifted', departedOn: '2026-06-01' }),
      sneaker({
        id: 'd',
        departureType: 'traded',
        departedOn: '2026-06-02',
        salePrice: '90.00',
        purchasePrice: '60.00',
      }),
      sneaker({ id: 'e' }),
    ]);

    expect(result.soldCount).toBe(2);
    expect(result.totalGainLoss).toBe(20);
    expect(result.sales.map((sale) => [sale.name, sale.gainLoss])).toEqual([
      ['Jordan 1', -50],
      ['Dunk', 70],
    ]);
  });

  test('buildRealized lists a sold pair with no purchase price but skips it in the total', () => {
    const result = buildRealized([
      sneaker({ id: 'a', departureType: 'sold', departedOn: '2026-03-01', salePrice: '250.00' }),
    ]);

    expect(result.soldCount).toBe(1);
    expect(result.sales[0]).toMatchObject({ purchasePrice: null, gainLoss: null });
    expect(result.totalGainLoss).toBeNull();
  });

  test('buildRealized is empty when nothing was sold', () => {
    expect(buildRealized([sneaker()])).toEqual({ totalGainLoss: null, soldCount: 0, sales: [] });
  });

  test('buildAnalytics counts only active pairs outside the value history and realized figures', () => {
    const analytics = buildAnalytics({
      sneakers: [
        sneaker({ id: 'a', brand: 'Nike' }),
        sneaker({
          id: 'b',
          brand: 'Adidas',
          sku: 'SKU-2',
          departureType: 'sold',
          departedOn: '2026-07-08',
          salePrice: '300.00',
          purchasePrice: '250.00',
        }),
      ],
      snapshots: [
        snapshot('2026-07-01', '100.00'),
        snapshot('2026-07-01', '280.00', { sku: 'SKU-2' }),
      ],
      wears: [
        { sneakerId: 'a', wornOn: '2026-07-02' },
        { sneakerId: 'b', wornOn: '2026-07-03' },
      ],
      now: new Date('2026-07-10T00:00:00Z'),
    });

    expect(analytics.totalPairs).toBe(1);
    expect(analytics.trackedPairs).toBe(1);
    expect(analytics.brands).toEqual([{ label: 'Nike', count: 1 }]);
    expect(analytics.mostWorn.map((entry) => entry.sneakerId)).toEqual(['a']);
    expect(analytics.portfolioValue).toEqual([{ date: '2026-07-01', value: 380, pairs: 2 }]);
    expect(analytics.wearsByMonth.at(-1)).toEqual({ month: '2026-07', count: 2 });
    expect(analytics.realized.totalGainLoss).toBe(50);
  });
});
