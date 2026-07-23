import { sneakers } from '@kixvault/db';
import { type CatalogSource, catalogSources } from '@kixvault/shared';
import { and, isNotNull } from 'drizzle-orm';
import { fetchCatalogProduct } from './catalog';
import { db } from './db';
import { replaceSneakerGallery360Images } from './sneaker-gallery-360-images';
import { replaceSneakerPrimaryImage } from './sneaker-images';

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

type CatalogImages = {
  imageUrl: string | null;
  gallery360Urls: string[];
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Re-fetch catalog primary and 360 gallery images for existing catalog-linked sneakers. */
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

  const imagesByCatalogKey = new Map<string, CatalogImages>();
  const failures: BackfillSneakerImagesResult['failures'] = [];
  let sneakersUpdated = 0;
  let catalogProductsFetched = 0;

  for (const row of rows) {
    const catalogSource = row.catalogSource as CatalogSource;
    const catalogId = row.catalogId as string;

    if (!catalogSources.includes(catalogSource)) {
      continue;
    }

    const catalogKey = `${catalogSource}:${catalogId}`;

    try {
      let catalogImages = imagesByCatalogKey.get(catalogKey);

      if (!catalogImages) {
        const product = await fetchCatalogProduct(catalogSource, catalogId);
        catalogImages = {
          imageUrl: product.imageUrl,
          gallery360Urls: product.gallery360Urls,
        };
        imagesByCatalogKey.set(catalogKey, catalogImages);
        catalogProductsFetched += 1;
        log(`Fetched ${catalogProductsFetched} catalog products (${catalogKey})`);

        if (delayMs > 0) {
          await sleep(delayMs);
        }
      }

      await replaceSneakerPrimaryImage(row.id, catalogImages.imageUrl);
      await replaceSneakerGallery360Images(row.id, catalogImages.gallery360Urls);
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
