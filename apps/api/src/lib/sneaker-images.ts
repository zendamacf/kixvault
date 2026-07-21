import { sneakerImages } from '@kixvault/db';
import { asc, eq, inArray } from 'drizzle-orm';
import { db } from './db';
import { normalizeImageSourceUrl } from './image-source-url';
import { buildSneakerImageStoragePath, getSneakerImageAbsolutePath } from './sneaker-image-paths';
import { buildSneakerImagePublicUrl } from './sneaker-image-urls';

export type SneakerImageRow = typeof sneakerImages.$inferSelect;

export { buildSneakerImageStoragePath, getSneakerImageAbsolutePath };

export function formatSneakerImage(row: SneakerImageRow) {
  return {
    id: row.id,
    url: buildSneakerImagePublicUrl(row),
    sortOrder: row.sortOrder,
  };
}

export function getPrimaryImageUrl(images: SneakerImageRow[]): string | null {
  if (images.length === 0) {
    return null;
  }

  return buildSneakerImagePublicUrl(images[0]);
}

export function normalizeSneakerImageUrls(
  urls: Array<string | null | undefined> | null | undefined,
): string[] {
  if (!urls?.length) {
    return [];
  }

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const url of urls) {
    if (url == null) {
      continue;
    }

    const trimmed = normalizeImageSourceUrl(url.trim());

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

export async function getSneakerImageByKey(
  sneakerId: string,
  sortOrder: number,
): Promise<SneakerImageRow | null> {
  const images = await db
    .select()
    .from(sneakerImages)
    .where(eq(sneakerImages.sneakerId, sneakerId));

  return images.find((image) => image.sortOrder === sortOrder) ?? null;
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
      normalizedUrls.map((sourceUrl, index) => ({
        sneakerId,
        sourceUrl,
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

  const existingUrls = existingImages.map((image) => image.sourceUrl);
  const normalizedInputUrls = normalizeSneakerImageUrls(inputUrls);

  if (existingUrls.length !== normalizedInputUrls.length) {
    return true;
  }

  return existingUrls.some((url, index) => url !== normalizedInputUrls[index]);
}
