import type { SneakerCondition, VariantPrice } from '@kixvault/shared';

export function normalizeSizeValue(size: number | string): string {
  const numericSize = typeof size === 'number' ? size : Number(size);

  if (!Number.isFinite(numericSize)) {
    return String(size).trim();
  }

  if (Number.isInteger(numericSize)) {
    return String(numericSize);
  }

  return numericSize.toFixed(1);
}

export function matchVariantPrice(
  size: number | undefined,
  variantPrices: VariantPrice[],
): VariantPrice | null {
  if (size == null || Number.isNaN(size)) {
    return null;
  }

  const normalizedSize = normalizeSizeValue(size);

  return (
    variantPrices.find((variant) => normalizeSizeValue(variant.size) === normalizedSize) ?? null
  );
}

export function isMarketValueApplicable(condition: SneakerCondition | string): boolean {
  return condition === 'deadstock' || condition === 'lightly_worn';
}

export function getMarketValueDisclaimer(condition: SneakerCondition | string): string | null {
  if (condition === 'lightly_worn') {
    return 'Market value reflects deadstock pricing.';
  }

  return null;
}
