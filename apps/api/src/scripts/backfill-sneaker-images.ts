import { backfillSneakerImages } from '../lib/backfill-sneaker-images';
import { ensureKicksdbClient, isKicksdbConfigured } from '../lib/kicksdb';

async function main() {
  if (!isKicksdbConfigured()) {
    console.error('KICKSDB_API_KEY is required to backfill sneaker images.');
    process.exit(1);
  }

  ensureKicksdbClient();

  const result = await backfillSneakerImages({
    onProgress: (message) => {
      console.log(message);
    },
  });

  console.log(
    `Backfill complete: ${result.sneakersUpdated}/${result.sneakersProcessed} sneakers updated, ${result.catalogProductsFetched} catalog products fetched, ${result.failures.length} failures.`,
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
