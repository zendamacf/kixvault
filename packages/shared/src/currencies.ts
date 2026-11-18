import { z } from 'zod';

/** Currencies a user can pick as their display currency. Amounts are always stored in USD. */
export const SUPPORTED_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'CAD',
  'AUD',
  'NZD',
  'JPY',
  'CNY',
  'HKD',
  'SGD',
  'KRW',
  'INR',
  'CHF',
  'SEK',
  'NOK',
  'DKK',
  'PLN',
  'CZK',
  'MXN',
  'BRL',
  'ZAR',
  'AED',
  'SAR',
  'TRY',
  'THB',
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export const BASE_CURRENCY: CurrencyCode = 'USD';

export const currencyCodeSchema = z.enum(SUPPORTED_CURRENCIES);
