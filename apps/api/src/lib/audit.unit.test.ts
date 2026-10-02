import { beforeEach, describe, expect, mock, test } from 'bun:test';

const mockInsert = mock(async () => {});

mock.module('./db', () => ({
  db: {
    insert: () => ({
      values: mockInsert,
    }),
  },
}));

const { recordSneakerCreatedAuditEvent } = await import('./audit');

describe('recordSneakerCreatedAuditEvent', () => {
  beforeEach(() => {
    mockInsert.mockClear();
  });

  test('records sneaker.created when no grails were cleared', async () => {
    await recordSneakerCreatedAuditEvent({
      userId: 'user-1',
      sneaker: { id: 'sneaker-1', brand: 'Nike', model: 'Dunk Low' },
      clearedGrails: [],
    });

    expect(mockInsert).toHaveBeenCalledTimes(1);
    const values = mockInsert.mock.calls[0]?.[0];
    expect(values.action).toBe('sneaker.created');
    expect(values.metadata).toEqual({ brand: 'Nike', model: 'Dunk Low' });
  });

  test('records sneaker.created_from_grail when grails were cleared', async () => {
    await recordSneakerCreatedAuditEvent({
      userId: 'user-1',
      sneaker: { id: 'sneaker-1', brand: 'Nike', model: 'Dunk Low' },
      clearedGrails: [{ brand: 'Nike', model: 'Dunk Low' }],
    });

    expect(mockInsert).toHaveBeenCalledTimes(1);
    const values = mockInsert.mock.calls[0]?.[0];
    expect(values.action).toBe('sneaker.created_from_grail');
    expect(values.metadata).toEqual({
      brand: 'Nike',
      model: 'Dunk Low',
      grailsCleared: 1,
    });
  });
});
