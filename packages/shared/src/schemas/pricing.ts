import { z } from 'zod';
import { catalogMarketplaces, catalogSearchResultSchema } from './catalog';

export const variantPriceSchema = z.object({
  size: z.string(),
  sizeType: z.string().nullable(),
  price: z.number(),
  variantId: z.string().nullable(),
});

export const catalogProductParamsSchema = z.object({
  marketplace: z.enum(catalogMarketplaces),
  catalogId: z.string().trim().min(1).max(200),
});

export const catalogProductDetailSchema = z.object({
  product: catalogSearchResultSchema,
  variantPrices: z.array(variantPriceSchema),
});

export type VariantPrice = z.infer<typeof variantPriceSchema>;
export type CatalogProductParams = z.infer<typeof catalogProductParamsSchema>;
export type CatalogProductDetail = z.infer<typeof catalogProductDetailSchema>;

export type SneakerPricingFields = {
  currentMarketPrice: number | null;
  pricedAt: string | null;
  gainLoss: number | null;
};

export const priceSnapshotEntrySchema = z.object({
  snapshotDate: z.string(),
  price: z.number(),
  currency: z.string(),
});

export const sneakerPriceHistorySchema = z.object({
  history: z.array(priceSnapshotEntrySchema),
});

export const collectionStatsSchema = z.object({
  count: z.number(),
  totalSpend: z.number(),
  avgSpend: z.number(),
  totalMarketValue: z.number().nullable(),
  totalGainLoss: z.number().nullable(),
});

export type PriceSnapshotEntry = z.infer<typeof priceSnapshotEntrySchema>;
export type SneakerPriceHistory = z.infer<typeof sneakerPriceHistorySchema>;
export type CollectionStats = z.infer<typeof collectionStatsSchema>;
