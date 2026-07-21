import { sneakers as sneakersTable } from '@kixvault/db';
import type { CatalogSource, UpdateSneakerInput } from '@kixvault/shared';
import { buildCatalogUrl } from '@kixvault/shared';
import { or, type SQL, sql } from 'drizzle-orm';
import {
  computeGainLoss,
  getMarketPriceForSneaker,
  getMarketPricesForSneakers,
  type MarketPriceRecord,
} from './pricing';

type SneakerRow = typeof sneakersTable.$inferSelect;

const catalogLinkedModelFields = [
  'brand',
  'model',
  'colorway',
  'nickname',
  'sku',
  'imageUrl',
  'catalogSource',
  'catalogId',
  'releaseDate',
  'description',
] as const;

type CatalogLinkedModelField = (typeof catalogLinkedModelFields)[number];

function nullableFieldChanged(
  existingValue: string | null,
  inputValue: string | null | undefined,
): boolean {
  return inputValue !== undefined && (inputValue ?? null) !== existingValue;
}

export function getCatalogLinkedModelFieldViolations(
  existing: SneakerRow,
  input: UpdateSneakerInput,
): CatalogLinkedModelField[] {
  if (!existing.sku) {
    return [];
  }

  const violations: CatalogLinkedModelField[] = [];

  if (input.brand !== undefined && input.brand !== existing.brand) {
    violations.push('brand');
  }

  if (input.model !== undefined && input.model !== existing.model) {
    violations.push('model');
  }

  if (nullableFieldChanged(existing.colorway, input.colorway)) {
    violations.push('colorway');
  }

  if (nullableFieldChanged(existing.nickname, input.nickname)) {
    violations.push('nickname');
  }

  if (nullableFieldChanged(existing.sku, input.sku)) {
    violations.push('sku');
  }

  if (nullableFieldChanged(existing.imageUrl, input.imageUrl)) {
    violations.push('imageUrl');
  }

  if (nullableFieldChanged(existing.catalogSource, input.catalogSource)) {
    violations.push('catalogSource');
  }

  if (nullableFieldChanged(existing.catalogId, input.catalogId)) {
    violations.push('catalogId');
  }

  if (nullableFieldChanged(formatPurchaseDate(existing.releaseDate), input.releaseDate)) {
    violations.push('releaseDate');
  }

  if (nullableFieldChanged(existing.description, input.description)) {
    violations.push('description');
  }

  return violations;
}

export function buildSneakerUpdate(
  existing: SneakerRow,
  input: UpdateSneakerInput,
): Partial<typeof sneakersTable.$inferInsert> {
  const isCatalogLinked = Boolean(existing.sku);

  return {
    ...(!isCatalogLinked && input.brand !== undefined ? { brand: input.brand } : {}),
    ...(!isCatalogLinked && input.model !== undefined ? { model: input.model } : {}),
    ...(!isCatalogLinked && input.colorway !== undefined ? { colorway: input.colorway } : {}),
    ...(!isCatalogLinked && input.nickname !== undefined ? { nickname: input.nickname } : {}),
    ...(input.size !== undefined ? { size: input.size.toString() } : {}),
    ...(input.condition !== undefined ? { condition: input.condition } : {}),
    ...(input.purchasePrice !== undefined
      ? { purchasePrice: input.purchasePrice?.toString() ?? null }
      : {}),
    ...(input.purchaseDate !== undefined
      ? { purchaseDate: parsePurchaseDate(input.purchaseDate) }
      : {}),
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
    ...(!isCatalogLinked && input.sku !== undefined ? { sku: input.sku } : {}),
    ...(!isCatalogLinked && input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
    ...(!isCatalogLinked && input.catalogSource !== undefined
      ? { catalogSource: input.catalogSource }
      : {}),
    ...(!isCatalogLinked && input.catalogId !== undefined ? { catalogId: input.catalogId } : {}),
    ...(!isCatalogLinked && input.releaseDate !== undefined
      ? { releaseDate: parsePurchaseDate(input.releaseDate) }
      : {}),
    ...(!isCatalogLinked && input.description !== undefined
      ? { description: input.description }
      : {}),
  };
}

export function buildSneakerSearchCondition(search: string): SQL | undefined {
  const trimmed = search.trim();

  if (!trimmed) {
    return undefined;
  }

  return or(
    sql`${sneakersTable.searchVector} @@ websearch_to_tsquery('english', ${trimmed})`,
    sql`position(lower(${trimmed}) in lower(coalesce(${sneakersTable.sku}, ''))) > 0`,
  );
}

export function parseSneakerId(id: string): string | null {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id) ? id : null;
}

export function parsePurchaseDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  return new Date(`${value}T00:00:00.000Z`);
}

export function formatPurchaseDate(value: Date | null): string | null {
  if (!value) {
    return null;
  }

  return value.toISOString().slice(0, 10);
}

export function formatSneaker(row: SneakerRow, marketPrice?: MarketPriceRecord | null) {
  const currentMarketPrice = marketPrice?.price ?? null;
  const pricedAt = marketPrice?.pricedAt.toISOString() ?? null;
  const gainLoss = computeGainLoss(row.purchasePrice, currentMarketPrice);

  return {
    id: row.id,
    userId: row.userId,
    brand: row.brand,
    model: row.model,
    colorway: row.colorway,
    nickname: row.nickname,
    size: Number(row.size),
    condition: row.condition,
    purchasePrice: row.purchasePrice ? Number(row.purchasePrice) : null,
    purchaseDate: formatPurchaseDate(row.purchaseDate),
    notes: row.notes,
    sku: row.sku,
    imageUrl: row.imageUrl,
    catalogSource: row.catalogSource as CatalogSource | null,
    catalogId: row.catalogId,
    releaseDate: formatPurchaseDate(row.releaseDate),
    description: row.description,
    catalogUrl:
      row.catalogSource && row.catalogId
        ? buildCatalogUrl(row.catalogSource as CatalogSource, row.catalogId)
        : null,
    currentMarketPrice,
    pricedAt,
    gainLoss,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function formatSneakersWithPricing(rows: SneakerRow[]) {
  const marketPrices = await getMarketPricesForSneakers(rows);

  return rows.map((row) => formatSneaker(row, getMarketPriceForSneaker(row, marketPrices)));
}

export async function formatSneakerWithPricing(row: SneakerRow) {
  const [formatted] = await formatSneakersWithPricing([row]);
  return formatted;
}
