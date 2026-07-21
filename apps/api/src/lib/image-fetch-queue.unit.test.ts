import { describe, expect, mock, test } from 'bun:test';

const mockFetchAndStoreSneakerImage = mock(async () => {});

mock.module('./image-fetch', () => ({
  fetchAndStoreSneakerImage: mockFetchAndStoreSneakerImage,
}));

const { enqueueImageFetches, resetImageFetchQueueForTests } = await import('./image-fetch-queue');

describe('enqueueImageFetches', () => {
  test('deduplicates queued image ids', async () => {
    resetImageFetchQueueForTests();
    mockFetchAndStoreSneakerImage.mockClear();

    enqueueImageFetches(['image-1', 'image-1', 'image-2']);

    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });

    expect(mockFetchAndStoreSneakerImage.mock.calls.map((call) => call[0]).sort()).toEqual([
      'image-1',
      'image-2',
    ]);
  });
});
