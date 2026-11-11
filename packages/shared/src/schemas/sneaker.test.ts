import { describe, expect, test } from 'bun:test';
import {
  createSneakerFromCatalogSchema,
  createSneakerSchema,
  departureAllowsSalePrice,
  listSneakersQuerySchema,
  retireSneakerSchema,
  updateSneakerSchema,
} from './sneaker';

const validSneaker = {
  brand: 'Nike',
  model: 'Air Jordan 1',
  colorway: 'Chicago',
  size: 10,
  condition: 'deadstock' as const,
  purchasePrice: 180,
  purchaseDate: '2024-06-15',
  notes: 'DS from SNKRS',
  sku: 'DZ5485-612',
  primaryImage: 'https://images.stockx.com/example.png',
  catalogSource: 'kicksdb:stockx' as const,
  catalogId: 'air-jordan-1-chicago',
};

describe('createSneakerSchema', () => {
  test('accepts valid sneaker input', () => {
    const result = createSneakerSchema.safeParse(validSneaker);

    expect(result.success).toBe(true);
  });

  test('coerces numeric fields from strings', () => {
    const result = createSneakerSchema.safeParse({
      ...validSneaker,
      size: '10.5',
      purchasePrice: '199',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.size).toBe(10.5);
      expect(result.data.purchasePrice).toBe(199);
    }
  });

  test('allows purchase price to be omitted', () => {
    const result = createSneakerSchema.safeParse({
      ...validSneaker,
      purchasePrice: undefined,
    });

    expect(result.success).toBe(true);
  });

  test('treats an empty purchase price as omitted', () => {
    const result = createSneakerSchema.safeParse({
      ...validSneaker,
      purchasePrice: '',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.purchasePrice).toBeUndefined();
    }
  });

  test('accepts an empty purchase date', () => {
    const result = createSneakerSchema.safeParse({
      ...validSneaker,
      purchaseDate: '',
    });

    expect(result.success).toBe(true);
  });

  test('rejects invalid purchase date format', () => {
    const result = createSneakerSchema.safeParse({
      ...validSneaker,
      purchaseDate: '15-06-2024',
    });

    expect(result.success).toBe(false);
  });
});

describe('updateSneakerSchema', () => {
  test('allows partial updates', () => {
    const result = updateSneakerSchema.safeParse({
      notes: 'Worn twice',
      purchasePrice: 150,
    });

    expect(result.success).toBe(true);
  });
});

describe('createSneakerFromCatalogSchema', () => {
  test('accepts catalog-linked sneaker input', () => {
    const result = createSneakerFromCatalogSchema.safeParse({
      catalogSource: 'kicksdb:stockx',
      catalogId: 'air-jordan-1-chicago',
      size: 10,
      condition: 'deadstock',
      purchasePrice: 180,
      purchaseDate: '2024-06-15',
      notes: 'DS pickup',
    });

    expect(result.success).toBe(true);
  });

  test('rejects unsupported catalog source', () => {
    const result = createSneakerFromCatalogSchema.safeParse({
      catalogSource: 'kicksdb:goat',
      catalogId: 'air-jordan-1-chicago',
      size: 10,
      condition: 'deadstock',
    });

    expect(result.success).toBe(false);
  });

  test('requires catalog source and id', () => {
    const result = createSneakerFromCatalogSchema.safeParse({
      size: 10,
      condition: 'deadstock',
    });

    expect(result.success).toBe(false);
  });
});

describe('listSneakersQuerySchema', () => {
  test('applies default sort and order', () => {
    const result = listSneakersQuerySchema.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sort).toBe('created_at');
      expect(result.data.order).toBe('desc');
    }
  });

  test('lists active pairs by default', () => {
    const result = listSneakersQuerySchema.safeParse({});

    expect(result.success && result.data.status).toBe('active');
  });

  test('accepts retired status, a departure type, and the departed_on sort', () => {
    const result = listSneakersQuerySchema.safeParse({
      status: 'retired',
      departureType: 'sold',
      sort: 'departed_on',
    });

    expect(result.success).toBe(true);
  });

  test('rejects an unknown status', () => {
    expect(listSneakersQuerySchema.safeParse({ status: 'archived' }).success).toBe(false);
  });

  test('accepts search and condition filters', () => {
    const result = listSneakersQuerySchema.safeParse({
      search: 'jordan',
      condition: 'lightly_worn',
      sort: 'brand',
      order: 'asc',
    });

    expect(result.success).toBe(true);
  });
});

describe('retireSneakerSchema', () => {
  const base = { departedOn: '2025-03-01' };

  test('requires a sale price for sold pairs', () => {
    const result = retireSneakerSchema.safeParse({ ...base, departureType: 'sold' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['salePrice']);
    }
  });

  test('accepts a sold pair with a sale price, including zero', () => {
    expect(
      retireSneakerSchema.safeParse({ ...base, departureType: 'sold', salePrice: 250 }).success,
    ).toBe(true);
    expect(
      retireSneakerSchema.safeParse({ ...base, departureType: 'sold', salePrice: 0 }).success,
    ).toBe(true);
  });

  test('coerces a sale price sent as text', () => {
    const result = retireSneakerSchema.safeParse({
      ...base,
      departureType: 'sold',
      salePrice: '199.99',
    });

    expect(result.success && result.data.salePrice).toBe(199.99);
  });

  test('allows traded pairs with or without a sale price', () => {
    expect(retireSneakerSchema.safeParse({ ...base, departureType: 'traded' }).success).toBe(true);
    expect(
      retireSneakerSchema.safeParse({ ...base, departureType: 'traded', salePrice: 120 }).success,
    ).toBe(true);
  });

  for (const departureType of ['donated', 'gifted', 'lost', 'other'] as const) {
    test(`refuses a sale price for ${departureType} pairs`, () => {
      const result = retireSneakerSchema.safeParse({ ...base, departureType, salePrice: 10 });

      expect(result.success).toBe(false);
    });

    test(`accepts ${departureType} pairs without a sale price`, () => {
      expect(retireSneakerSchema.safeParse({ ...base, departureType }).success).toBe(true);
      expect(
        retireSneakerSchema.safeParse({ ...base, departureType, salePrice: null }).success,
      ).toBe(true);
    });
  }

  test('rejects a missing, malformed, or future date', () => {
    expect(retireSneakerSchema.safeParse({ departureType: 'gifted' }).success).toBe(false);
    expect(
      retireSneakerSchema.safeParse({ departureType: 'gifted', departedOn: '03/01/2025' }).success,
    ).toBe(false);
    expect(
      retireSneakerSchema.safeParse({ departureType: 'gifted', departedOn: '2999-01-01' }).success,
    ).toBe(false);
  });

  test('rejects an unknown departure type and a negative price', () => {
    expect(retireSneakerSchema.safeParse({ ...base, departureType: 'stolen' }).success).toBe(false);
    expect(
      retireSneakerSchema.safeParse({ ...base, departureType: 'sold', salePrice: -5 }).success,
    ).toBe(false);
  });
});

describe('departureAllowsSalePrice', () => {
  test('is true only for sold and traded', () => {
    expect(departureAllowsSalePrice('sold')).toBe(true);
    expect(departureAllowsSalePrice('traded')).toBe(true);
    expect(departureAllowsSalePrice('gifted')).toBe(false);
    expect(departureAllowsSalePrice('donated')).toBe(false);
  });
});
