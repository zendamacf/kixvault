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

  if (result.failures.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
