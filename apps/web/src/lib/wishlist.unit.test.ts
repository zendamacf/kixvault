import { describe, expect, test } from 'bun:test';
import { formatWishlistPriority } from './wishlist';

describe('formatWishlistPriority', () => {
  test('labels each priority level', () => {
    expect(formatWishlistPriority('low')).toBe('Low priority');
    expect(formatWishlistPriority('medium')).toBe('Medium priority');
    expect(formatWishlistPriority('high')).toBe('High priority');
  });
});
