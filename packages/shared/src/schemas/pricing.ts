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
