import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | null | undefined) {
  if (value == null) {
    return '—';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCondition(condition: string) {
  return condition
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) {
    return '—';
  }

  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getCatalogSourceLabel(catalogSource: string | null | undefined) {
  if (catalogSource === 'kicksdb:stockx') {
    return 'StockX';
  }

  if (catalogSource === 'kicksdb:goat') {
    return 'GOAT';
  }

  return null;
}

export const sneakerBrandColorKeys = [
  'nike',
  'jordan',
  'adidas',
  'new-balance',
  'asics',
  'puma',
] as const;

export type SneakerBrandColor = (typeof sneakerBrandColorKeys)[number];

const sneakerBrandBadgeClasses: Record<SneakerBrandColor, string> = {
  nike: 'border-nike/30 bg-nike/10 text-nike',
  jordan: 'border-jordan/30 bg-jordan/10 text-jordan',
  adidas: 'border-adidas/30 bg-adidas/10 text-adidas',
  'new-balance': 'border-new-balance/30 bg-new-balance/10 text-new-balance',
  asics: 'border-asics/30 bg-asics/10 text-asics',
  puma: 'border-puma/30 bg-puma/10 text-puma',
};

export function getSneakerBrandColor(brand: string): SneakerBrandColor | null {
  const normalized = brand.trim().toLowerCase();

  if (normalized.includes('jordan')) {
    return 'jordan';
  }

  if (normalized.includes('new balance') || normalized === 'nb') {
    return 'new-balance';
  }

  if (normalized.includes('nike')) {
    return 'nike';
  }

  if (normalized.includes('adidas')) {
    return 'adidas';
  }

  if (normalized.includes('asics')) {
    return 'asics';
  }

  if (normalized.includes('puma')) {
    return 'puma';
  }

  return null;
}

export function getSneakerBrandStyles(brand: string) {
  const brandColor = getSneakerBrandColor(brand);

  if (!brandColor) {
    return {
      brandColor: null,
      badgeClassName: '',
    };
  }

  return {
    brandColor,
    badgeClassName: sneakerBrandBadgeClasses[brandColor],
  };
}
