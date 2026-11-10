import { useEffect } from 'react';
import {
  SNEAKER_PAIR_BACK_PATH,
  SNEAKER_PAIR_FAVICON_TRANSFORM,
  SNEAKER_PAIR_FRONT_PATH,
} from '@/components/layout/sneaker-pair-art';

/** The favicon artwork in a given fill colour. Same drawing as public/favicon.svg. */
export function buildFaviconSvg(color: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><g transform="${SNEAKER_PAIR_FAVICON_TRANSFORM}" fill="${color}"><path d="${SNEAKER_PAIR_BACK_PATH}"/><path d="${SNEAKER_PAIR_FRONT_PATH}"/></g></svg>`;
}

function syncFavicon() {
  const link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
  // `--brand` is the accent meant for dark surfaces, so it stays visible on dark tab bars.
  const color = getComputedStyle(document.documentElement).getPropertyValue('--brand').trim();
  if (!link || !color) return;

  link.type = 'image/svg+xml';
  link.href = `data:image/svg+xml,${encodeURIComponent(buildFaviconSvg(color))}`;
}

/**
 * Keeps the browser tab icon in the active colorway's brand colour. Favicons cannot read the
 * page's CSS, so this watches the `data-theme` attribute that next-themes sets and rewrites the
 * icon link. public/favicon.svg (default orange) stays as the fallback until this runs.
 */
export function ThemeFavicon() {
  useEffect(() => {
    syncFavicon();

    const observer = new MutationObserver(syncFavicon);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
