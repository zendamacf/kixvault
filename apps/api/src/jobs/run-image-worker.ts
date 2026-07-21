import { backfillImageStorage } from '../lib/backfill-image-storage';

const POLL_INTERVAL_MS = Number(process.env.IMAGE_WORKER_POLL_MS) || 30_000;

console.log(`Image worker started (poll interval: ${POLL_INTERVAL_MS}ms)`);

async function runCycle(): Promise<void> {
  const result = await backfillImageStorage();
  console.log(JSON.stringify(result));
}

await runCycle();

setInterval(() => {
  void runCycle().catch((error) => {
    console.error('Image worker cycle failed:', error);
  });
}, POLL_INTERVAL_MS);

process.stdin.resume();
