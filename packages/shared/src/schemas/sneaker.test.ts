import { describe, expect, test } from 'bun:test';
import {
  createSneakerFromCatalogSchema,
  createSneakerSchema,
  listSneakersQuerySchema,
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
  imageUrl: 'https://images.stockx.com/example.png',
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
      catalogSource: 'kicksdb:goat',
      catalogId: 'air-jordan-1-chicago',
      size: 10,
      condition: 'deadstock',
      purchasePrice: 180,
      purchaseDate: '2024-06-15',
      notes: 'DS pickup',
    });

    expect(result.success).toBe(true);
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
