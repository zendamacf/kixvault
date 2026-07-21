import { sneakerImages } from '@kixvault/db';
import { inArray } from 'drizzle-orm';
import { db } from './db';
import { fetchAndStoreSneakerImage, getSneakerImageById } from './image-fetch';

export type BackfillImageStorageOptions = {
  delayMs?: number;
  onProgress?: (message: string) => void;
};

export type BackfillImageStorageResult = {
  imagesProcessed: number;
  imagesReady: number;
  failures: Array<{ imageId: string; error: string }>;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Download and convert pending or failed sneaker images to local WebP storage. */
export async function backfillImageStorage(
  options: BackfillImageStorageOptions = {},
): Promise<BackfillImageStorageResult> {
  const delayMs = options.delayMs ?? 500;
  const log = options.onProgress ?? (() => {});

  const rows = await db
    .select({ id: sneakerImages.id })
    .from(sneakerImages)
    .where(inArray(sneakerImages.fetchStatus, ['pending', 'failed']));

  const failures: BackfillImageStorageResult['failures'] = [];
  let imagesReady = 0;

  for (const row of rows) {
    try {
      await fetchAndStoreSneakerImage(row.id);
      const image = await getSneakerImageById(row.id);

      if (image?.fetchStatus === 'ready') {
        imagesReady += 1;
        log(`Stored image ${row.id}`);
      } else {
        failures.push({
          imageId: row.id,
          error: image?.fetchError ?? 'Image fetch did not complete',
        });
        log(`Failed to store image ${row.id}: ${failures.at(-1)?.error}`);
      }
    } catch (error) {
      failures.push({
        imageId: row.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      log(`Failed to store image ${row.id}: ${failures.at(-1)?.error}`);
    }

    if (delayMs > 0) {
      await sleep(delayMs);
    }
  }

  return {
    imagesProcessed: rows.length,
    imagesReady,
    failures,
  };
}
