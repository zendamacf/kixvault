import { env } from './env';

type SneakerImageUrlInput = {
  sneakerId: string;
  storagePath: string | null;
  sourceUrl: string;
};

/** Build the public URL clients should use for a sneaker's primary image. */
export function buildSneakerImagePublicUrl(row: SneakerImageUrlInput): string {
  if (row.storagePath) {
    return `${env.imagePublicBasePath}/${row.sneakerId}`;
  }

  return row.sourceUrl;
}

type SneakerGallery360ImageUrlInput = SneakerImageUrlInput & {
  sortOrder: number;
};

/** Build the public URL clients should use for a 360 gallery frame. */
export function buildSneakerGallery360ImagePublicUrl(row: SneakerGallery360ImageUrlInput): string {
  if (row.storagePath) {
    return `${env.imagePublicBasePath}/${row.sneakerId}/360/${row.sortOrder}`;
  }

  return row.sourceUrl;
}
