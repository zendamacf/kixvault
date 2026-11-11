import { z } from 'zod';
import { sneakerConditions } from '../types';

export const portfolioValuePointSchema = z.object({
  date: z.string(),
  value: z.number(),
  /** Number of pairs with a known market price on this date. */
  pairs: z.number(),
});

export const wearsByMonthPointSchema = z.object({
  /** Month as `YYYY-MM`. */
  month: z.string(),
  count: z.number(),
});

export const mostWornEntrySchema = z.object({
  sneakerId: z.string(),
  name: z.string(),
  count: z.number(),
});

export const brandBreakdownEntrySchema = z.object({
  label: z.string(),
  count: z.number(),
});

export const conditionBreakdownEntrySchema = z.object({
  condition: z.enum(sneakerConditions),
  count: z.number(),
});

export const realizedSaleSchema = z.object({
  sneakerId: z.string(),
  name: z.string(),
  departedOn: z.string(),
  salePrice: z.number(),
  purchasePrice: z.number().nullable(),
  /** Sale price minus purchase price. Null when the purchase price is unknown. */
  gainLoss: z.number().nullable(),
});

export const realizedSchema = z.object({
  /** Sum of gain or loss over sold pairs with a known purchase price. Null when there are none. */
  totalGainLoss: z.number().nullable(),
  soldCount: z.number(),
  /** Sold pairs, most recent sale first. */
  sales: z.array(realizedSaleSchema),
});

export const analyticsSchema = z.object({
  portfolioValue: z.array(portfolioValuePointSchema),
  /** Pairs that can appear in the portfolio chart (catalog-linked). */
  trackedPairs: z.number(),
  totalPairs: z.number(),
  wearsByMonth: z.array(wearsByMonthPointSchema),
  mostWorn: z.array(mostWornEntrySchema),
  brands: z.array(brandBreakdownEntrySchema),
  conditions: z.array(conditionBreakdownEntrySchema),
  realized: realizedSchema,
});

export type PortfolioValuePoint = z.infer<typeof portfolioValuePointSchema>;
export type WearsByMonthPoint = z.infer<typeof wearsByMonthPointSchema>;
export type MostWornEntry = z.infer<typeof mostWornEntrySchema>;
export type BrandBreakdownEntry = z.infer<typeof brandBreakdownEntrySchema>;
export type ConditionBreakdownEntry = z.infer<typeof conditionBreakdownEntrySchema>;
export type RealizedSale = z.infer<typeof realizedSaleSchema>;
export type RealizedSummary = z.infer<typeof realizedSchema>;
export type Analytics = z.infer<typeof analyticsSchema>;
