export type SneakerGrailMatchInput = {
  brand: string;
  model: string;
  colorway: string | null;
  sku: string | null;
  catalogSource: string | null;
  catalogId: string | null;
};

export function wishlistItemMatchesNewSneaker(
  item: SneakerGrailMatchInput,
  sneaker: SneakerGrailMatchInput,
): boolean {
  if (
    sneaker.catalogSource &&
    sneaker.catalogId &&
    item.catalogSource &&
    item.catalogId &&
    item.catalogSource === sneaker.catalogSource &&
    item.catalogId === sneaker.catalogId
  ) {
    return true;
  }

  if (sneaker.sku && item.sku && item.sku === sneaker.sku) {
    return true;
  }

  if (item.brand !== sneaker.brand || item.model !== sneaker.model) {
    return false;
  }

  return (item.colorway ?? null) === (sneaker.colorway ?? null);
}
