import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';

export const defaultLocale = 'en';
export const supportedLocales = [defaultLocale] as const;

export type SupportedLocale = (typeof supportedLocales)[number];

const resources = {
  en: {
    translation: en,
  },
};

void i18n.use(initReactI18next).init({
  resources,
  lng: defaultLocale,
  fallbackLng: defaultLocale,
  supportedLngs: supportedLocales,
  interpolation: {
    escapeValue: false,
  },
});

export function getActiveLocale(): string {
  return i18n.resolvedLanguage ?? defaultLocale;
}

export { i18n };
