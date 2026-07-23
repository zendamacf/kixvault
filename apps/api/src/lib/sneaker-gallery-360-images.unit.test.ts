import { beforeEach, describe, expect, mock, test } from 'bun:test';

const sneakerId = '11111111-1111-4111-8111-111111111111';
const insertedFrames = [
  {
    id: '33333333-3333-4333-8333-333333333333',
    sneakerId,
    sourceUrl: 'https://images.stockx.com/360/frame-01.png?bg-remove=true',
    storagePath: null,
    fetchStatus: 'pending' as const,
    fetchError: null,
    fetchedAt: null,
    sortOrder: 0,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    sneakerId,
    sourceUrl: 'https://images.stockx.com/360/frame-02.png?bg-remove=true',
    storagePath: null,
    fetchStatus: 'pending' as const,
    fetchError: null,
    fetchedAt: null,
    sortOrder: 1,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
  },
];

const mockWhere = mock(async () => undefined);
const mockReturning = mock(async () => insertedFrames);
const mockValues = mock(() => ({ returning: mockReturning }));
const mockInsert = mock(() => ({ values: mockValues }));
const mockDelete = mock(() => ({ where: mockWhere }));

mock.module('./db', () => ({
  db: {
    delete: mockDelete,
    insert: mockInsert,
  },
}));

const {
  normalizeSneakerGallery360ImageUrls,
  replaceSneakerGallery360Images,
  insertSneakerGallery360Images,
} = await import('./sneaker-gallery-360-images');

describe('normalizeSneakerGallery360ImageUrls', () => {
  test('deduplicates and normalizes 360 frame URLs', () => {
    expect(
      normalizeSneakerGallery360ImageUrls([
        'https://images.stockx.com/360/frame-01.png',
        'https://images.stockx.com/360/frame-01.png',
        'https://images.stockx.com/360/frame-02.png',
      ]),
    ).toEqual([
      'https://images.stockx.com/360/frame-01.png?bg-remove=true',
      'https://images.stockx.com/360/frame-02.png?bg-remove=true',
    ]);
  });
});

describe('replaceSneakerGallery360Images', () => {
  beforeEach(() => {
    mockDelete.mockClear();
    mockInsert.mockClear();
    mockValues.mockClear();
    mockReturning.mockClear();
  });

  test('replaces existing frames with normalized URLs in order', async () => {
    const result = await replaceSneakerGallery360Images(sneakerId, [
      'https://images.stockx.com/360/frame-01.png',
      'https://images.stockx.com/360/frame-02.png',
    ]);

    expect(result).toEqual(insertedFrames);
    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockValues).toHaveBeenCalledWith([
      {
        sneakerId,
        sourceUrl: 'https://images.stockx.com/360/frame-01.png?bg-remove=true',
        sortOrder: 0,
      },
      {
        sneakerId,
        sourceUrl: 'https://images.stockx.com/360/frame-02.png?bg-remove=true',
        sortOrder: 1,
      },
    ]);
  });
});

describe('insertSneakerGallery360Images', () => {
  beforeEach(() => {
    mockInsert.mockClear();
  });

  test('returns an empty array without inserting when no URLs are provided', async () => {
    const result = await insertSneakerGallery360Images(sneakerId, []);

    expect(result).toEqual([]);
    expect(mockInsert).not.toHaveBeenCalled();
  });
});
