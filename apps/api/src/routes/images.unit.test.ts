import { describe, expect, mock, test } from 'bun:test';

mock.module('../lib/db', () => ({
  db: {},
}));

const { imageRoutes } = await import('./images');

describe('imageRoutes', () => {
  test('GET /:sneakerId/:sortOrder returns 400 for invalid ids', async () => {
    const response = await imageRoutes.request('/not-a-uuid/0');

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid image path' });
  });
});
