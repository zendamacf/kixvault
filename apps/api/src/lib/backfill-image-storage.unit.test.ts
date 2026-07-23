import { describe, expect, mock, test } from 'bun:test';

const mockFetchAndStoreSneakerImage = mock(async () => {});
const mockFetchAndStoreSneakerGallery360Image = mock(async () => {});
const mockGetSneakerImageById = mock(async () => ({
  id: 'image-1',
  sneakerId: 'sneaker-1',
  sourceUrl: 'https://images.stockx.com/example.png',
  storagePath: 'sneaker-1/0.webp',
  fetchStatus: 'ready' as const,
  fetchError: null,
  fetchedAt: new Date(),
  sortOrder: 0,
  createdAt: new Date(),
}));
const mockGetSneakerGallery360ImageById = mock(async () => ({
  id: 'gallery-1',
  sneakerId: 'sneaker-1',
  sourceUrl: 'https://images.stockx.com/360-01.png',
  storagePath: 'sneaker-1/360/0.webp',
  fetchStatus: 'ready' as const,
  fetchError: null,
  fetchedAt: new Date(),
  sortOrder: 0,
  createdAt: new Date(),
}));

let selectCall = 0;

const mockSelect = mock(() => ({
  from: mock(() => ({
    where: mock(async () => {
      selectCall += 1;
      return selectCall === 1 ? [{ id: 'image-1' }] : [{ id: 'gallery-1' }];
    }),
  })),
}));

mock.module('./db', () => ({
  db: {
    select: mockSelect,
  },
}));

mock.module('./image-fetch', () => ({
  fetchAndStoreSneakerImage: mockFetchAndStoreSneakerImage,
  fetchAndStoreSneakerGallery360Image: mockFetchAndStoreSneakerGallery360Image,
  getSneakerImageById: mockGetSneakerImageById,
  getSneakerGallery360ImageById: mockGetSneakerGallery360ImageById,
}));

const { backfillImageStorage } = await import('./backfill-image-storage');

describe('backfillImageStorage', () => {
  test('processes pending primary and gallery images and reports ready counts', async () => {
    selectCall = 0;
    mockFetchAndStoreSneakerImage.mockClear();
    mockFetchAndStoreSneakerGallery360Image.mockClear();
    mockGetSneakerImageById.mockClear();
    mockGetSneakerGallery360ImageById.mockClear();

    const result = await backfillImageStorage();

    expect(mockFetchAndStoreSneakerImage).toHaveBeenCalledWith('image-1', { force: undefined });
    expect(mockFetchAndStoreSneakerGallery360Image).toHaveBeenCalledWith('gallery-1', {
      force: undefined,
    });
    expect(result).toEqual({
      imagesProcessed: 2,
      imagesReady: 2,
      failures: [],
    });
  });
});
