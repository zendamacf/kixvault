import { describe, expect, test } from 'bun:test';
import { catalogProductDetailSchema, collectionStatsSchema, variantPriceSchema } from './pricing';

describe('pricing schemas', () => {
  test('parses variant prices', () => {
    expect(
      variantPriceSchema.parse({
        size: '10',
        sizeType: 'us m',
        price: 250,
        variantId: 'variant-10',
      }),
    ).toEqual({
      size: '10',
      sizeType: 'us m',
      price: 250,
      variantId: 'variant-10',
    });
  });

  test('parses catalog product detail', () => {
    expect(
      catalogProductDetailSchema.parse({
        product: {
          catalogSource: 'kicksdb:stockx',
          catalogId: 'air-jordan-1',
          title: 'Air Jordan 1',
          brand: 'Jordan',
          model: 'Air Jordan 1',
          colorway: 'Chicago',
          nickname: 'Chicago',
          sku: 'DZ5485-612',
          imageUrl: null,
          imageUrls: [],
          releaseDate: null,
          description: null,
        },
        variantPrices: [
          {
            size: '10',
            sizeType: 'us m',
            price: 250,
            variantId: 'variant-10',
          },
        ],
      }),
    ).toBeDefined();
  });

  test('parses collection stats', () => {
    expect(
      collectionStatsSchema.parse({
        count: 2,
        totalSpend: 300,
        avgSpend: 150,
        totalMarketValue: 250,
        totalGainLoss: 50,
      }),
    ).toEqual({
      count: 2,
      totalSpend: 300,
      avgSpend: 150,
      totalMarketValue: 250,
      totalGainLoss: 50,
    });
  });
});
