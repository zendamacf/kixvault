import { sneakerGallery360Images, sneakerImages } from '@kixvault/db';
import { inArray } from 'drizzle-orm';
import { db } from './db';
import {
  fetchAndStoreSneakerGallery360Image,
  fetchAndStoreSneakerImage,
  getSneakerGallery360ImageById,
  getSneakerImageById,
} from './image-fetch';

export type BackfillImageStorageOptions = {
  onProgress?: (message: string) => void;
  reprocess?: boolean;
};

export type BackfillImageStorageResult = {
  imagesProcessed: number;
  imagesReady: number;
  failures: Array<{ imageId: string; error: string }>;
};

/** Download and convert pending or failed sneaker images to local WebP storage. */
export async function backfillImageStorage(
  options: BackfillImageStorageOptions = {},
): Promise<BackfillImageStorageResult> {
  const log = options.onProgress ?? (() => {});

  const primaryImageRows = await db
    .select({ id: sneakerImages.id })
    .from(sneakerImages)
    .where(
      inArray(
        sneakerImages.fetchStatus,
        options.reprocess ? ['pending', 'failed', 'ready'] : ['pending', 'failed'],
      ),
    );
  log(`Found ${primaryImageRows.length} primary images to process`);

  const failures: BackfillImageStorageResult['failures'] = [];
  let imagesReady = 0;

  await Promise.all(
    primaryImageRows.map(async (row) => {
      try {
        await fetchAndStoreSneakerImage(row.id, { force: options.reprocess });
        const image = await getSneakerImageById(row.id);

        if (image?.fetchStatus === 'ready') {
          imagesReady += 1;
          log(`Stored primary image ${row.id}`);
        } else {
          failures.push({
            imageId: row.id,
            error: image?.fetchError ?? 'Primary image fetch did not complete',
          });
          log(`Failed to store primary image ${row.id}: ${failures.at(-1)?.error}`);
        }
      } catch (error) {
        failures.push({
          imageId: row.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        log(`Failed to store primary image ${row.id}: ${failures.at(-1)?.error}`);
      }
    }),
  );

  const galleryImageRows = await db
    .select({ id: sneakerGallery360Images.id })
    .from(sneakerGallery360Images)
    .where(
      inArray(
        sneakerGallery360Images.fetchStatus,
        options.reprocess ? ['pending', 'failed', 'ready'] : ['pending', 'failed'],
      ),
    );
  log(`Found ${galleryImageRows.length} gallery images to process`);

  await Promise.all(
    galleryImageRows.map(async (row) => {
      try {
        await fetchAndStoreSneakerGallery360Image(row.id, { force: options.reprocess });
        const image = await getSneakerGallery360ImageById(row.id);

        if (image?.fetchStatus === 'ready') {
          imagesReady += 1;
          log(`Stored gallery image ${row.id}`);
        } else {
          failures.push({
            imageId: row.id,
            error: image?.fetchError ?? 'Gallery image fetch did not complete',
          });
          log(`Failed to store gallery image ${row.id}: ${failures.at(-1)?.error}`);
        }
      } catch (error) {
        failures.push({
          imageId: row.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        log(`Failed to store gallery image ${row.id}: ${failures.at(-1)?.error}`);
      }
    }),
  );

  return {
    imagesProcessed: primaryImageRows.length + galleryImageRows.length,
    imagesReady,
    failures,
  };
}
