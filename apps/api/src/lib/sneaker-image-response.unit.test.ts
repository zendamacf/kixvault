import { afterEach, describe, expect, mock, test } from 'bun:test';
import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const storageRoot = './data/images';
const sneakerId = '11111111-1111-4111-8111-111111111111';
const storagePath = `${sneakerId}/0.webp`;
const absolutePath = join(storageRoot, storagePath);

mock.module('./env', () => ({
  env: {
    imageStoragePath: storageRoot,
  },
}));

const { createSneakerImageResponse } = await import('./sneaker-image-response');

const baseImageRow = {
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

afterEach(async () => {
  await rm(join(storageRoot, sneakerId), { recursive: true, force: true });
});

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

  test('redirects to the source URL when storagePath is set but the file is missing', async () => {
    const response = await createSneakerImageResponse({
      ...baseImageRow,
      storagePath,
      fetchStatus: 'ready',
    });

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('https://images.stockx.com/example.png');
  });

  test('serves a stored WebP file when it exists on disk', async () => {
    await mkdir(join(storageRoot, sneakerId), { recursive: true });
    await Bun.write(absolutePath, new Uint8Array([0x52, 0x49, 0x46, 0x46]));

    const response = await createSneakerImageResponse({
      ...baseImageRow,
      storagePath,
      fetchStatus: 'ready',
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/webp');
    expect(response.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
  });
});
