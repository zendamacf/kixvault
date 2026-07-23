import { describe, expect, mock, test } from 'bun:test';

mock.module('./env', () => ({
  env: {
    databaseUrl: 'postgresql://example.com/db',
    kicksdbApiKey: 'KICKS-test-key',
    port: 3000,
    isProduction: false,
  },
}));

const { computeCollectionMarketStats } = await import('./collection-stats');

describe('computeCollectionMarketStats', () => {
  test('sums market value and gain/loss for priceable sneakers with prices', () => {
    const rows = [
      {
        catalogSource: 'kicksdb:stockx',
        sku: 'SKU-1',
        size: '10',
        condition: 'deadstock',
        purchasePrice: '200.00',
      },
      {
        catalogSource: 'kicksdb:stockx',
        sku: 'SKU-2',
        size: '11',
        condition: 'lightly_worn',
        purchasePrice: '150.00',
      },
      {
        catalogSource: null,
        sku: null,
        size: '9',
        condition: 'deadstock',
        purchasePrice: '100.00',
      },
      {
        catalogSource: null,
        sku: 'SKU-3',
        size: '12',
        condition: 'worn',
        purchasePrice: '80.00',
      },
    ] as const;

    const prices = new Map([
      ['kicksdb:stockx:SKU-1:10', { price: 250, pricedAt: new Date(), currency: 'USD' }],
      ['kicksdb:stockx:SKU-2:11', { price: 180, pricedAt: new Date(), currency: 'USD' }],
    ]);

    expect(computeCollectionMarketStats([...rows] as never, prices)).toEqual({
      totalMarketValue: 430,
      totalGainLoss: 80,
    });
  });

  test('returns null market stats when no priceable sneakers have prices', () => {
    const rows = [
      {
        catalogSource: 'kicksdb:stockx',
        sku: 'SKU-1',
        size: '10',
        condition: 'deadstock',
        purchasePrice: '200.00',
      },
    ] as const;

    expect(computeCollectionMarketStats([...rows], new Map())).toEqual({
      totalMarketValue: null,
      totalGainLoss: null,
    });
  });
});
