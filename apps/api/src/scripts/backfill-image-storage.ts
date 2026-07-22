import { backfillImageStorage } from '../lib/backfill-image-storage';

async function main() {
  const reprocess = process.argv.includes('--reprocess');

  const result = await backfillImageStorage({
    reprocess,
    onProgress: (message) => {
      console.log(message);
    },
  });

  console.log(
    `Image storage backfill complete: ${result.imagesReady}/${result.imagesProcessed} images stored, ${result.failures.length} failures.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .then(() => {
    process.exit(0);
  });
