import type { SneakerCondition } from '@kixvault/shared';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getActiveLocale } from '@/i18n';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | null | undefined) {
  if (value == null) {
    return '—';
  }

  return new Intl.NumberFormat(getActiveLocale(), {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatGainLoss(value: number | null | undefined) {
  if (value == null) {
    return '—';
  }

  const formatted = formatCurrency(Math.abs(value));

  if (value > 0) {
    return `+${formatted}`;
  }

  if (value < 0) {
    return `-${formatted}`;
  }

  return formatted;
}

export function formatCondition(condition: SneakerCondition) {
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
  return date.toLocaleDateString(getActiveLocale(), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getCatalogSourceLabel(catalogSource: string | null | undefined) {
  if (catalogSource === 'kicksdb:stockx') {
    return 'StockX';
  }

  return null;
}
