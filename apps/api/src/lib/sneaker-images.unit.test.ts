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

const {
  haveSneakerImagesChanged,
  normalizeSneakerImageUrls,
  formatSneakerImage,
  getPrimaryImageUrl,
} = await import('./sneaker-images');

const { buildSneakerImageStoragePath } = await import('./sneaker-image-paths');

const baseImageRow = {
  id: '22222222-2222-4222-8222-222222222222',
  sneakerId: '11111111-1111-4111-8111-111111111111',
  sourceUrl: 'https://images.example.com/sneaker.png',
  storagePath: null,
  fetchStatus: 'pending' as const,
  fetchError: null,
  fetchedAt: null,
  sortOrder: 0,
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

describe('formatSneakerImage', () => {
  test('maps database rows to API image objects using the source URL by default', () => {
    expect(formatSneakerImage(baseImageRow)).toEqual({
      id: '22222222-2222-4222-8222-222222222222',
      url: 'https://images.example.com/sneaker.png',
      sortOrder: 0,
    });
  });

  test('maps stored images to the local API path', () => {
    expect(
      formatSneakerImage({
        ...baseImageRow,
        storagePath: '11111111-1111-4111-8111-111111111111/0.webp',
        fetchStatus: 'ready',
      }),
    ).toEqual({
      id: '22222222-2222-4222-8222-222222222222',
      url: '/api/images/11111111-1111-4111-8111-111111111111/0',
      sortOrder: 0,
    });
  });
});

describe('getPrimaryImageUrl', () => {
  test('returns the first image URL when present', () => {
    expect(getPrimaryImageUrl([baseImageRow])).toBe('https://images.example.com/sneaker.png');
  });

  test('returns null when no images exist', () => {
    expect(getPrimaryImageUrl([])).toBeNull();
  });
});

describe('buildSneakerImageStoragePath', () => {
  test('builds a deterministic relative storage path', () => {
    expect(buildSneakerImageStoragePath('11111111-1111-4111-8111-111111111111', 2)).toBe(
      '11111111-1111-4111-8111-111111111111/2.webp',
    );
  });
});

describe('haveSneakerImagesChanged', () => {
  test('returns false when images are omitted from the update', () => {
    expect(haveSneakerImagesChanged([baseImageRow], undefined)).toBe(false);
  });

  test('detects order and content changes', () => {
    const existingImages = [
      baseImageRow,
      {
        ...baseImageRow,
        id: '33333333-3333-4333-8333-333333333333',
        sourceUrl: 'https://images.example.com/2.png',
        sortOrder: 1,
      },
    ];

    expect(haveSneakerImagesChanged(existingImages, ['https://images.example.com/1.png'])).toBe(
      true,
    );
    expect(
      haveSneakerImagesChanged(existingImages, [
        'https://images.example.com/sneaker.png',
        'https://images.example.com/2.png',
      ]),
    ).toBe(false);
  });
});
