import { beforeEach, describe, expect, mock, test } from 'bun:test';

const sneakerId = '11111111-1111-4111-8111-111111111111';
const insertedImage = {
  id: '22222222-2222-4222-8222-222222222222',
  sneakerId,
  sourceUrl: 'https://images.stockx.com/primary.png?bg-remove=true',
  storagePath: null,
  fetchStatus: 'pending' as const,
  fetchError: null,
  fetchedAt: null,
  sortOrder: 0,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
};

const mockWhere = mock(async () => undefined);
const mockReturning = mock(async () => [insertedImage]);
const mockValues = mock(() => ({ returning: mockReturning }));
const mockInsert = mock(() => ({ values: mockValues }));
const mockSet = mock(() => ({ where: mockWhere }));
const mockUpdate = mock(() => ({ set: mockSet }));
const mockDelete = mock(() => ({ where: mockWhere }));

mock.module('./env', () => ({
  env: {
    imagePublicBasePath: '/api/images',
    imageStoragePath: './data/images',
  },
}));

mock.module('./db', () => ({
  db: {
    delete: mockDelete,
    update: mockUpdate,
    insert: mockInsert,
  },
}));

const { replaceSneakerPrimaryImage } = await import('./sneaker-images');

describe('replaceSneakerPrimaryImage', () => {
  beforeEach(() => {
    mockDelete.mockClear();
    mockUpdate.mockClear();
    mockInsert.mockClear();
    mockValues.mockClear();
    mockReturning.mockClear();
  });

  test('replaces existing images and links the sneaker primary image', async () => {
    const result = await replaceSneakerPrimaryImage(
      sneakerId,
      'https://images.stockx.com/primary.png',
    );

    expect(result).toEqual(insertedImage);
    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledTimes(2);
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockValues).toHaveBeenCalledWith({
      sneakerId,
      sourceUrl: 'https://images.stockx.com/primary.png?bg-remove=true',
      sortOrder: 0,
    });
  });

  test('returns null without inserting when the URL is empty', async () => {
    const result = await replaceSneakerPrimaryImage(sneakerId, null);

    expect(result).toBeNull();
    expect(mockInsert).not.toHaveBeenCalled();
  });
});
