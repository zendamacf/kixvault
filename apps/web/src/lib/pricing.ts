import type { SneakerCondition, VariantPrice } from '@kixvault/shared';
import { i18n } from '@/i18n';

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

export function getMarketValueDisclaimer(condition: SneakerCondition | string): string | null {
  if (condition !== 'deadstock') {
    return i18n.t('pricing.deadstockDisclaimer');
  }

  return null;
}

/** Returns price snapshots sorted oldest-first for charting (the API returns newest-first). */
export function sortSnapshotsAscending<T extends { snapshotDate: string }>(history: T[]): T[] {
  return [...history].sort((a, b) => a.snapshotDate.localeCompare(b.snapshotDate));
}
