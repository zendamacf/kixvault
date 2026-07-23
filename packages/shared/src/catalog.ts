import type { CatalogSource } from './schemas/catalog';

export function buildCatalogUrl(
  catalogSource: CatalogSource,
  catalogId: string,
  link?: string | null,
): string | null {
  if (link) {
    return link;
  }

  if (!catalogId) {
    return null;
  }

  if (catalogSource === 'kicksdb:stockx') {
    return `https://stockx.com/${catalogId}`;
  }

  return null;
}
