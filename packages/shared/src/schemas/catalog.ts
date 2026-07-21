import { z } from 'zod';

export const catalogMarketplaces = ['stockx', 'goat'] as const;
export const catalogSources = ['kicksdb:stockx', 'kicksdb:goat'] as const;

export const catalogSearchQuerySchema = z.object({
  q: z.string().trim().min(3).max(100),
  limit: z.coerce.number().int().min(1).max(20).default(10),
  marketplace: z.enum(catalogMarketplaces).default('stockx'),
});

export const catalogSearchResultSchema = z.object({
  catalogSource: z.enum(catalogSources),
  catalogId: z.string(),
  title: z.string(),
  brand: z.string(),
  model: z.string(),
  colorway: z.string().nullable(),
  nickname: z.string().nullable(),
  sku: z.string(),
  imageUrl: z.string().url().nullable(),
  imageUrls: z.array(z.string().url()),
  releaseDate: z.string().nullable(),
  description: z.string().nullable(),
});

export type CatalogMarketplace = (typeof catalogMarketplaces)[number];
export type CatalogSearchQuery = z.infer<typeof catalogSearchQuerySchema>;
export type CatalogSearchResult = z.infer<typeof catalogSearchResultSchema>;
export type CatalogSource = (typeof catalogSources)[number];
