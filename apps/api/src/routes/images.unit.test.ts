import { describe, expect, mock, test } from 'bun:test';

const mockGetSneakerPrimaryImage = mock(
  async () =>
    null as Awaited<ReturnType<typeof import('../lib/sneaker-images').getSneakerPrimaryImage>>,
);

const mockGetSneakerGallery360ImageByKey = mock(
  async () =>
    null as Awaited<
      ReturnType<typeof import('../lib/sneaker-gallery-360-images').getSneakerGallery360ImageByKey>
    >,
);

const mockWhere = mock(async () => [{ userId: 'user-1' }]);
const mockFrom = mock(() => ({ where: mockWhere }));
const mockSelect = mock(() => ({ from: mockFrom }));

mock.module('../lib/db', () => ({
  db: {
    select: mockSelect,
  },
}));

mock.module('../lib/env', () => ({
  env: {
    imageStoragePath: './data/images',
    imagePublicBasePath: '/api/images',
    isProduction: false,
  },
}));

mock.module('../middleware/session', () => ({
  sessionMiddleware: async (
    c: { set: (key: 'user' | 'session', value: unknown) => void },
    next: () => Promise<void>,
  ) => {
    c.set('user', { id: 'user-1', email: 'user@example.com' });
    c.set('session', { id: 'session-1', fresh: false });
    await next();
  },
  requireAuth: async (c: { get: (key: 'user') => unknown }, next: () => Promise<void>) => {
    if (!c.get('user')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    await next();
  },
}));

const actualSneakerImages = await import('../lib/sneaker-images');
const actualSneakerGallery360Images = await import('../lib/sneaker-gallery-360-images');

mock.module('../lib/sneaker-images', () => ({
  ...actualSneakerImages,
  getSneakerPrimaryImage: mockGetSneakerPrimaryImage,
}));

mock.module('../lib/sneaker-gallery-360-images', () => ({
  ...actualSneakerGallery360Images,
  getSneakerGallery360ImageByKey: mockGetSneakerGallery360ImageByKey,
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
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
};

const pendingGallery360Row = {
  id: '33333333-3333-4333-8333-333333333333',
  sneakerId,
  sourceUrl: 'https://images.stockx.com/360/example-01.png',
  storagePath: null,
  fetchStatus: 'pending' as const,
  fetchError: null,
  fetchedAt: null,
  sortOrder: 0,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
};

describe('imageRoutes', () => {
  test('GET /:sneakerId returns 400 for invalid ids', async () => {
    const response = await imageRoutes.request('/not-a-uuid');

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid image path' });
  });

  test('GET /:sneakerId returns 403 when the sneaker belongs to another user', async () => {
    mockWhere.mockImplementationOnce(async () => [{ userId: 'other-user' }]);

    const response = await imageRoutes.request(`/${sneakerId}`);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'Forbidden' });
  });

  test('GET /:sneakerId returns 404 when the image row is missing', async () => {
    mockGetSneakerPrimaryImage.mockResolvedValueOnce(null);

    const response = await imageRoutes.request(`/${sneakerId}`);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'Image not found' });
  });

  test('GET /:sneakerId redirects to the source URL for pending images', async () => {
    mockGetSneakerPrimaryImage.mockResolvedValueOnce(pendingImageRow);

    const response = await imageRoutes.request(`/${sneakerId}`);

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('https://images.stockx.com/example.png');
  });

  test('GET /:sneakerId/360/:sortOrder returns 403 for another user', async () => {
    mockWhere.mockImplementationOnce(async () => [{ userId: 'other-user' }]);

    const response = await imageRoutes.request(`/${sneakerId}/360/0`);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'Forbidden' });
  });

  test('GET /:sneakerId/360/:sortOrder returns 404 when the 360 frame is missing', async () => {
    mockGetSneakerGallery360ImageByKey.mockResolvedValueOnce(null);

    const response = await imageRoutes.request(`/${sneakerId}/360/0`);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'Image not found' });
  });

  test('GET /:sneakerId/360/:sortOrder redirects to the source URL for pending frames', async () => {
    mockGetSneakerGallery360ImageByKey.mockResolvedValueOnce(pendingGallery360Row);

    const response = await imageRoutes.request(`/${sneakerId}/360/0`);

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('https://images.stockx.com/360/example-01.png');
  });
});
