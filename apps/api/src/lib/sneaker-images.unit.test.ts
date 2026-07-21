import { describe, expect, mock, test } from 'bun:test';

mock.module('./db', () => ({
  db: {},
}));

const { haveSneakerImagesChanged, normalizeSneakerImageUrls } = await import('./sneaker-images');

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
