import { getSneakerImageAbsolutePath } from './sneaker-image-paths';

type StoredSneakerImage = {
  sourceUrl: string;
  storagePath: string | null;
};

export async function createSneakerImageResponse(
  image: StoredSneakerImage | null,
): Promise<Response> {
  if (!image) {
    return Response.json({ error: 'Image not found' }, { status: 404 });
  }

  if (image.storagePath) {
    const filePath = getSneakerImageAbsolutePath(image.storagePath);
    const file = Bun.file(filePath);

    if (await file.exists()) {
      return new Response(file, {
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }
  }

  return Response.redirect(image.sourceUrl, 302);
}
