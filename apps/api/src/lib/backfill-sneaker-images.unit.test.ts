import { beforeEach, describe, expect, mock, test } from 'bun:test';

const mockFetchCatalogProduct = mock(async () => ({
  catalogSource: 'kicksdb:stockx' as const,
  catalogId: 'air-max-1',
  title: 'Nike Air Max 1',
  brand: 'Nike',
  model: 'Air Max 1',
  colorway: 'Anniversary Red',
  nickname: 'Big Bubble',
  sku: 'TEST-SKU-001',
  imageUrl: 'https://images.example.com/primary.png',
  imageUrls: [
    'https://images.example.com/primary.png',
    'https://images.example.com/gallery.png',
  ],
  releaseDate: '2015-04-25',
  description: 'The original Air Max with visible Air cushioning.',
}));

const mockReplaceSneakerImages = mock(async () => []);

mock.module('./catalog', () => ({
  fetchCatalogProduct: mockFetchCatalogProduct,
}));

mock.module('./sneaker-images', () => ({
  replaceSneakerImages: mockReplaceSneakerImages,
}));

mock.module('./db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: async () => [
          {
            id: '11111111-1111-4111-8111-111111111111',
            catalogSource: 'kicksdb:stockx',
            catalogId: 'air-max-1',
          },
          {
            id: '22222222-2222-4222-8222-222222222222',
            catalogSource: 'kicksdb:stockx',
            catalogId: 'air-max-1',
          },
        ],
      }),
    }),
  },
}));

const { backfillSneakerImages } = await import('./backfill-sneaker-images');

describe('backfillSneakerImages', () => {
  beforeEach(() => {
    mockFetchCatalogProduct.mockClear();
    mockReplaceSneakerImages.mockClear();
  });

  test('reuses catalog fetches for sneakers with the same catalog product', async () => {
    const result = await backfillSneakerImages({ delayMs: 0 });

    expect(result).toEqual({
      sneakersProcessed: 2,
      sneakersUpdated: 2,
      catalogProductsFetched: 1,
      failures: [],
    });
    expect(mockFetchCatalogProduct).toHaveBeenCalledTimes(1);
    expect(mockReplaceSneakerImages).toHaveBeenCalledTimes(2);
    expect(mockReplaceSneakerImages).toHaveBeenCalledWith('11111111-1111-4111-8111-111111111111', [
      'https://images.example.com/primary.png',
      'https://images.example.com/gallery.png',
    ]);
  });
});
