import { describe, expect, mock, test } from 'bun:test';

const mockGetSneakerImageByKey = mock(
  async () =>
    null as Awaited<ReturnType<typeof import('../lib/sneaker-images').getSneakerImageByKey>>,
);

mock.module('../lib/db', () => ({
  db: {},
}));

mock.module('../lib/env', () => ({
  env: {
    imageStoragePath: './data/images',
    imagePublicBasePath: '/api/images',
  },
}));

const actualSneakerImages = await import('../lib/sneaker-images');

mock.module('../lib/sneaker-images', () => ({
  ...actualSneakerImages,
  getSneakerImageByKey: mockGetSneakerImageByKey,
}));

const { imageRoutes } = await import('./images');

const sneakerId = '11111111-1111-4111-8111-111111111111';

const pendingImageRow = {
  id: '22222222-2222-4222-8222-222222222222',
  sneakerId,
  sourceUrl: 'https://images.stockx.com/example.png',
  storagePath: null,
  fetchStatus: 'pending' as const,
  fetchError: null,
  fetchedAt: null,
  sortOrder: 0,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
};

describe('imageRoutes', () => {
  test('GET /:sneakerId/:sortOrder returns 400 for invalid ids', async () => {
    const response = await imageRoutes.request('/not-a-uuid/0');

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid image path' });
  });

  test('GET /:sneakerId/:sortOrder returns 400 for invalid sort orders', async () => {
    const response = await imageRoutes.request(`/${sneakerId}/-1`);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid image path' });
  });

  test('GET /:sneakerId/:sortOrder returns 404 when the image row is missing', async () => {
    mockGetSneakerImageByKey.mockResolvedValueOnce(null);

    const response = await imageRoutes.request(`/${sneakerId}/0`);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'Image not found' });
  });

  test('GET /:sneakerId/:sortOrder redirects to the source URL for pending images', async () => {
    mockGetSneakerImageByKey.mockResolvedValueOnce(pendingImageRow);

    const response = await imageRoutes.request(`/${sneakerId}/0`);

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('https://images.stockx.com/example.png');
  });
});
