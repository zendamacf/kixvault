import { describe, expect, test } from 'bun:test';
import type { sneakers as sneakersTable } from '@kixvault/db';
import {
  buildSneakerSearchCondition,
  buildSneakerUpdate,
  formatSneaker,
  getCatalogLinkedModelFieldViolations,
  parsePurchaseDate,
  parseSneakerId,
} from './sneakers';

type SneakerRow = typeof sneakersTable.$inferSelect;

function createSneakerRow(overrides: Partial<SneakerRow> = {}): SneakerRow {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    userId: 'user-1',
    brand: 'Nike',
    model: 'Air Max 1',
    colorway: 'Anniversary Red',
    size: '10',
    condition: 'deadstock',
    purchasePrice: '180.00',
    purchaseDate: new Date('2024-06-15T00:00:00.000Z'),
    notes: 'Deadstock pickup',
    sku: 'TEST-SKU-001',
    imageUrl: 'https://images.example.com/sneaker.png',
    catalogSource: 'kicksdb:stockx',
    catalogId: 'air-max-1',
    nickname: 'Anniversary Red',
    releaseDate: new Date('2015-04-25T00:00:00.000Z'),
    description: 'The original Air Max with visible Air cushioning.',
    searchVector: "'air':1 'max':2 'nike':3",
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-02T00:00:00.000Z'),
    ...overrides,
  };
}

describe('parseSneakerId', () => {
  test('accepts valid UUIDs', () => {
    expect(parseSneakerId('11111111-1111-4111-8111-111111111111')).toBe(
      '11111111-1111-4111-8111-111111111111',
    );
  });

  test('rejects invalid ids', () => {
    expect(parseSneakerId('not-a-uuid')).toBeNull();
    expect(parseSneakerId('11111111-1111-4111-8111')).toBeNull();
  });
});

describe('parsePurchaseDate', () => {
  test('parses YYYY-MM-DD strings as UTC dates', () => {
    expect(parsePurchaseDate('2024-06-15')?.toISOString()).toBe('2024-06-15T00:00:00.000Z');
  });

  test('returns null for empty values', () => {
    expect(parsePurchaseDate('')).toBeNull();
    expect(parsePurchaseDate(null)).toBeNull();
    expect(parsePurchaseDate(undefined)).toBeNull();
  });
});

describe('formatSneaker', () => {
  test('normalizes numeric and date fields', () => {
    const formatted = formatSneaker(createSneakerRow());

    expect(formatted).toEqual({
      id: '11111111-1111-4111-8111-111111111111',
      userId: 'user-1',
      brand: 'Nike',
      model: 'Air Max 1',
      colorway: 'Anniversary Red',
      nickname: 'Anniversary Red',
      size: 10,
      condition: 'deadstock',
      purchasePrice: 180,
      purchaseDate: '2024-06-15',
      notes: 'Deadstock pickup',
      sku: 'TEST-SKU-001',
      imageUrl: 'https://images.example.com/sneaker.png',
      catalogSource: 'kicksdb:stockx',
      catalogId: 'air-max-1',
      catalogUrl: 'https://stockx.com/air-max-1',
      releaseDate: '2015-04-25',
      description: 'The original Air Max with visible Air cushioning.',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
    });
  });
});

describe('getCatalogLinkedModelFieldViolations', () => {
  test('returns no violations for sneakers without a SKU', () => {
    const existing = createSneakerRow({ sku: null });

    expect(getCatalogLinkedModelFieldViolations(existing, { brand: 'Adidas' })).toEqual([]);
  });

  test('flags catalog-linked model field changes', () => {
    const existing = createSneakerRow();

    expect(
      getCatalogLinkedModelFieldViolations(existing, {
        brand: 'Adidas',
        notes: 'Updated notes',
      }),
    ).toEqual(['brand']);
  });
});

describe('buildSneakerUpdate', () => {
  test('locks catalog-linked model fields but allows editable fields', () => {
    const existing = createSneakerRow();

    expect(
      buildSneakerUpdate(existing, {
        brand: 'Adidas',
        notes: 'Updated notes',
        purchasePrice: 150,
      }),
    ).toEqual({
      purchasePrice: '150',
      notes: 'Updated notes',
    });
  });

  test('allows model field updates when sneaker is not catalog-linked', () => {
    const existing = createSneakerRow({ sku: null, catalogSource: null, catalogId: null });

    expect(
      buildSneakerUpdate(existing, {
        brand: 'Adidas',
        model: 'Samba',
      }),
    ).toEqual({
      brand: 'Adidas',
      model: 'Samba',
    });
  });
});

describe('buildSneakerSearchCondition', () => {
  test('returns undefined for blank search input', () => {
    expect(buildSneakerSearchCondition('   ')).toBeUndefined();
  });

  test('builds a full-text and SKU search condition', () => {
    const condition = buildSneakerSearchCondition('Nike');

    expect(condition).toBeDefined();
  });
});
