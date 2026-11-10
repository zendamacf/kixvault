import i18next, { type TFunction } from 'i18next';
import en from './locales/en.json';

export const defaultEmailLocale = 'en';
export const supportedEmailLocales = [defaultEmailLocale] as const;

export type EmailLocale = (typeof supportedEmailLocales)[number];

/** Email copy lives in `locales/<locale>.json`. To add a language, add a file and register it here. */
const resources = { en: { translation: en } };

// A separate instance, so email copy can never leak into (or be changed by) other i18n use.
const instance = i18next.createInstance();

instance.init({
  resources,
  lng: defaultEmailLocale,
  fallbackLng: defaultEmailLocale,
  supportedLngs: supportedEmailLocales,
  initAsync: false,
  interpolation: {
    // Templates escape HTML themselves, so values are stored raw.
    escapeValue: false,
  },
});

/** Resolves a requested locale to a supported one, falling back to the default. */
export function resolveEmailLocale(locale: string | null | undefined): EmailLocale {
  const match = supportedEmailLocales.find(
    (supported) => supported === locale?.toLowerCase().split('-')[0],
  );

  return match ?? defaultEmailLocale;
}

/** Translation function fixed to one locale. */
export function getEmailT(locale?: string | null): TFunction {
  return instance.getFixedT(resolveEmailLocale(locale));
}

/**
 * Picks the best supported locale from an `Accept-Language` header, honoring q-values and
 * matching on the primary language subtag (`fr-CA` matches `fr`). Falls back to the default.
 */
export function negotiateLocale(header: string | null | undefined): EmailLocale {
  const candidates = (header ?? '')
    .split(',')
    .map((part, index) => {
      const [tag = '', ...params] = part.trim().split(';');
      const q = params.map((param) => param.trim()).find((param) => param.startsWith('q='));
      const quality = q ? Number(q.slice(2)) : 1;

      return { tag: tag.trim().toLowerCase().split('-')[0] ?? '', quality, index };
    })
    .filter((candidate) => candidate.tag && candidate.quality > 0)
    // Higher quality first; header order breaks ties.
    .sort((a, b) => b.quality - a.quality || a.index - b.index);

  for (const { tag } of candidates) {
    const match = supportedEmailLocales.find((supported) => supported === tag);

    if (match) {
      return match;
    }
  }

  return defaultEmailLocale;
}
