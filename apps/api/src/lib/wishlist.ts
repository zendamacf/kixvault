import { sneakers, wishlistItems } from '@kixvault/db';
import type { MoveWishlistToCollectionInput } from '@kixvault/shared';
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

import { formatWishlistItem } from './wishlist-format';

export { formatWishlistItem, parseWishlistId } from './wishlist-format';
export { buildWishlistUpdate } from './wishlist-update';

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
