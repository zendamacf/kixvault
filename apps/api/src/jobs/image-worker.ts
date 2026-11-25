import { backfillImageStorage } from '../lib/backfill-image-storage';
import { env } from '../lib/env';
import { logger } from '../lib/logger';

/** Polls for pending sneaker images and stores them. Returns a function that stops polling. */
export function startImageWorker(): () => void {
  logger.log(`Image worker started (poll interval: ${env.imageWorkerPollMs}ms)`);

  // Skip a tick while the previous cycle is still running, so images are not fetched twice.
  let running = false;
  const runCycle = async () => {
    if (running) return;
    running = true;
    try {
      const result = await backfillImageStorage();
      logger.log(JSON.stringify(result));
    } catch (error) {
      logger.error('Image worker cycle failed:', error);
    } finally {
      running = false;
    }
  };

  void runCycle();
  const timer = setInterval(() => void runCycle(), env.imageWorkerPollMs);

  return () => clearInterval(timer);
}
