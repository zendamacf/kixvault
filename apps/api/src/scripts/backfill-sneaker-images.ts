import { backfillSneakerImages } from '../lib/backfill-sneaker-images';
import { ensureKicksdbClient, isKicksdbConfigured } from '../lib/kicksdb';
import { logger } from '../lib/logger';

async function main() {
  if (!isKicksdbConfigured()) {
    logger.error('KICKSDB_API_KEY is required to backfill sneaker images.');
    process.exit(1);
  }

  ensureKicksdbClient();

  const result = await backfillSneakerImages({
    onProgress: (message) => {
      logger.log(message);
    },
  });

  logger.log(
    `Backfill complete: ${result.sneakersUpdated}/${result.sneakersProcessed} sneakers updated, ${result.catalogProductsFetched} catalog products fetched, ${result.failures.length} failures.`,
  );
}

main()
  .catch((error) => {
    logger.error(error);
    process.exit(1);
  })
  .then(() => {
    process.exit(0);
  });
