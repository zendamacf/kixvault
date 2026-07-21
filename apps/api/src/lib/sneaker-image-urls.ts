import { env } from './env';

type SneakerImageUrlInput = {
  sneakerId: string;
  sortOrder: number;
  storagePath: string | null;
  sourceUrl: string;
};

/** Build the public URL clients should use for a sneaker image. */
export function buildSneakerImagePublicUrl(row: SneakerImageUrlInput): string {
  if (row.storagePath) {
    return `${env.imagePublicBasePath}/${row.sneakerId}/${row.sortOrder}`;
  }

  return row.sourceUrl;
}
