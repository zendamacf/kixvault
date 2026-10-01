import { describe, expect, test } from 'bun:test';
import {
  createWishlistFromCatalogSchema,
  createWishlistItemSchema,
  moveWishlistToCollectionSchema,
  updateWishlistItemSchema,
} from './wishlist';

describe('wishlist schemas', () => {
  test('createWishlistItemSchema applies default priority', () => {
    expect(
      createWishlistItemSchema.parse({
        brand: 'Nike',
        model: 'Dunk Low',
      }),
    ).toMatchObject({ priority: 'medium' });
  });

  test('createWishlistFromCatalogSchema requires catalog fields', () => {
    expect(() =>
      createWishlistFromCatalogSchema.parse({
        catalogSource: 'kicksdb:stockx',
        catalogId: 'air-max-1',
      }),
    ).not.toThrow();
  });

  test('moveWishlistToCollectionSchema requires size and condition', () => {
    expect(() =>
      moveWishlistToCollectionSchema.parse({
        size: 10,
        condition: 'deadstock',
      }),
    ).not.toThrow();
  });

  test('updateWishlistItemSchema allows partial PATCH bodies', () => {
    expect(updateWishlistItemSchema.parse({ priority: 'low' })).toMatchObject({ priority: 'low' });
    expect(updateWishlistItemSchema.parse({ notes: 'Updated' })).toMatchObject({ notes: 'Updated' });
  });
});
