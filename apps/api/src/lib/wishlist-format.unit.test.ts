import { describe, expect, test } from 'bun:test';
import type { wishlistItems } from '@kixvault/db';
import { formatWishlistItem, parseWishlistId } from './wishlist-format';

const baseRow: typeof wishlistItems.$inferSelect = {
  id: '11111111-1111-4111-8111-111111111111',
  userId: 'user-1',
  brand: 'Nike',
  model: 'Dunk Low',
  colorway: 'Panda',
  targetSize: '10',
  priority: 'medium',
  notes: null,
  sku: 'SKU-1',
  catalogSource: 'kicksdb:stockx',
  catalogId: 'nike-dunk-low',
  nickname: 'Panda',
  releaseDate: new Date('2020-03-01T00:00:00.000Z'),
  description: 'Classic',
  imageUrl: 'https://images.example.com/dunk.png',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
};

describe('parseWishlistId', () => {
  test('accepts valid UUIDs', () => {
    expect(parseWishlistId('11111111-1111-4111-8111-111111111111')).toBe(
      '11111111-1111-4111-8111-111111111111',
    );
  });

  test('rejects invalid ids', () => {
    expect(parseWishlistId('not-a-uuid')).toBeNull();
    expect(parseWishlistId('11111111-1111-6111-8111-111111111111')).toBeNull();
  });
});

describe('formatWishlistItem', () => {
  test('maps database rows to API items', () => {
    expect(formatWishlistItem(baseRow)).toEqual({
      id: baseRow.id,
      userId: 'user-1',
      brand: 'Nike',
      model: 'Dunk Low',
      colorway: 'Panda',
      priority: 'medium',
      notes: null,
      sku: 'SKU-1',
      catalogSource: 'kicksdb:stockx',
      catalogId: 'nike-dunk-low',
      catalogUrl: 'https://stockx.com/nike-dunk-low',
      nickname: 'Panda',
      releaseDate: '2020-03-01',
      description: 'Classic',
      imageUrl: 'https://images.example.com/dunk.png',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    });
  });

  test('omits catalog URL when catalog linkage is missing', () => {
    const row = { ...baseRow, catalogSource: null, catalogId: null };
    const formatted = formatWishlistItem(row);
    expect(formatted.catalogUrl).toBeNull();
  });
});
