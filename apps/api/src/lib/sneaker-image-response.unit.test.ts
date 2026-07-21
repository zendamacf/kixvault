import { describe, expect, mock, test } from 'bun:test';

mock.module('./env', () => ({
  env: {
    imageStoragePath: './data/images',
  },
}));

const { createSneakerImageResponse } = await import('./sneaker-image-response');

const baseImageRow = {
  id: '22222222-2222-4222-8222-222222222222',
  sneakerId: '11111111-1111-4111-8111-111111111111',
  sourceUrl: 'https://images.stockx.com/example.png',
  storagePath: null,
  fetchStatus: 'pending' as const,
  fetchError: null,
  fetchedAt: null,
  sortOrder: 0,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
};

describe('createSneakerImageResponse', () => {
  test('returns 404 when the image row is missing', async () => {
    const response = await createSneakerImageResponse(null);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'Image not found' });
  });

  test('redirects to the source URL when no local file exists', async () => {
    const response = await createSneakerImageResponse(baseImageRow);

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('https://images.stockx.com/example.png');
  });
});
