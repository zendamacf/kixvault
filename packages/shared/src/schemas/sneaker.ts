import { z } from 'zod';
import { sneakerConditions } from '../types';
import { catalogSources } from './catalog';

export const sneakerImageUrlSchema = z.string().trim().url().max(2000);

export const sneakerPrimaryImageSchema = z.object({
  id: z.string().uuid(),
  url: sneakerImageUrlSchema,
});

const dateField = z
  .string()
  .trim()
  .optional()
  .nullable()
  .refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: 'Expected YYYY-MM-DD',
  });

const sneakerCatalogFields = {
  sku: z.string().trim().max(50).optional().nullable(),
  primaryImage: sneakerImageUrlSchema.optional().nullable(),
  catalogSource: z.enum(catalogSources).optional().nullable(),
  catalogId: z.string().trim().max(200).optional().nullable(),
  nickname: z.string().trim().max(100).optional().nullable(),
  releaseDate: dateField,
  description: z.string().trim().max(5000).optional().nullable(),
} as const;

const optionalNumericField = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.coerce.number().nonnegative().optional().nullable(),
);

export const createSneakerSchema = z.object({
  brand: z.string().trim().min(1).max(100),
  model: z.string().trim().min(1).max(100),
  colorway: z.string().trim().max(100).optional().nullable(),
  size: z.coerce.number().positive().max(99),
  condition: z.enum(sneakerConditions),
  purchasePrice: optionalNumericField,
  purchaseDate: dateField,
  notes: z.string().trim().max(2000).optional().nullable(),
  ...sneakerCatalogFields,
});

export const updateSneakerSchema = createSneakerSchema.partial();

export const createSneakerFromCatalogSchema = z.object({
  catalogSource: z.enum(catalogSources),
  catalogId: z.string().trim().min(1).max(200),
  size: z.coerce.number().positive().max(99),
  condition: z.enum(sneakerConditions),
  purchasePrice: optionalNumericField,
  purchaseDate: dateField,
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const listSneakersQuerySchema = z.object({
  search: z.string().trim().min(1).max(100).optional(),
  condition: z.enum(sneakerConditions).optional(),
  sort: z.enum(['created_at', 'purchase_date', 'purchase_price', 'brand']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateSneakerInput = z.infer<typeof createSneakerSchema>;
export type CreateSneakerFromCatalogInput = z.infer<typeof createSneakerFromCatalogSchema>;
export type UpdateSneakerInput = z.infer<typeof updateSneakerSchema>;
export type ListSneakersQuery = z.infer<typeof listSneakersQuerySchema>;
