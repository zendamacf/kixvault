import type { sneakers as sneakersTable } from "@kixvault/db";

type SneakerRow = typeof sneakersTable.$inferSelect;

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

export function formatSneaker(row: SneakerRow) {
  return {
    id: row.id,
    userId: row.userId,
    brand: row.brand,
    model: row.model,
    colorway: row.colorway,
    size: Number(row.size),
    condition: row.condition,
    purchasePrice: row.purchasePrice ? Number(row.purchasePrice) : null,
    purchaseDate: formatPurchaseDate(row.purchaseDate),
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
