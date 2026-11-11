import { sneakers as sneakersTable } from '@kixvault/db';
import type {
  CatalogSource,
  DepartureType,
  RetireSneakerInput,
  SneakerStatus,
  UpdateSneakerInput,
} from '@kixvault/shared';
import { buildCatalogUrl, suggestCondition } from '@kixvault/shared';
import { isNotNull, isNull, or, type SQL, sql } from 'drizzle-orm';
import {
  computeGainLoss,
  getMarketPriceForSneaker,
  getMarketPricesForSneakers,
  type MarketPriceRecord,
} from './pricing';
import {
  formatSneakerGallery360Image,
  getGallery360ImagesForSneakerIds,
  type SneakerGallery360ImageRow,
} from './sneaker-gallery-360-images';
import {
  formatPrimaryImage,
  getPrimaryImagesForSneakerIds,
  hasPrimaryImageChanged,
  type SneakerImageRow,
} from './sneaker-images';
import { getWearStatsForSneakerIds, type WearStats } from './wears';

type SneakerRow = typeof sneakersTable.$inferSelect;

const catalogLinkedModelFields = [
  'brand',
  'model',
  'colorway',
  'nickname',
  'sku',
  'primaryImage',
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
  existingPrimaryImage: SneakerImageRow | null = null,
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

  if (hasPrimaryImageChanged(existingPrimaryImage, input.primaryImage)) {
    violations.push('primaryImage');
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

/** Active pairs have no departure type. Retired pairs have left the vault but keep their history. */
export function buildStatusCondition(status: SneakerStatus): SQL | undefined {
  if (status === 'active') {
    return isNull(sneakersTable.departureType);
  }

  if (status === 'retired') {
    return isNotNull(sneakersTable.departureType);
  }

  return undefined;
}

export function isRetired(row: Pick<SneakerRow, 'departureType'>): boolean {
  return row.departureType !== null;
}

export function buildRetireUpdate(
  input: RetireSneakerInput,
): Partial<typeof sneakersTable.$inferInsert> {
  return {
    departureType: input.departureType,
    departedOn: parsePurchaseDate(input.departedOn),
    salePrice: input.salePrice != null ? input.salePrice.toString() : null,
    departureNotes: input.notes || null,
  };
}

export function buildRestoreUpdate(): Partial<typeof sneakersTable.$inferInsert> {
  return {
    departureType: null,
    departedOn: null,
    salePrice: null,
    departureNotes: null,
  };
}

/**
 * Sale price minus purchase price for a sold pair. Null for other departures and when either
 * price is unknown. Kept apart from the unrealized gain on pairs still in the vault.
 */
export function computeRealizedGainLoss(
  row: Pick<SneakerRow, 'departureType' | 'salePrice' | 'purchasePrice'>,
): number | null {
  if (row.departureType !== 'sold' || row.salePrice == null || row.purchasePrice == null) {
    return null;
  }

  return Math.round((Number(row.salePrice) - Number(row.purchasePrice)) * 100) / 100;
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

export function formatSneaker(
  row: SneakerRow,
  options: {
    marketPrice?: MarketPriceRecord | null;
    primaryImage?: SneakerImageRow | null;
    gallery360Images?: SneakerGallery360ImageRow[];
    wearStats?: WearStats;
  } = {},
) {
  const wearCount = options.wearStats?.wearCount ?? 0;
  const marketPrice = options.marketPrice;
  const formattedPrimaryImage = options.primaryImage
    ? formatPrimaryImage(options.primaryImage)
    : null;
  const formattedGallery360Images = (options.gallery360Images ?? []).map(
    formatSneakerGallery360Image,
  );
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
    primaryImage: formattedPrimaryImage,
    gallery360Images: formattedGallery360Images,
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
    wearCount,
    lastWornOn: options.wearStats?.lastWornOn ?? null,
    suggestedCondition: isRetired(row) ? null : suggestCondition(row.condition, wearCount),
    departureType: row.departureType as DepartureType | null,
    departedOn: formatPurchaseDate(row.departedOn),
    salePrice: row.salePrice != null ? Number(row.salePrice) : null,
    departureNotes: row.departureNotes,
    realizedGainLoss: computeRealizedGainLoss(row),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function formatSneakersWithPricing(rows: SneakerRow[]) {
  const sneakerIds = rows.map((row) => row.id);
  const [
    marketPrices,
    primaryImagesBySneakerId,
    gallery360ImagesBySneakerId,
    wearStatsBySneakerId,
  ] = await Promise.all([
    getMarketPricesForSneakers(rows),
    getPrimaryImagesForSneakerIds(sneakerIds),
    getGallery360ImagesForSneakerIds(sneakerIds),
    getWearStatsForSneakerIds(sneakerIds),
  ]);

  return rows.map((row) =>
    formatSneaker(row, {
      marketPrice: getMarketPriceForSneaker(row, marketPrices),
      primaryImage: primaryImagesBySneakerId.get(row.id) ?? null,
      gallery360Images: gallery360ImagesBySneakerId.get(row.id) ?? [],
      wearStats: wearStatsBySneakerId.get(row.id),
    }),
  );
}

export async function formatSneakerWithPricing(row: SneakerRow) {
  const [formatted] = await formatSneakersWithPricing([row]);
  return formatted;
}
