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
  'yeezy',
  'new-balance',
  'asics',
  'puma',
  'converse',
  'vans',
  'reebok',
  'saucony',
  'hoka',
  'salomon',
  'on-running',
  'under-armour',
  'brooks',
  'fila',
] as const;

export type SneakerBrandColor = (typeof sneakerBrandColorKeys)[number];

const sneakerBrandBadgeClasses: Record<SneakerBrandColor, string> = {
  nike: 'border-nike/30 bg-nike/10 text-nike',
  jordan: 'border-jordan/30 bg-jordan/10 text-jordan',
  adidas: 'border-adidas/30 bg-adidas/10 text-adidas',
  yeezy: 'border-yeezy/30 bg-yeezy/10 text-yeezy',
  'new-balance': 'border-new-balance/30 bg-new-balance/10 text-new-balance',
  asics: 'border-asics/30 bg-asics/10 text-asics',
  puma: 'border-puma/30 bg-puma/10 text-puma',
  converse: 'border-converse/30 bg-converse/10 text-converse',
  vans: 'border-vans/30 bg-vans/10 text-vans',
  reebok: 'border-reebok/30 bg-reebok/10 text-reebok',
  saucony: 'border-saucony/30 bg-saucony/10 text-saucony',
  hoka: 'border-hoka/30 bg-hoka/10 text-hoka',
  salomon: 'border-salomon/30 bg-salomon/10 text-salomon',
  'on-running': 'border-on-running/30 bg-on-running/10 text-on-running',
  'under-armour': 'border-under-armour/30 bg-under-armour/10 text-under-armour',
  brooks: 'border-brooks/30 bg-brooks/10 text-brooks',
  fila: 'border-fila/30 bg-fila/10 text-fila',
};

const sneakerBrandMatchers: Array<{ key: SneakerBrandColor; matches: (brand: string) => boolean }> =
  [
    { key: 'jordan', matches: (brand) => brand.includes('jordan') },
    { key: 'new-balance', matches: (brand) => brand.includes('new balance') || brand === 'nb' },
    { key: 'under-armour', matches: (brand) => brand.includes('under armour') || brand.includes('under armor') },
    { key: 'on-running', matches: (brand) => brand === 'on' || brand.includes('on running') },
    { key: 'yeezy', matches: (brand) => brand.includes('yeezy') },
    { key: 'adidas', matches: (brand) => brand.includes('adidas') },
    { key: 'nike', matches: (brand) => brand.includes('nike') },
    { key: 'asics', matches: (brand) => brand.includes('asics') },
    { key: 'puma', matches: (brand) => brand.includes('puma') },
    { key: 'converse', matches: (brand) => brand.includes('converse') },
    { key: 'vans', matches: (brand) => brand.includes('vans') },
    { key: 'reebok', matches: (brand) => brand.includes('reebok') },
    { key: 'saucony', matches: (brand) => brand.includes('saucony') },
    { key: 'hoka', matches: (brand) => brand.includes('hoka') },
    { key: 'salomon', matches: (brand) => brand.includes('salomon') },
    { key: 'brooks', matches: (brand) => brand.includes('brooks') },
    { key: 'fila', matches: (brand) => brand.includes('fila') },
  ];

export function getSneakerBrandColor(brand: string): SneakerBrandColor | null {
  const normalized = brand.trim().toLowerCase();

  return sneakerBrandMatchers.find(({ matches }) => matches(normalized))?.key ?? null;
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
