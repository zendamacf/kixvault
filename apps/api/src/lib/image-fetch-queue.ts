import { fetchAndStoreSneakerImage } from './image-fetch';

const MAX_CONCURRENCY = 3;
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1_000;

const queue: string[] = [];
const queuedIds = new Set<string>();
const inFlightIds = new Set<string>();
let activeWorkers = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function runWithRetries(imageId: string): Promise<void> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      await fetchAndStoreSneakerImage(imageId);
      return;
    } catch {
      if (attempt === MAX_RETRIES) {
        return;
      }

      await sleep(BASE_RETRY_DELAY_MS * 2 ** (attempt - 1));
    }
  }
}

function pumpQueue(): void {
  while (activeWorkers < MAX_CONCURRENCY && queue.length > 0) {
    const imageId = queue.shift();

    if (!imageId) {
      return;
    }

    queuedIds.delete(imageId);
    inFlightIds.add(imageId);
    activeWorkers += 1;

    void runWithRetries(imageId).finally(() => {
      inFlightIds.delete(imageId);
      activeWorkers -= 1;
      pumpQueue();
    });
  }
}

/** Queue sneaker images for asynchronous download and conversion. */
export function enqueueImageFetches(imageIds: string[]): void {
  for (const imageId of imageIds) {
    if (queuedIds.has(imageId) || inFlightIds.has(imageId)) {
      continue;
    }

    queuedIds.add(imageId);
    queue.push(imageId);
  }

  pumpQueue();
}

/** @internal Test helper */
export function resetImageFetchQueueForTests(): void {
  queue.length = 0;
  queuedIds.clear();
  inFlightIds.clear();
  activeWorkers = 0;
}
