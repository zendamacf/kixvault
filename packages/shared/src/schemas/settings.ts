import { z } from 'zod';
import { currencyCodeSchema } from '../currencies';

export const updateSettingsSchema = z.object({
  currency: currencyCodeSchema,
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;

export const exchangeRatesResponseSchema = z.object({
  base: z.literal('USD'),
  /** Units of each currency per 1 USD. Always includes USD: 1. */
  rates: z.record(z.string(), z.number().positive()),
  updatedAt: z.string().nullable(),
});

export type ExchangeRatesResponse = z.infer<typeof exchangeRatesResponseSchema>;
