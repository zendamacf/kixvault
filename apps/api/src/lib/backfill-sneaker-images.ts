import { sneakers } from '@kixvault/db';
import type { CatalogSource } from '@kixvault/shared';
import { and, isNotNull } from 'drizzle-orm';
import { fetchCatalogProduct } from './catalog';
import { db } from './db';
import { replaceSneakerImages } from './sneaker-images';

export type BackfillSneakerImagesOptions = {
  delayMs?: number;
  onProgress?: (message: string) => void;
};

export type BackfillSneakerImagesResult = {
  sneakersProcessed: number;
  sneakersUpdated: number;
  catalogProductsFetched: number;
  failures: Array<{ sneakerId: string; error: string }>;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Re-fetch catalog gallery images for existing catalog-linked sneakers. */
export async function backfillSneakerImages(
  options: BackfillSneakerImagesOptions = {},
): Promise<BackfillSneakerImagesResult> {
  const delayMs = options.delayMs ?? 500;
  const log = options.onProgress ?? (() => {});

  const rows = await db
    .select({
      id: sneakers.id,
      catalogSource: sneakers.catalogSource,
      catalogId: sneakers.catalogId,
    })
    .from(sneakers)
    .where(and(isNotNull(sneakers.catalogSource), isNotNull(sneakers.catalogId)));

  const imageUrlsByCatalogKey = new Map<string, string[]>();
  const failures: BackfillSneakerImagesResult['failures'] = [];
  let sneakersUpdated = 0;
  let catalogProductsFetched = 0;

  for (const row of rows) {
    const catalogSource = row.catalogSource as CatalogSource;
    const catalogId = row.catalogId as string;
    const catalogKey = `${catalogSource}:${catalogId}`;

    try {
      let imageUrls = imageUrlsByCatalogKey.get(catalogKey);

      if (!imageUrls) {
        const product = await fetchCatalogProduct(catalogSource, catalogId);
        imageUrls = product.imageUrls;
        imageUrlsByCatalogKey.set(catalogKey, imageUrls);
        catalogProductsFetched += 1;
        log(`Fetched ${catalogProductsFetched} catalog products (${catalogKey})`);

        if (delayMs > 0) {
          await sleep(delayMs);
        }
      }

      await replaceSneakerImages(row.id, imageUrls);
      sneakersUpdated += 1;
    } catch (error) {
      failures.push({
        sneakerId: row.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      log(`Failed to backfill sneaker ${row.id}: ${failures.at(-1)?.error}`);
    }
  }

  return {
    sneakersProcessed: rows.length,
    sneakersUpdated,
    catalogProductsFetched,
    failures,
  };
}
