import type { wishlistItems } from '@kixvault/db';
import type { CatalogSource } from '@kixvault/shared';
import { buildCatalogUrl } from '@kixvault/shared';

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
