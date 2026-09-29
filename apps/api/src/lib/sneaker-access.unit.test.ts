import { beforeEach, describe, expect, mock, test } from 'bun:test';

const mockWhere = mock(async () => [{ userId: 'user-1' }]);
const mockFrom = mock(() => ({ where: mockWhere }));
const mockSelect = mock(() => ({ from: mockFrom }));

mock.module('./db', () => ({
  db: {
    select: mockSelect,
  },
}));

const { getSneakerOwnerId } = await import('./sneaker-access');

describe('getSneakerOwnerId', () => {
  beforeEach(() => {
    mockWhere.mockImplementation(async () => [{ userId: 'user-1' }]);
  });

  test('returns the owner id when the sneaker exists', async () => {
    mockWhere.mockImplementationOnce(async () => [{ userId: 'user-abc' }]);

    await expect(
      getSneakerOwnerId('11111111-1111-4111-8111-111111111111'),
    ).resolves.toBe('user-abc');
  });

  test('returns null when the sneaker is missing', async () => {
    mockWhere.mockImplementationOnce(async () => []);

    await expect(
      getSneakerOwnerId('11111111-1111-4111-8111-111111111111'),
    ).resolves.toBeNull();
  });
});
