import type { wishlistItems } from '@kixvault/db';
import type { UpdateWishlistItemInput } from '@kixvault/shared';

type WishlistRow = typeof wishlistItems.$inferSelect;

function parseWishlistDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  return new Date(`${value}T00:00:00.000Z`);
}

export function buildWishlistUpdate(_existing: WishlistRow, input: UpdateWishlistItemInput) {
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
    updates.releaseDate = parseWishlistDate(input.releaseDate);
  }

  if (input.description !== undefined) {
    updates.description = input.description ?? null;
  }

  if (input.imageUrl !== undefined) {
    updates.imageUrl = input.imageUrl ?? null;
  }

  return updates;
}
