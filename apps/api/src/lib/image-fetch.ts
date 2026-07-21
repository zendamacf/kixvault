import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { sneakerImages } from '@kixvault/db';
import { eq } from 'drizzle-orm';
import sharp from 'sharp';
import { db } from './db';
import { env } from './env';
import { isAllowedImageSourceUrl } from './image-source-url';
import {
  buildSneakerImageStoragePath,
  getSneakerImageAbsolutePath,
  type SneakerImageRow,
} from './sneaker-images';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 30_000;

export async function getSneakerImageById(imageId: string): Promise<SneakerImageRow | null> {
  const [row] = await db.select().from(sneakerImages).where(eq(sneakerImages.id, imageId)).limit(1);
  return row ?? null;
}

async function markImageFetchFailed(imageId: string, error: unknown): Promise<void> {
  const message = error instanceof Error ? error.message : 'Unknown error';

  await db
    .update(sneakerImages)
    .set({
      fetchStatus: 'failed',
      fetchError: message,
    })
    .where(eq(sneakerImages.id, imageId));
}

async function downloadImage(sourceUrl: string): Promise<Buffer> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(sourceUrl, {
      signal: controller.signal,
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`Image download failed with status ${response.status}`);
    }

    const finalUrl = response.url;

    if (!isAllowedImageSourceUrl(finalUrl)) {
      throw new Error(`Redirected image host is not allowed: ${finalUrl}`);
    }

    const contentLength = Number(response.headers.get('content-length') ?? 0);

    if (contentLength > MAX_IMAGE_BYTES) {
      throw new Error(`Image exceeds maximum size of ${MAX_IMAGE_BYTES} bytes`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    if (buffer.byteLength > MAX_IMAGE_BYTES) {
      throw new Error(`Image exceeds maximum size of ${MAX_IMAGE_BYTES} bytes`);
    }

    return buffer;
  } finally {
    clearTimeout(timeout);
  }
}

export async function convertImageToWebp(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize({ width: env.maxImageWidth, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
}

/** Download, convert, and persist a sneaker image outside the request path. */
export async function fetchAndStoreSneakerImage(imageId: string): Promise<void> {
  const image = await getSneakerImageById(imageId);

  if (!image || image.fetchStatus === 'ready') {
    return;
  }

  if (!isAllowedImageSourceUrl(image.sourceUrl)) {
    await markImageFetchFailed(imageId, new Error('Image source URL is not allowed'));
    return;
  }

  try {
    const downloaded = await downloadImage(image.sourceUrl);
    const converted = await convertImageToWebp(downloaded);
    const storagePath = buildSneakerImageStoragePath(image.sneakerId, image.sortOrder);
    const absolutePath = getSneakerImageAbsolutePath(storagePath);

    await mkdir(dirname(absolutePath), { recursive: true });
    await Bun.write(absolutePath, converted);

    await db
      .update(sneakerImages)
      .set({
        storagePath,
        fetchStatus: 'ready',
        fetchError: null,
        fetchedAt: new Date(),
      })
      .where(eq(sneakerImages.id, imageId));
  } catch (error) {
    await markImageFetchFailed(imageId, error);
    throw error;
  }
}
