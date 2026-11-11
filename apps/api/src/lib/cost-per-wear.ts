/**
 * Purchase price divided by wear count, rounded to cents. Null when the price is unknown
 * or the pair was never worn.
 */
export function computeCostPerWear(
  purchasePrice: string | number | null | undefined,
  wearCount: number,
): number | null {
  if (purchasePrice == null || wearCount < 1) {
    return null;
  }

  return Math.round((Number(purchasePrice) / wearCount) * 100) / 100;
}
