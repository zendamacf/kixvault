import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { formatWishlistItem } from '../lib/wishlist-format';

const VALID_ID = '11111111-1111-4111-8111-111111111111';

const createdAt = new Date('2026-01-01T00:00:00.000Z');

const existingItem = {
  id: VALID_ID,
  userId: 'user-1',
  brand: 'Nike',
  model: 'Dunk Low',
  colorway: 'Panda',
  targetSize: '10',
  priority: 'medium' as const,
  notes: 'Original',
  sku: null,
  catalogSource: null,
  catalogId: null,
  nickname: null,
  releaseDate: null,
  description: null,
  imageUrl: null,
  createdAt,
  updatedAt: createdAt,
};

const mockListWishlistItemsForUser = mock(async () => []);
const mockGetWishlistItemForUser = mock(async () => null as typeof existingItem | null);
const mockBuildWishlistUpdate = mock(() => ({}));
const mockUpdateReturning = mock(async () => [] as Array<typeof existingItem>);
const mockDeleteReturning = mock(async () => [] as Array<{ id: string }>);
const mockInsertReturning = mock(async () => [] as Array<Record<string, unknown>>);
const mockMoveToCollection = mock(async () => ({ id: 'sneaker-1', brand: 'Nike' }));

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

mock.module('../lib/wishlist', () => ({
  listWishlistItemsForUser: mockListWishlistItemsForUser,
  formatWishlistItem,
  parseWishlistId: (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
      ? value
      : null,
  getWishlistItemForUser: mockGetWishlistItemForUser,
  buildWishlistUpdate: mockBuildWishlistUpdate,
  moveWishlistItemToCollection: mockMoveToCollection,
  CatalogProductNotFoundError: class extends Error {},
  CatalogSearchError: class extends Error {
    status = 502;
  },
}));

mock.module('../lib/db', () => ({
  db: {
    insert: () => ({ values: () => ({ returning: mockInsertReturning }) }),
    update: () => ({
      set: () => ({
        where: () => ({
          returning: mockUpdateReturning,
        }),
      }),
    }),
    delete: () => ({ where: () => ({ returning: mockDeleteReturning }) }),
  },
}));

mock.module('../lib/env', () => ({
  env: { kicksdbApiKey: undefined, databaseUrl: 'postgresql://example.com/db' },
}));

mock.module('../lib/kicksdb', () => ({
  isKicksdbConfigured: () => false,
  ensureKicksdbClient: () => {},
  resetKicksdbClientForTests: () => {},
}));

mock.module('../middleware/catalog-rate-limit', () => ({
  catalogFromCatalogRateLimit: async (_c: unknown, next: () => Promise<void>) => {
    await next();
  },
  resetRateLimitersForTests: () => {},
}));

const { wishlistRoutes } = await import('./wishlist');

describe('wishlist routes', () => {
  beforeEach(() => {
    mockGetWishlistItemForUser.mockClear();
    mockBuildWishlistUpdate.mockClear();
    mockUpdateReturning.mockClear();
    mockDeleteReturning.mockClear();
    mockInsertReturning.mockClear();
    mockMoveToCollection.mockClear();
  });

  test('GET / returns wishlist items', async () => {
    mockListWishlistItemsForUser.mockResolvedValueOnce([]);

    const response = await wishlistRoutes.request('/');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ items: [] });
  });

  test('GET /:id returns 400 for invalid ids', async () => {
    const response = await wishlistRoutes.request('/not-a-uuid');

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid wishlist item id' });
  });

  test('PATCH /:id returns 400 for invalid ids', async () => {
    const response = await wishlistRoutes.request('/not-a-uuid', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priority: 'high' }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid wishlist item id' });
    expect(mockGetWishlistItemForUser).not.toHaveBeenCalled();
  });

  test('PATCH /:id returns 404 when the item is missing', async () => {
    mockGetWishlistItemForUser.mockResolvedValueOnce(null);

    const response = await wishlistRoutes.request(`/${VALID_ID}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priority: 'high' }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'Wishlist item not found' });
    expect(mockGetWishlistItemForUser).toHaveBeenCalledWith('user-1', VALID_ID);
  });

  test('PATCH /:id returns the existing item when there are no updates', async () => {
    mockGetWishlistItemForUser.mockResolvedValueOnce(existingItem);
    mockBuildWishlistUpdate.mockReturnValueOnce({});

    const response = await wishlistRoutes.request(`/${VALID_ID}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as { item: { notes: string | null } };
    expect(body.item.notes).toBe('Original');
    expect(mockUpdateReturning).not.toHaveBeenCalled();
  });

  test('PATCH /:id persists updates and returns the updated item', async () => {
    const updatedItem = {
      ...existingItem,
      priority: 'high' as const,
      notes: 'Updated',
    };
    mockGetWishlistItemForUser.mockResolvedValueOnce(existingItem);
    mockBuildWishlistUpdate.mockReturnValueOnce({ priority: 'high', notes: 'Updated' });
    mockUpdateReturning.mockResolvedValueOnce([updatedItem]);

    const response = await wishlistRoutes.request(`/${VALID_ID}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priority: 'high', notes: 'Updated' }),
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as { item: { priority: string; notes: string | null } };
    expect(body.item.priority).toBe('high');
    expect(body.item.notes).toBe('Updated');
    expect(mockBuildWishlistUpdate).toHaveBeenCalledWith(existingItem, {
      priority: 'high',
      notes: 'Updated',
    });
    expect(mockUpdateReturning).toHaveBeenCalled();
  });

  test('GET /:id returns 404 when the item is missing', async () => {
    mockGetWishlistItemForUser.mockResolvedValueOnce(null);

    const response = await wishlistRoutes.request(`/${VALID_ID}`);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'Wishlist item not found' });
  });

  test('GET /:id returns the item when found', async () => {
    mockGetWishlistItemForUser.mockResolvedValueOnce(existingItem);

    const response = await wishlistRoutes.request(`/${VALID_ID}`);

    expect(response.status).toBe(200);
    const body = (await response.json()) as { item: { brand: string } };
    expect(body.item.brand).toBe('Nike');
  });

  test('DELETE /:id returns 404 when the item is missing', async () => {
    mockDeleteReturning.mockResolvedValueOnce([]);

    const response = await wishlistRoutes.request(`/${VALID_ID}`, { method: 'DELETE' });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'Wishlist item not found' });
  });

  test('DELETE /:id removes the item', async () => {
    mockDeleteReturning.mockResolvedValueOnce([{ id: VALID_ID }]);

    const response = await wishlistRoutes.request(`/${VALID_ID}`, { method: 'DELETE' });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
  });

  test('POST /custom creates a wishlist item', async () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    mockInsertReturning.mockResolvedValueOnce([
      {
        id: VALID_ID,
        userId: 'user-1',
        brand: 'Asics',
        model: 'Gel Kayano',
        colorway: null,
        targetSize: '11',
        priority: 'medium',
        notes: null,
        sku: null,
        catalogSource: null,
        catalogId: null,
        nickname: null,
        releaseDate: null,
        description: null,
        imageUrl: null,
        createdAt,
        updatedAt: createdAt,
      },
    ]);

    const response = await wishlistRoutes.request('/custom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand: 'Asics', model: 'Gel Kayano' }),
    });

    expect(response.status).toBe(201);
    const body = (await response.json()) as { item: { brand: string } };
    expect(body.item.brand).toBe('Asics');
  });

  test('POST /from-catalog returns 503 when catalog is unavailable', async () => {
    const response = await wishlistRoutes.request('/from-catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        catalogSource: 'kicksdb:stockx',
        catalogId: 'air-max-1',
      }),
    });

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ error: 'Catalog is not configured' });
  });

  test('POST /:id/move-to-collection returns the created sneaker', async () => {
    mockGetWishlistItemForUser.mockResolvedValueOnce(existingItem);
    mockMoveToCollection.mockResolvedValueOnce({ id: 'sneaker-1', brand: 'Nike', size: 10 });

    const response = await wishlistRoutes.request(`/${VALID_ID}/move-to-collection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ size: 10, condition: 'deadstock' }),
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      sneaker: { id: 'sneaker-1', brand: 'Nike' },
    });
  });
});
