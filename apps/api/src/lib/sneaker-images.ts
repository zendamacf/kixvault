import { sneakerImages, sneakers } from '@kixvault/db';
import { eq, inArray } from 'drizzle-orm';
import { db } from './db';
import { normalizeImageSourceUrl } from './image-source-url';
import { buildSneakerImageStoragePath, getSneakerImageAbsolutePath } from './sneaker-image-paths';
import { buildSneakerImagePublicUrl } from './sneaker-image-urls';

export type SneakerImageRow = typeof sneakerImages.$inferSelect;

export { buildSneakerImageStoragePath, getSneakerImageAbsolutePath };

export function formatPrimaryImage(row: SneakerImageRow) {
  return {
    id: row.id,
    url: buildSneakerImagePublicUrl(row),
  };
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

export async function getPrimaryImagesForSneakerIds(
  sneakerIds: string[],
): Promise<Map<string, SneakerImageRow>> {
  if (sneakerIds.length === 0) {
    return new Map();
  }

  const rows = await db
    .select()
    .from(sneakerImages)
    .where(inArray(sneakerImages.sneakerId, sneakerIds));

  const imagesBySneakerId = new Map<string, SneakerImageRow>();

  for (const row of rows) {
    imagesBySneakerId.set(row.sneakerId, row);
  }

  return imagesBySneakerId;
}

export async function getSneakerPrimaryImage(sneakerId: string): Promise<SneakerImageRow | null> {
  const [row] = await db
    .select()
    .from(sneakerImages)
    .where(eq(sneakerImages.sneakerId, sneakerId))
    .limit(1);

  return row ?? null;
}

export async function replaceSneakerPrimaryImage(
  sneakerId: string,
  url: string | null | undefined,
): Promise<SneakerImageRow | null> {
  await db.delete(sneakerImages).where(eq(sneakerImages.sneakerId, sneakerId));
  await db.update(sneakers).set({ primaryImageId: null }).where(eq(sneakers.id, sneakerId));

  const normalizedUrl = normalizeSneakerImageUrls([url])[0];

  if (!normalizedUrl) {
    return null;
  }

  const [image] = await db
    .insert(sneakerImages)
    .values({
      sneakerId,
      sourceUrl: normalizedUrl,
    })
    .returning();

  await db.update(sneakers).set({ primaryImageId: image.id }).where(eq(sneakers.id, sneakerId));

  return image;
}

export function hasPrimaryImageChanged(
  existingImage: SneakerImageRow | null,
  inputUrl: string | null | undefined,
): boolean {
  if (inputUrl === undefined) {
    return false;
  }

  const normalizedInputUrl = normalizeSneakerImageUrls([inputUrl])[0] ?? null;
  const existingUrl = existingImage?.sourceUrl ?? null;

  return normalizedInputUrl !== existingUrl;
}
