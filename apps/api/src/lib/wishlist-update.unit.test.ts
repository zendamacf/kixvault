import { describe, expect, test } from 'bun:test';
import type { wishlistItems } from '@kixvault/db';
import { buildWishlistUpdate } from './wishlist-update';

const baseRow: typeof wishlistItems.$inferSelect = {
  id: '11111111-1111-4111-8111-111111111111',
  userId: 'user-1',
  brand: 'Nike',
  model: 'Dunk Low',
  colorway: 'Panda',
  targetSize: '10',
  priority: 'medium',
  notes: 'Need for rotation',
  sku: null,
  catalogSource: null,
  catalogId: null,
  nickname: null,
  releaseDate: null,
  description: null,
  imageUrl: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
};

describe('buildWishlistUpdate', () => {
  test('maps partial fields for PATCH', () => {
    expect(
      buildWishlistUpdate(baseRow, {
        priority: 'high',
        notes: 'Grail pair',
        targetSize: 9.5,
      }),
    ).toEqual({
      priority: 'high',
      notes: 'Grail pair',
      targetSize: '9.5',
    });
  });

  test('clears nullable fields when set to null', () => {
    expect(
      buildWishlistUpdate(baseRow, {
        colorway: null,
        targetSize: null,
        notes: null,
      }),
    ).toEqual({
      colorway: null,
      targetSize: null,
      notes: null,
    });
  });

  test('returns an empty object when input has no changes', () => {
    expect(buildWishlistUpdate(baseRow, {})).toEqual({});
  });

  test('parses release dates for PATCH', () => {
    expect(buildWishlistUpdate(baseRow, { releaseDate: '2024-06-15' })).toEqual({
      releaseDate: new Date('2024-06-15T00:00:00.000Z'),
    });
  });
});
