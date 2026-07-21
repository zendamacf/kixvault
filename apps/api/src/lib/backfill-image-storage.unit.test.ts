import { describe, expect, mock, test } from 'bun:test';

const mockFetchAndStoreSneakerImage = mock(async () => {});
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

const mockSelect = mock(() => ({
  from: mock(() => ({
    where: mock(async () => [{ id: 'image-1' }]),
  })),
}));

mock.module('./db', () => ({
  db: {
    select: mockSelect,
  },
}));

mock.module('./image-fetch', () => ({
  fetchAndStoreSneakerImage: mockFetchAndStoreSneakerImage,
  getSneakerImageById: mockGetSneakerImageById,
}));

const { backfillImageStorage } = await import('./backfill-image-storage');

describe('backfillImageStorage', () => {
  test('processes pending images and reports ready counts', async () => {
    mockFetchAndStoreSneakerImage.mockClear();
    mockGetSneakerImageById.mockClear();

    const result = await backfillImageStorage({ delayMs: 0 });

    expect(mockFetchAndStoreSneakerImage).toHaveBeenCalledWith('image-1');
    expect(result).toEqual({
      imagesProcessed: 1,
      imagesReady: 1,
      failures: [],
    });
  });
});
