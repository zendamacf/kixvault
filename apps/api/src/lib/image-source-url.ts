const ALLOWED_IMAGE_HOSTS = new Set(['images.stockx.com', 'image.goat.com']);

export function isAllowedImageSourceUrl(sourceUrl: string): boolean {
  try {
    const parsed = new URL(sourceUrl);
    return ALLOWED_IMAGE_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}
