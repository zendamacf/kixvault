import { afterAll, beforeAll, beforeEach, describe, expect, mock, test } from 'bun:test';
import type { CreateSneakerFromCatalogInput, CreateSneakerInput } from '@kixvault/shared';
import type { app as AppType } from '../app';
import {
  getSessionCookie,
  getTestDatabaseUrl,
  prepareTestDatabase,
  registerTestUser,
  resetDatabase,
} from '../test/helpers';
import {
  mockEnsureKicksdbClient,
  mockGetStockxProduct,
  mockIsKicksdbConfigured,
  mockKicksdbSdk,
  resetKicksdbSdkMocks,
} from '../test/mocks/kicksdb';

mockKicksdbSdk();

mock.module('../lib/kicksdb', () => ({
  isKicksdbConfigured: mockIsKicksdbConfigured,
  ensureKicksdbClient: mockEnsureKicksdbClient,
  resetKicksdbClientForTests: () => {},
}));

const testDatabaseUrl = getTestDatabaseUrl();

describe.skipIf(!testDatabaseUrl)('API integration', () => {
  let app: typeof AppType;
  let connectionString = '';

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      return;
    }

    connectionString = testDatabaseUrl;
    await prepareTestDatabase(connectionString);
    process.env.DATABASE_URL = connectionString;
    process.env.SIGNUPS_ENABLED = 'true';

    const appModule = await import('../app');
    app = appModule.app;
  });

  beforeEach(async () => {
    resetKicksdbSdkMocks();
    await resetDatabase(connectionString);
  });

  afterAll(async () => {
    if (connectionString) {
      await resetDatabase(connectionString);
    }
  });

  test('GET /api/health returns ok', async () => {
    const response = await app.request('/api/health');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: 'ok',
      app: 'KixVault',
    });
  });

  test('POST /api/auth/register creates a user and session', async () => {
    const email = `user-${crypto.randomUUID()}@example.com`;
    const { response, cookie } = await registerTestUser(app, email);

    expect(response.status).toBe(201);
    expect(cookie).toContain('auth_session=');

    const body = (await response.json()) as { user: { email: string } };
    expect(body.user.email).toBe(email);
  });

  test('POST /api/auth/register rejects duplicate emails', async () => {
    const email = `duplicate-${crypto.randomUUID()}@example.com`;
    await registerTestUser(app, email);

    const { response } = await registerTestUser(app, email);

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: 'Email already in use' });
  });

  test('GET /api/auth/me returns null without a session', async () => {
    const response = await app.request('/api/auth/me');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ user: null });
  });

  test('GET /api/sneakers requires authentication', async () => {
    const response = await app.request('/api/sneakers');

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  test('POST /api/sneakers/from-catalog creates a sneaker from a catalog product', async () => {
    mockIsKicksdbConfigured.mockReturnValue(true);
    mockGetStockxProduct.mockImplementation(() =>
      Promise.resolve({
        data: {
          data: {
            slug: '1234567890',
            title: 'Nike Air Max 1',
            brand: 'Nike',
            model: 'Air Max 1',
            primary_title: 'Nike Air Max 1',
            secondary_title: 'Big Bubble',
            sku: '319986-171',
            image: 'https://images.stockx.com/example.png',
            gallery: [],
            traits: [],
            variants: [
              {
                id: 'variant-10',
                size: '10',
                size_type: 'us m',
                prices: [{ price: 220, type: 'standard' }],
              },
            ],
          },
        },
        error: null,
        response: { status: 200 },
      }),
    );

    const email = `catalog-${crypto.randomUUID()}@example.com`;
    const { cookie } = await registerTestUser(app, email);

    const input: CreateSneakerFromCatalogInput = {
      catalogSource: 'kicksdb:stockx',
      catalogId: '1234567890',
      size: 10,
      condition: 'deadstock',
    };

    const response = await app.request('/api/sneakers/from-catalog', {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    expect(response.status).toBe(201);

    const created = (await response.json()) as {
      sneaker: {
        id: string;
        brand: string;
        sku: string;
        nickname: string | null;
        currentMarketPrice: number | null;
        imageUrl: string | null;
        images: Array<{ id: string; url: string; sortOrder: number }>;
      };
    };
    expect(created.sneaker.nickname).toBe('Big Bubble');
    expect(created.sneaker.currentMarketPrice).toBe(220);
    expect(created.sneaker.imageUrl).toBe('https://images.stockx.com/example.png');
    expect(created.sneaker.images).toEqual([
      {
        id: expect.any(String),
        url: 'https://images.stockx.com/example.png',
        sortOrder: 0,
      },
    ]);
  });

  test('POST /api/sneakers/from-catalog returns 400 for invalid catalog product', async () => {
    const email = `catalog-${crypto.randomUUID()}@example.com`;
    const { cookie } = await registerTestUser(app, email);

    const response = await app.request('/api/sneakers/from-catalog', {
      method: 'POST',
      headers: { Cookie: cookie },
    });

    expect(response.status).toBe(400);
  });

  test('POST /api/sneakers/custom creates a sneaker from custom input', async () => {
    const email = `custom-${crypto.randomUUID()}@example.com`;
    const { cookie } = await registerTestUser(app, email);

    const input: CreateSneakerInput = {
      brand: 'Nike',
      model: 'Air Force 1',
      colorway: 'White',
      size: 10,
      condition: 'deadstock',
      nickname: 'Big Bubble',
      images: [
        'https://images.example.com/air-force-1.png',
        'https://images.example.com/air-force-1-alt.png',
      ],
    };

    const response = await app.request('/api/sneakers/custom', {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    expect(response.status).toBe(201);

    const created = (await response.json()) as {
      sneaker: {
        id: string;
        brand: string;
        sku: string | null;
        nickname: string | null;
        imageUrl: string | null;
        images: Array<{ id: string; url: string; sortOrder: number }>;
      };
    };
    expect(created.sneaker.nickname).toBe('Big Bubble');
    expect(created.sneaker.imageUrl).toBe('https://images.example.com/air-force-1.png');
    expect(created.sneaker.images).toEqual([
      {
        id: expect.any(String),
        url: 'https://images.example.com/air-force-1.png',
        sortOrder: 0,
      },
      {
        id: expect.any(String),
        url: 'https://images.example.com/air-force-1-alt.png',
        sortOrder: 1,
      },
    ]);
  });

  test('POST /api/sneakers/custom returns 400 for invalid custom input', async () => {
    const email = `custom-${crypto.randomUUID()}@example.com`;
    const { cookie } = await registerTestUser(app, email);

    const response = await app.request('/api/sneakers/custom', {
      method: 'POST',
      headers: { Cookie: cookie },
    });

    expect(response.status).toBe(400);
  });

  test('authenticated sneaker CRUD and search flow', async () => {
    const email = `collector-${crypto.randomUUID()}@example.com`;
    const { cookie } = await registerTestUser(app, email);

    const createResponse = await app.request('/api/sneakers/custom', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({
        brand: 'Nike',
        model: 'Air Max 1',
        colorway: 'Anniversary Red',
        nickname: 'Big Bubble',
        size: 10,
        condition: 'deadstock',
        purchasePrice: 180,
        purchaseDate: '2024-06-15',
        notes: 'Deadstock pickup',
        sku: 'TEST-SKU-001',
      }),
    });

    expect(createResponse.status).toBe(201);

    const created = (await createResponse.json()) as {
      sneaker: { id: string; brand: string; sku: string; nickname: string | null };
    };
    expect(created.sneaker.nickname).toBe('Big Bubble');

    const listResponse = await app.request('/api/sneakers', {
      headers: { Cookie: cookie },
    });

    expect(listResponse.status).toBe(200);

    const listed = (await listResponse.json()) as { sneakers: Array<{ id: string }> };
    expect(listed.sneakers).toHaveLength(1);
    expect(listed.sneakers[0]?.id).toBe(created.sneaker.id);

    const searchResponse = await app.request('/api/sneakers?search=Nike', {
      headers: { Cookie: cookie },
    });

    expect(searchResponse.status).toBe(200);

    const searched = (await searchResponse.json()) as { sneakers: Array<{ id: string }> };
    expect(searched.sneakers.some((sneaker) => sneaker.id === created.sneaker.id)).toBe(true);

    const conditionResponse = await app.request('/api/sneakers?condition=deadstock', {
      headers: { Cookie: cookie },
    });

    expect(conditionResponse.status).toBe(200);

    const conditioned = (await conditionResponse.json()) as { sneakers: Array<{ id: string }> };
    expect(conditioned.sneakers.some((sneaker) => sneaker.id === created.sneaker.id)).toBe(true);

    const detailResponse = await app.request(`/api/sneakers/${created.sneaker.id}`, {
      headers: { Cookie: cookie },
    });

    expect(detailResponse.status).toBe(200);

    const detail = (await detailResponse.json()) as { sneaker: { brand: string } };
    expect(detail.sneaker.brand).toBe('Nike');

    const noopUpdateResponse = await app.request(`/api/sneakers/${created.sneaker.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({}),
    });

    expect(noopUpdateResponse.status).toBe(200);

    const updateResponse = await app.request(`/api/sneakers/${created.sneaker.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({
        notes: 'Worn once',
        purchasePrice: 150,
      }),
    });

    expect(updateResponse.status).toBe(200);

    const updated = (await updateResponse.json()) as { sneaker: { notes: string | null } };
    expect(updated.sneaker.notes).toBe('Worn once');

    const imageUpdateResponse = await app.request(`/api/sneakers/${created.sneaker.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({
        images: ['https://images.example.com/updated.png'],
      }),
    });

    expect(imageUpdateResponse.status).toBe(200);

    const imageUpdated = (await imageUpdateResponse.json()) as {
      sneaker: {
        imageUrl: string | null;
        images: Array<{ url: string; sortOrder: number }>;
      };
    };
    expect(imageUpdated.sneaker.imageUrl).toBe('https://images.example.com/updated.png');
    expect(imageUpdated.sneaker.images).toEqual([
      {
        id: expect.any(String),
        url: 'https://images.example.com/updated.png',
        sortOrder: 0,
      },
    ]);

    const statsResponse = await app.request('/api/stats', {
      headers: { Cookie: cookie },
    });

    expect(statsResponse.status).toBe(200);

    const stats = (await statsResponse.json()) as {
      stats: { count: number; totalSpend: number };
    };
    expect(stats.stats.count).toBe(1);
    expect(stats.stats.totalSpend).toBe(150);

    const deleteResponse = await app.request(`/api/sneakers/${created.sneaker.id}`, {
      method: 'DELETE',
      headers: { Cookie: cookie },
    });

    expect(deleteResponse.status).toBe(200);
    await expect(deleteResponse.json()).resolves.toEqual({ success: true });

    const missingDetailResponse = await app.request(`/api/sneakers/${created.sneaker.id}`, {
      headers: { Cookie: cookie },
    });

    expect(missingDetailResponse.status).toBe(404);

    const missingDeleteResponse = await app.request(`/api/sneakers/${created.sneaker.id}`, {
      method: 'DELETE',
      headers: { Cookie: cookie },
    });

    expect(missingDeleteResponse.status).toBe(404);
  });

  test('POST /api/sneakers/from-catalog returns 503 when KicksDB is not configured', async () => {
    const email = `catalog-503-${crypto.randomUUID()}@example.com`;
    const { cookie } = await registerTestUser(app, email);

    const response = await app.request('/api/sneakers/from-catalog', {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        catalogSource: 'kicksdb:stockx',
        catalogId: '1234567890',
        size: 10,
        condition: 'deadstock',
      }),
    });

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ error: 'Catalog is not configured' });
  });

  test('returns 404 for unknown sneaker ids', async () => {
    const email = `missing-${crypto.randomUUID()}@example.com`;
    const { cookie } = await registerTestUser(app, email);
    const unknownId = '22222222-2222-4222-8222-222222222222';

    const detailResponse = await app.request(`/api/sneakers/${unknownId}`, {
      headers: { Cookie: cookie },
    });

    expect(detailResponse.status).toBe(404);

    const updateResponse = await app.request(`/api/sneakers/${unknownId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ notes: 'Nope' }),
    });

    expect(updateResponse.status).toBe(404);
  });

  test('PATCH /api/sneakers/:id rejects catalog-linked model field changes', async () => {
    mockIsKicksdbConfigured.mockReturnValue(true);
    mockGetStockxProduct.mockImplementation(() =>
      Promise.resolve({
        data: {
          data: {
            slug: '1234567890',
            title: 'Nike Air Max 1',
            brand: 'Nike',
            model: 'Air Max 1',
            primary_title: 'Nike Air Max 1',
            secondary_title: 'Big Bubble',
            sku: '319986-171',
            image: 'https://images.stockx.com/example.png',
            gallery: [],
            traits: [],
          },
        },
        error: null,
        response: { status: 200 },
      }),
    );

    const email = `catalog-edit-${crypto.randomUUID()}@example.com`;
    const { cookie } = await registerTestUser(app, email);

    const createResponse = await app.request('/api/sneakers/from-catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        catalogSource: 'kicksdb:stockx',
        catalogId: '1234567890',
        size: 10,
        condition: 'deadstock',
      }),
    });

    expect(createResponse.status).toBe(201);

    const created = (await createResponse.json()) as { sneaker: { id: string } };

    const updateResponse = await app.request(`/api/sneakers/${created.sneaker.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ brand: 'Adidas' }),
    });

    expect(updateResponse.status).toBe(400);
    await expect(updateResponse.json()).resolves.toEqual({
      error: 'Cannot update brand for catalog-linked sneakers',
    });
  });

  test('PATCH /api/sneakers/:id rejects catalog-linked image changes', async () => {
    mockIsKicksdbConfigured.mockReturnValue(true);
    mockGetStockxProduct.mockImplementation(() =>
      Promise.resolve({
        data: {
          data: {
            slug: '1234567890',
            title: 'Nike Air Max 1',
            brand: 'Nike',
            model: 'Air Max 1',
            primary_title: 'Nike Air Max 1',
            secondary_title: 'Big Bubble',
            sku: '319986-171',
            image: 'https://images.stockx.com/example.png',
            gallery: [],
            traits: [],
          },
        },
        error: null,
        response: { status: 200 },
      }),
    );

    const email = `catalog-images-${crypto.randomUUID()}@example.com`;
    const { cookie } = await registerTestUser(app, email);

    const createResponse = await app.request('/api/sneakers/from-catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        catalogSource: 'kicksdb:stockx',
        catalogId: '1234567890',
        size: 10,
        condition: 'deadstock',
      }),
    });

    expect(createResponse.status).toBe(201);

    const created = (await createResponse.json()) as { sneaker: { id: string } };

    const updateResponse = await app.request(`/api/sneakers/${created.sneaker.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        images: ['https://images.example.com/replacement.png'],
      }),
    });

    expect(updateResponse.status).toBe(400);
    await expect(updateResponse.json()).resolves.toEqual({
      error: 'Cannot update images for catalog-linked sneakers',
    });
  });

  test('POST /api/auth/login validates credentials', async () => {
    const email = `login-${crypto.randomUUID()}@example.com`;
    const password = 'password123';
    await registerTestUser(app, email, password);

    const validLogin = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    expect(validLogin.status).toBe(200);
    expect(getSessionCookie(validLogin)).toContain('auth_session=');

    const invalidLogin = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'wrong-password' }),
    });

    expect(invalidLogin.status).toBe(401);
    await expect(invalidLogin.json()).resolves.toEqual({ error: 'Invalid email or password' });
  });

  test('GET /api/catalog/search returns 503 when KicksDB is not configured', async () => {
    const email = `catalog-${crypto.randomUUID()}@example.com`;
    const { cookie } = await registerTestUser(app, email);

    const response = await app.request('/api/catalog/search?q=jordan&limit=10&marketplace=stockx', {
      headers: { Cookie: cookie },
    });

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ error: 'Catalog search is not configured' });
  });
});
