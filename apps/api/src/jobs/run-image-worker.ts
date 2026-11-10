import { backfillImageStorage } from '../lib/backfill-image-storage';
import { logger } from '../lib/logger';

const POLL_INTERVAL_MS = Number(process.env.IMAGE_WORKER_POLL_MS) || 30_000;

logger.log(`Image worker started (poll interval: ${POLL_INTERVAL_MS}ms)`);

async function runCycle(): Promise<void> {
  const result = await backfillImageStorage();
  logger.log(JSON.stringify(result));
}

await runCycle();

setInterval(() => {
  void runCycle().catch((error) => {
    logger.error('Image worker cycle failed:', error);
  });
}, POLL_INTERVAL_MS);

process.stdin.resume();
