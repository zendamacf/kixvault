const ALLOWED_IMAGE_HOSTS = new Set(['images.stockx.com']);

const STOCKX_BACKGROUND_PARAMS = ['bg', 'bg-color', 'background'] as const;
const STOCKX_OPAQUE_FIT_MODES = new Set(['fill', 'pad']);

export function isAllowedImageSourceUrl(sourceUrl: string): boolean {
  try {
    const parsed = new URL(sourceUrl);
    return ALLOWED_IMAGE_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

/** Normalize StockX CDN URLs so downloaded images keep a transparent background. */
export function normalizeImageSourceUrl(sourceUrl: string): string {
  let url: URL;

  try {
    url = new URL(sourceUrl);
  } catch {
    return sourceUrl;
  }

  if (url.hostname !== 'images.stockx.com') {
    return sourceUrl;
  }

  for (const param of STOCKX_BACKGROUND_PARAMS) {
    url.searchParams.delete(param);
  }

  const fit = url.searchParams.get('fit');

  if (fit && STOCKX_OPAQUE_FIT_MODES.has(fit)) {
    url.searchParams.delete('fit');
  }

  // StockX uses imgix; many catalog URLs omit bg/fit but still return opaque JPEGs/WebPs.
  // bg-remove requests imgix background removal (cached after first request).
  url.searchParams.set('bg-remove', 'true');

  return url.toString();
}
