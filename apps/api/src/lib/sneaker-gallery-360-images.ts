import { sneakerGallery360Images } from '@kixvault/db';
import { asc, eq, inArray } from 'drizzle-orm';
import { db } from './db';
import { normalizeSneakerImageUrls } from './sneaker-images';

export type SneakerGallery360ImageRow = typeof sneakerGallery360Images.$inferSelect;

export function normalizeSneakerGallery360ImageUrls(
  urls: Array<string | null | undefined> | null | undefined,
): string[] {
  return normalizeSneakerImageUrls(urls);
}

export async function getGallery360ImagesForSneakerIds(
  sneakerIds: string[],
): Promise<Map<string, SneakerGallery360ImageRow[]>> {
  if (sneakerIds.length === 0) {
    return new Map();
  }

  const rows = await db
    .select()
    .from(sneakerGallery360Images)
    .where(inArray(sneakerGallery360Images.sneakerId, sneakerIds))
    .orderBy(asc(sneakerGallery360Images.sortOrder));

  const imagesBySneakerId = new Map<string, SneakerGallery360ImageRow[]>();

  for (const row of rows) {
    const existing = imagesBySneakerId.get(row.sneakerId) ?? [];
    existing.push(row);
    imagesBySneakerId.set(row.sneakerId, existing);
  }

  return imagesBySneakerId;
}

export async function insertSneakerGallery360Images(
  sneakerId: string,
  urls: string[],
): Promise<SneakerGallery360ImageRow[]> {
  const normalizedUrls = normalizeSneakerGallery360ImageUrls(urls);

  if (normalizedUrls.length === 0) {
    return [];
  }

  return db
    .insert(sneakerGallery360Images)
    .values(
      normalizedUrls.map((sourceUrl, index) => ({
        sneakerId,
        sourceUrl,
        sortOrder: index,
      })),
    )
    .returning();
}

export async function replaceSneakerGallery360Images(
  sneakerId: string,
  urls: string[],
): Promise<SneakerGallery360ImageRow[]> {
  await db
    .delete(sneakerGallery360Images)
    .where(eq(sneakerGallery360Images.sneakerId, sneakerId));
  return insertSneakerGallery360Images(sneakerId, urls);
}
