import { backfillImageStorage } from '../lib/backfill-image-storage';
import { logger } from '../lib/logger';

async function main() {
  const reprocess = process.argv.includes('--reprocess');

  const result = await backfillImageStorage({
    reprocess,
    onProgress: (message) => {
      logger.log(message);
    },
  });

  logger.log(
    `Image storage backfill complete: ${result.imagesReady}/${result.imagesProcessed} images stored, ${result.failures.length} failures.`,
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
