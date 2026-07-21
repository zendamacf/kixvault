import { describe, expect, mock, test } from 'bun:test';

mock.module('./db', () => ({
  db: {},
}));

const {
  haveSneakerImagesChanged,
  normalizeSneakerImageUrls,
  formatSneakerImage,
  getPrimaryImageUrl,
} = await import('./sneaker-images');

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
});

describe('formatSneakerImage', () => {
  test('maps database rows to API image objects', () => {
    expect(
      formatSneakerImage({
        id: '22222222-2222-4222-8222-222222222222',
        sneakerId: '11111111-1111-4111-8111-111111111111',
        url: 'https://images.example.com/sneaker.png',
        sortOrder: 0,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
      }),
    ).toEqual({
      id: '22222222-2222-4222-8222-222222222222',
      url: 'https://images.example.com/sneaker.png',
      sortOrder: 0,
    });
  });
});

describe('getPrimaryImageUrl', () => {
  test('returns the first image URL when present', () => {
    expect(
      getPrimaryImageUrl([
        {
          id: 'img-1',
          sneakerId: 'sneaker-1',
          url: 'https://images.example.com/1.png',
          sortOrder: 0,
          createdAt: new Date(),
        },
      ]),
    ).toBe('https://images.example.com/1.png');
  });

  test('returns null when no images exist', () => {
    expect(getPrimaryImageUrl([])).toBeNull();
  });
});

describe('haveSneakerImagesChanged', () => {
  test('returns false when images are omitted from the update', () => {
    expect(
      haveSneakerImagesChanged(
        [
          {
            id: 'img-1',
            sneakerId: 'sneaker-1',
            url: 'https://images.example.com/1.png',
            sortOrder: 0,
            createdAt: new Date(),
          },
        ],
        undefined,
      ),
    ).toBe(false);
  });

  test('detects order and content changes', () => {
    const existingImages = [
      {
        id: 'img-1',
        sneakerId: 'sneaker-1',
        url: 'https://images.example.com/1.png',
        sortOrder: 0,
        createdAt: new Date(),
      },
      {
        id: 'img-2',
        sneakerId: 'sneaker-1',
        url: 'https://images.example.com/2.png',
        sortOrder: 1,
        createdAt: new Date(),
      },
    ];

    expect(haveSneakerImagesChanged(existingImages, ['https://images.example.com/1.png'])).toBe(
      true,
    );
    expect(
      haveSneakerImagesChanged(existingImages, [
        'https://images.example.com/1.png',
        'https://images.example.com/2.png',
      ]),
    ).toBe(false);
  });
});
