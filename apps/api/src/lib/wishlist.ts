import { sneakers, wishlistItems } from '@kixvault/db';
import type {
  CatalogSource,
  MoveWishlistToCollectionInput,
  UpdateWishlistItemInput,
} from '@kixvault/shared';
import { buildCatalogUrl } from '@kixvault/shared';
import { and, desc, eq } from 'drizzle-orm';
import { CatalogProductNotFoundError, CatalogSearchError } from './catalog';
import { db } from './db';
import { enqueueImageFetches } from './image-fetch-queue';
import { isKicksdbConfigured } from './kicksdb';
import {
  getCatalogProductWithPrices,
  matchVariantPrice,
  storeMarketPriceAndSnapshot,
} from './pricing';
import { replaceSneakerGallery360Images } from './sneaker-gallery-360-images';
import { replaceSneakerPrimaryImage } from './sneaker-images';
import { formatSneakerWithPricing, parsePurchaseDate } from './sneakers';

type WishlistRow = typeof wishlistItems.$inferSelect;

export function parseWishlistId(value: string): string | null {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    return null;
  }

  return value;
}

export function formatWishlistItem(row: WishlistRow) {
  return {
    id: row.id,
    userId: row.userId,
    brand: row.brand,
    model: row.model,
    colorway: row.colorway,
    targetSize: row.targetSize ? Number(row.targetSize) : null,
    priority: row.priority,
    notes: row.notes,
    sku: row.sku,
    catalogSource: row.catalogSource,
    catalogId: row.catalogId,
    catalogUrl:
      row.catalogSource && row.catalogId
        ? buildCatalogUrl(row.catalogSource as CatalogSource, row.catalogId)
        : null,
    nickname: row.nickname,
    releaseDate: row.releaseDate ? row.releaseDate.toISOString().slice(0, 10) : null,
    description: row.description,
    imageUrl: row.imageUrl,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function buildWishlistUpdate(existing: WishlistRow, input: UpdateWishlistItemInput) {
  const updates: Partial<typeof wishlistItems.$inferInsert> = {};

  if (input.brand !== undefined) {
    updates.brand = input.brand;
  }

  if (input.model !== undefined) {
    updates.model = input.model;
  }

  if (input.colorway !== undefined) {
    updates.colorway = input.colorway ?? null;
  }

  if (input.targetSize !== undefined) {
    updates.targetSize = input.targetSize == null ? null : input.targetSize.toString();
  }

  if (input.priority !== undefined) {
    updates.priority = input.priority;
  }

  if (input.notes !== undefined) {
    updates.notes = input.notes ?? null;
  }

  if (input.sku !== undefined) {
    updates.sku = input.sku ?? null;
  }

  if (input.catalogSource !== undefined) {
    updates.catalogSource = input.catalogSource ?? null;
  }

  if (input.catalogId !== undefined) {
    updates.catalogId = input.catalogId ?? null;
  }

  if (input.nickname !== undefined) {
    updates.nickname = input.nickname ?? null;
  }

  if (input.releaseDate !== undefined) {
    updates.releaseDate = parsePurchaseDate(input.releaseDate);
  }

  if (input.description !== undefined) {
    updates.description = input.description ?? null;
  }

  if (input.imageUrl !== undefined) {
    updates.imageUrl = input.imageUrl ?? null;
  }

  return updates;
}

export async function moveWishlistItemToCollection(
  userId: string,
  item: WishlistRow,
  input: MoveWishlistToCollectionInput,
) {
  const notes = input.notes ?? item.notes ?? null;

  if (item.catalogSource && item.catalogId && isKicksdbConfigured()) {
    const { product: catalogProduct, variantPrices } = await getCatalogProductWithPrices(
      item.catalogSource as 'kicksdb:stockx',
      item.catalogId,
    );

    const [row] = await db
      .insert(sneakers)
      .values({
        userId,
        brand: catalogProduct.brand,
        model: catalogProduct.model,
        colorway: catalogProduct.colorway,
        nickname: catalogProduct.nickname,
        size: input.size.toString(),
        condition: input.condition,
        purchasePrice: input.purchasePrice?.toString() ?? null,
        purchaseDate: parsePurchaseDate(input.purchaseDate),
        notes,
        sku: catalogProduct.sku,
        catalogSource: catalogProduct.catalogSource,
        catalogId: catalogProduct.catalogId,
        releaseDate: parsePurchaseDate(catalogProduct.releaseDate),
        description: catalogProduct.description,
      })
      .returning();

    const imageFetchIds: Array<{ id: string; kind: 'primary' | 'gallery360' }> = [];

    if (catalogProduct.imageUrl) {
      const primaryImage = await replaceSneakerPrimaryImage(row.id, catalogProduct.imageUrl);

      if (primaryImage) {
        imageFetchIds.push({ id: primaryImage.id, kind: 'primary' });
      }
    }

    if (catalogProduct.gallery360Urls.length > 0) {
      const gallery360Images = await replaceSneakerGallery360Images(
        row.id,
        catalogProduct.gallery360Urls,
      );
      imageFetchIds.push(
        ...gallery360Images.map((image) => ({ id: image.id, kind: 'gallery360' as const })),
      );
    }

    for (const imageFetch of imageFetchIds) {
      enqueueImageFetches([imageFetch.id], { kind: imageFetch.kind });
    }

    const matchedPrice = matchVariantPrice(input.size, variantPrices);

    if (matchedPrice) {
      await storeMarketPriceAndSnapshot({
        catalogSource: catalogProduct.catalogSource,
        sku: catalogProduct.sku,
        size: input.size,
        price: matchedPrice.price,
        variantId: matchedPrice.variantId,
      });
    }

    await db.delete(wishlistItems).where(eq(wishlistItems.id, item.id));

    return formatSneakerWithPricing(row);
  }

  const [row] = await db
    .insert(sneakers)
    .values({
      userId,
      brand: item.brand,
      model: item.model,
      colorway: item.colorway,
      nickname: item.nickname,
      size: input.size.toString(),
      condition: input.condition,
      purchasePrice: input.purchasePrice?.toString() ?? null,
      purchaseDate: parsePurchaseDate(input.purchaseDate),
      notes,
      sku: item.sku,
      catalogSource: item.catalogSource,
      catalogId: item.catalogId,
      releaseDate: item.releaseDate,
      description: item.description,
    })
    .returning();

  if (item.imageUrl) {
    const primaryImage = await replaceSneakerPrimaryImage(row.id, item.imageUrl);

    if (primaryImage) {
      enqueueImageFetches([primaryImage.id]);
    }
  }

  await db.delete(wishlistItems).where(eq(wishlistItems.id, item.id));

  return formatSneakerWithPricing(row);
}

export async function listWishlistItemsForUser(userId: string) {
  const rows = await db
    .select()
    .from(wishlistItems)
    .where(eq(wishlistItems.userId, userId))
    .orderBy(desc(wishlistItems.createdAt));

  return rows.map(formatWishlistItem);
}

export async function getWishlistItemForUser(userId: string, id: string) {
  const [row] = await db
    .select()
    .from(wishlistItems)
    .where(and(eq(wishlistItems.id, id), eq(wishlistItems.userId, userId)));

  return row ?? null;
}

export { CatalogProductNotFoundError, CatalogSearchError };
