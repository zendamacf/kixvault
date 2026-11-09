import { describe, expect, test } from 'bun:test';
import {
  formatGrailClearedMessage,
  formatWishlistPriority,
  getWishlistPriorityDotClassName,
} from './wishlist';

describe('formatWishlistPriority', () => {
  test('labels each priority level', () => {
    expect(formatWishlistPriority('low')).toBe('Low priority');
    expect(formatWishlistPriority('medium')).toBe('Medium priority');
    expect(formatWishlistPriority('high')).toBe('High priority');
  });
});

describe('getWishlistPriorityDotClassName', () => {
  test('returns distinct classes per priority', () => {
    expect(getWishlistPriorityDotClassName('low')).toContain('muted-foreground');
    expect(getWishlistPriorityDotClassName('medium')).toContain('bg-muted-foreground');
    expect(getWishlistPriorityDotClassName('high')).toContain('bg-primary');
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
