import { describe, expect, test } from 'bun:test';
import { formatGrailClearedMessage, formatWishlistPriority } from './wishlist';

describe('formatWishlistPriority', () => {
  test('labels each priority level', () => {
    expect(formatWishlistPriority('low')).toBe('Low priority');
    expect(formatWishlistPriority('medium')).toBe('Medium priority');
    expect(formatWishlistPriority('high')).toBe('High priority');
  });
});

describe('formatGrailClearedMessage', () => {
  test('uses singular copy for one grail', () => {
    expect(formatGrailClearedMessage([{ brand: 'Nike', model: 'Dunk Low' }])).toBe(
      'Congrats, you got your grail!',
    );
  });

  test('uses plural copy for multiple grails', () => {
    expect(
      formatGrailClearedMessage([
        { brand: 'Nike', model: 'Dunk Low' },
        { brand: 'Adidas', model: 'Samba' },
      ]),
    ).toBe('Congrats, you got 2 grails!');
  });
});
