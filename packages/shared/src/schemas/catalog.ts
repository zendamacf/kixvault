import { z } from "zod";

export const catalogSearchQuerySchema = z.object({
  q: z.string().trim().min(2).max(100),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

export const catalogSearchResultSchema = z.object({
  catalogSource: z.literal("kicksdb:stockx"),
  catalogId: z.string(),
  title: z.string(),
  brand: z.string(),
  model: z.string(),
  colorway: z.string().nullable(),
  sku: z.string(),
  imageUrl: z.string().url().nullable(),
});

export type CatalogSearchQuery = z.infer<typeof catalogSearchQuerySchema>;
export type CatalogSearchResult = z.infer<typeof catalogSearchResultSchema>;
