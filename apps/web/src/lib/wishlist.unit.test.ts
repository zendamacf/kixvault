import { describe, expect, test } from 'bun:test';
import {
  formatGrailClearedMessage,
  formatWishlistPriority,
  getWishlistPriorityBadgeClassName,
} from './wishlist';

describe('formatWishlistPriority', () => {
  test('labels each priority level', () => {
    expect(formatWishlistPriority('low')).toBe('Low priority');
    expect(formatWishlistPriority('medium')).toBe('Medium priority');
    expect(formatWishlistPriority('high')).toBe('High priority');
  });
});

describe('getWishlistPriorityBadgeClassName', () => {
  test('returns distinct classes per priority', () => {
    expect(getWishlistPriorityBadgeClassName('low')).toContain('muted');
    expect(getWishlistPriorityBadgeClassName('medium')).toContain('amber');
    expect(getWishlistPriorityBadgeClassName('high')).toContain('destructive');
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
