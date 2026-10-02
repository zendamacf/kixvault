import { wishlistItems } from '@kixvault/db';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from './db';
import { type SneakerGrailMatchInput, wishlistItemMatchesNewSneaker } from './wishlist-grail-match';

export type { SneakerGrailMatchInput } from './wishlist-grail-match';
export { wishlistItemMatchesNewSneaker } from './wishlist-grail-match';

export type ClearedGrailSummary = {
  id: string;
  brand: string;
  model: string;
};

export async function clearMatchingWishlistItemsForSneaker(
  userId: string,
  sneaker: SneakerGrailMatchInput,
): Promise<ClearedGrailSummary[]> {
  const rows = await db
    .select({
      id: wishlistItems.id,
      brand: wishlistItems.brand,
      model: wishlistItems.model,
      colorway: wishlistItems.colorway,
      sku: wishlistItems.sku,
      catalogSource: wishlistItems.catalogSource,
      catalogId: wishlistItems.catalogId,
    })
    .from(wishlistItems)
    .where(eq(wishlistItems.userId, userId));

  const matching = rows.filter((row) => wishlistItemMatchesNewSneaker(row, sneaker));

  if (matching.length === 0) {
    return [];
  }

  await db.delete(wishlistItems).where(
    and(
      eq(wishlistItems.userId, userId),
      inArray(
        wishlistItems.id,
        matching.map((item) => item.id),
      ),
    ),
  );

  return matching.map(({ id, brand, model }) => ({ id, brand, model }));
}
