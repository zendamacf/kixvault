import { describe, expect, mock, test } from 'bun:test';

mock.module('./env', () => ({
  env: {
    imagePublicBasePath: '/api/images',
  },
}));

const { buildSneakerImagePublicUrl, buildSneakerGallery360ImagePublicUrl } = await import(
  './sneaker-image-urls'
);

describe('buildSneakerImagePublicUrl', () => {
  test('returns the local API path when a stored image exists', () => {
    expect(
      buildSneakerImagePublicUrl({
        sneakerId: '11111111-1111-4111-8111-111111111111',
        sortOrder: 0,
        storagePath: '11111111-1111-4111-8111-111111111111/0.webp',
        sourceUrl: 'https://images.stockx.com/example.png',
      }),
    ).toBe('/api/images/11111111-1111-4111-8111-111111111111/0');
  });

  test('falls back to the source URL when no stored image exists', () => {
    expect(
      buildSneakerImagePublicUrl({
        sneakerId: '11111111-1111-4111-8111-111111111111',
        sortOrder: 0,
        storagePath: null,
        sourceUrl: 'https://images.stockx.com/example.png',
      }),
    ).toBe('https://images.stockx.com/example.png');
  });
});

describe('buildSneakerGallery360ImagePublicUrl', () => {
  test('returns the local API path when a stored 360 frame exists', () => {
    expect(
      buildSneakerGallery360ImagePublicUrl({
        sneakerId: '11111111-1111-4111-8111-111111111111',
        sortOrder: 2,
        storagePath: '11111111-1111-4111-8111-111111111111/360/2.webp',
        sourceUrl: 'https://images.stockx.com/360/frame-02.png',
      }),
    ).toBe('/api/images/11111111-1111-4111-8111-111111111111/360/2');
  });
});
