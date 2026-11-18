import type { SneakerCondition } from '@kixvault/shared';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getActiveLocale, i18n } from '@/i18n';
import { currencyFractionDigits, getActiveCurrency, usdToDisplay } from './currency';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Amounts are USD; they are shown in the user's currency. Cents, for per-wear figures. */
export function formatCurrencyPrecise(value: number | null | undefined) {
  if (value == null) {
    return i18n.t('common.emptyValue');
  }

  return new Intl.NumberFormat(getActiveLocale(), {
    style: 'currency',
    currency: getActiveCurrency().code,
    minimumFractionDigits: currencyFractionDigits(),
    maximumFractionDigits: currencyFractionDigits(),
  }).format(usdToDisplay(value));
}

export function formatCurrency(value: number | null | undefined) {
  if (value == null) {
    return i18n.t('common.emptyValue');
  }

  return new Intl.NumberFormat(getActiveLocale(), {
    style: 'currency',
    currency: getActiveCurrency().code,
    maximumFractionDigits: 0,
  }).format(usdToDisplay(value));
}

export function formatGainLoss(value: number | null | undefined) {
  if (value == null) {
    return i18n.t('common.emptyValue');
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
  return i18n.t(`condition.${condition}`);
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) {
    return i18n.t('common.emptyValue');
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
