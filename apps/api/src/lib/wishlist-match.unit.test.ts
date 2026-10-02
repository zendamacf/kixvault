import { describe, expect, test } from 'bun:test';
import { wishlistItemMatchesNewSneaker } from './wishlist-grail-match';

describe('wishlistItemMatchesNewSneaker', () => {
  test('matches catalog-linked grails by catalog source and id', () => {
    const item = {
      brand: 'Nike',
      model: 'Dunk Low',
      colorway: 'Panda',
      sku: 'SKU-A',
      catalogSource: 'kicksdb:stockx',
      catalogId: 'dunk-low-panda',
    };

    expect(
      wishlistItemMatchesNewSneaker(item, {
        brand: 'Other',
        model: 'Other',
        colorway: null,
        sku: null,
        catalogSource: 'kicksdb:stockx',
        catalogId: 'dunk-low-panda',
      }),
    ).toBe(true);
  });

  test('matches by sku when catalog ids differ', () => {
    const item = {
      brand: 'Nike',
      model: 'Air Max 1',
      colorway: 'Red',
      sku: 'AM1-RED',
      catalogSource: null,
      catalogId: null,
    };

    expect(
      wishlistItemMatchesNewSneaker(item, {
        brand: 'Nike',
        model: 'Air Max 1',
        colorway: 'Blue',
        sku: 'AM1-RED',
        catalogSource: 'kicksdb:stockx',
        catalogId: 'other-id',
      }),
    ).toBe(true);
  });

  test('matches manual entries by brand, model, and colorway', () => {
    const item = {
      brand: 'Adidas',
      model: 'Samba',
      colorway: null,
      sku: null,
      catalogSource: null,
      catalogId: null,
    };

    expect(
      wishlistItemMatchesNewSneaker(item, {
        brand: 'Adidas',
        model: 'Samba',
        colorway: null,
        sku: null,
        catalogSource: null,
        catalogId: null,
      }),
    ).toBe(true);

    expect(
      wishlistItemMatchesNewSneaker(item, {
        brand: 'Adidas',
        model: 'Samba',
        colorway: 'White',
        sku: null,
        catalogSource: null,
        catalogId: null,
      }),
    ).toBe(false);
  });
});
