import { describe, expect, mock, test } from 'bun:test';

mock.module('./env', () => ({
  env: {
    imagePublicBasePath: '/api/images',
    imageStoragePath: './data/images',
  },
}));

mock.module('./db', () => ({
  db: {},
}));

const { hasPrimaryImageChanged, normalizeSneakerImageUrls, formatPrimaryImage } = await import(
  './sneaker-images'
);

const { buildSneakerImageStoragePath, buildSneakerGallery360ImageStoragePath } = await import(
  './sneaker-image-paths'
);

const baseImageRow = {
  id: '22222222-2222-4222-8222-222222222222',
  sneakerId: '11111111-1111-4111-8111-111111111111',
  sourceUrl: 'https://images.example.com/sneaker.png',
  storagePath: null,
  fetchStatus: 'pending' as const,
  fetchError: null,
  fetchedAt: null,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
};

describe('normalizeSneakerImageUrls', () => {
  test('removes empty values and duplicates while preserving order', () => {
    expect(
      normalizeSneakerImageUrls([
        ' https://images.example.com/1.png ',
        'https://images.example.com/2.png',
        'https://images.example.com/1.png',
        '',
      ]),
    ).toEqual(['https://images.example.com/1.png', 'https://images.example.com/2.png']);
  });

  test('returns an empty array for missing input', () => {
    expect(normalizeSneakerImageUrls(undefined)).toEqual([]);
    expect(normalizeSneakerImageUrls([])).toEqual([]);
  });

  test('ignores null and undefined entries', () => {
    expect(
      normalizeSneakerImageUrls([
        null,
        'https://images.example.com/1.png',
        undefined,
        'https://images.example.com/1.png',
      ]),
    ).toEqual(['https://images.example.com/1.png']);
  });

  test('normalizes StockX URLs to remove opaque background params', () => {
    expect(
      normalizeSneakerImageUrls([
        'https://images.stockx.com/images/Air-Jordan-1.jpg?fit=fill&bg=FFFFFF&w=700',
      ]),
    ).toEqual(['https://images.stockx.com/images/Air-Jordan-1.jpg?w=700&bg-remove=true']);
  });
});

describe('formatPrimaryImage', () => {
  test('maps database rows to API image objects using the source URL by default', () => {
    expect(formatPrimaryImage(baseImageRow)).toEqual({
      id: '22222222-2222-4222-8222-222222222222',
      url: 'https://images.example.com/sneaker.png',
    });
  });

  test('maps stored images to the local API path', () => {
    expect(
      formatPrimaryImage({
        ...baseImageRow,
        storagePath: '11111111-1111-4111-8111-111111111111/0.webp',
        fetchStatus: 'ready',
      }),
    ).toEqual({
      id: '22222222-2222-4222-8222-222222222222',
      url: '/api/images/11111111-1111-4111-8111-111111111111',
    });
  });
});

describe('buildSneakerImageStoragePath', () => {
  test('builds a deterministic relative storage path', () => {
    expect(buildSneakerImageStoragePath('11111111-1111-4111-8111-111111111111')).toBe(
      '11111111-1111-4111-8111-111111111111/0.webp',
    );
  });
});

describe('buildSneakerGallery360ImageStoragePath', () => {
  test('stores 360 frames under a dedicated subdirectory', () => {
    expect(buildSneakerGallery360ImageStoragePath('11111111-1111-4111-8111-111111111111', 3)).toBe(
      '11111111-1111-4111-8111-111111111111/360/3.webp',
    );
  });
});

describe('hasPrimaryImageChanged', () => {
  test('returns false when primary image is omitted from the update', () => {
    expect(hasPrimaryImageChanged(baseImageRow, undefined)).toBe(false);
  });

  test('detects content changes and clearing the image', () => {
    expect(hasPrimaryImageChanged(baseImageRow, 'https://images.example.com/updated.png')).toBe(
      true,
    );
    expect(hasPrimaryImageChanged(baseImageRow, 'https://images.example.com/sneaker.png')).toBe(
      false,
    );
    expect(hasPrimaryImageChanged(baseImageRow, null)).toBe(true);
    expect(hasPrimaryImageChanged(null, 'https://images.example.com/sneaker.png')).toBe(true);
  });
});
