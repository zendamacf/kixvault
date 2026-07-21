import { sneakerImages } from '@kixvault/db';
import { asc, eq, inArray } from 'drizzle-orm';
import { db } from './db';

export type SneakerImageRow = typeof sneakerImages.$inferSelect;

export function formatSneakerImage(row: SneakerImageRow) {
  return {
    id: row.id,
    url: row.url,
    sortOrder: row.sortOrder,
  };
}

export function getPrimaryImageUrl(images: SneakerImageRow[]): string | null {
  return images[0]?.url ?? null;
}

export function normalizeSneakerImageUrls(urls: string[] | null | undefined): string[] {
  if (!urls?.length) {
    return [];
  }

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const url of urls) {
    const trimmed = url.trim();

    if (!trimmed || seen.has(trimmed)) {
      continue;
    }

    seen.add(trimmed);
    normalized.push(trimmed);
  }

  return normalized;
}

export async function getImagesForSneakerIds(
  sneakerIds: string[],
): Promise<Map<string, SneakerImageRow[]>> {
  if (sneakerIds.length === 0) {
    return new Map();
  }

  const rows = await db
    .select()
    .from(sneakerImages)
    .where(inArray(sneakerImages.sneakerId, sneakerIds))
    .orderBy(asc(sneakerImages.sortOrder));

  const imagesBySneakerId = new Map<string, SneakerImageRow[]>();

  for (const row of rows) {
    const existing = imagesBySneakerId.get(row.sneakerId) ?? [];
    existing.push(row);
    imagesBySneakerId.set(row.sneakerId, existing);
  }

  return imagesBySneakerId;
}

export async function insertSneakerImages(
  sneakerId: string,
  urls: string[],
): Promise<SneakerImageRow[]> {
  const normalizedUrls = normalizeSneakerImageUrls(urls);

  if (normalizedUrls.length === 0) {
    return [];
  }

  return db
    .insert(sneakerImages)
    .values(
      normalizedUrls.map((url, index) => ({
        sneakerId,
        url,
        sortOrder: index,
      })),
    )
    .returning();
}

export async function replaceSneakerImages(
  sneakerId: string,
  urls: string[],
): Promise<SneakerImageRow[]> {
  await db.delete(sneakerImages).where(eq(sneakerImages.sneakerId, sneakerId));
  return insertSneakerImages(sneakerId, urls);
}

export function haveSneakerImagesChanged(
  existingImages: SneakerImageRow[],
  inputUrls: string[] | undefined,
): boolean {
  if (inputUrls === undefined) {
    return false;
  }

  const existingUrls = existingImages.map((image) => image.url);
  const normalizedInputUrls = normalizeSneakerImageUrls(inputUrls);

  if (existingUrls.length !== normalizedInputUrls.length) {
    return true;
  }

  return existingUrls.some((url, index) => url !== normalizedInputUrls[index]);
}
