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
  gallery360Urls: [
    'https://images.example.com/360-01.png',
    'https://images.example.com/360-02.png',
  ],
  releaseDate: '2015-04-25',
  description: 'The original Air Max with visible Air cushioning.',
}));

const mockReplaceSneakerPrimaryImage = mock(async () => null);
const mockReplaceSneakerGallery360Images = mock(async () => []);

mock.module('./catalog', () => ({
  fetchCatalogProduct: mockFetchCatalogProduct,
}));

mock.module('./sneaker-images', () => ({
  replaceSneakerPrimaryImage: mockReplaceSneakerPrimaryImage,
}));

mock.module('./sneaker-gallery-360-images', () => ({
  replaceSneakerGallery360Images: mockReplaceSneakerGallery360Images,
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
    mockReplaceSneakerPrimaryImage.mockClear();
    mockReplaceSneakerGallery360Images.mockClear();
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
    expect(mockReplaceSneakerPrimaryImage).toHaveBeenCalledTimes(2);
    expect(mockReplaceSneakerGallery360Images).toHaveBeenCalledTimes(2);
    expect(mockReplaceSneakerPrimaryImage).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111',
      'https://images.example.com/primary.png',
    );
    expect(mockReplaceSneakerGallery360Images).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111',
      ['https://images.example.com/360-01.png', 'https://images.example.com/360-02.png'],
    );
  });
});
