import { fetchAndStoreSneakerImage, type SneakerImageKind } from './image-fetch';

const MAX_CONCURRENCY = 3;
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1_000;

type QueuedImageFetch = {
  id: string;
  kind: SneakerImageKind;
};

const queue: QueuedImageFetch[] = [];
const queuedKeys = new Set<string>();
const inFlightKeys = new Set<string>();
let activeWorkers = 0;

function getQueueKey(image: QueuedImageFetch): string {
  return `${image.kind}:${image.id}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function runWithRetries(image: QueuedImageFetch): Promise<void> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      await fetchAndStoreSneakerImage(image.id, { kind: image.kind });
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
    const image = queue.shift();

    if (!image) {
      return;
    }

    const queueKey = getQueueKey(image);
    queuedKeys.delete(queueKey);
    inFlightKeys.add(queueKey);
    activeWorkers += 1;

    void runWithRetries(image).finally(() => {
      inFlightKeys.delete(queueKey);
      activeWorkers -= 1;
      pumpQueue();
    });
  }
}

/** Queue sneaker images for asynchronous download and conversion. */
export function enqueueImageFetches(
  imageIds: string[],
  options: { kind?: SneakerImageKind } = {},
): void {
  const kind = options.kind ?? 'primary';

  for (const imageId of imageIds) {
    const queuedImage = { id: imageId, kind };
    const queueKey = getQueueKey(queuedImage);

    if (queuedKeys.has(queueKey) || inFlightKeys.has(queueKey)) {
      continue;
    }

    queuedKeys.add(queueKey);
    queue.push(queuedImage);
  }

  pumpQueue();
}

/** @internal Test helper */
export function resetImageFetchQueueForTests(): void {
  queue.length = 0;
  queuedKeys.clear();
  inFlightKeys.clear();
  activeWorkers = 0;
}
