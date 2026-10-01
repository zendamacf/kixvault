import { z } from 'zod';
import { sneakerConditions } from '../types';
import { catalogSources } from './catalog';

export const wishlistPriorities = ['low', 'medium', 'high'] as const;
export type WishlistPriority = (typeof wishlistPriorities)[number];

const dateField = z
  .string()
  .trim()
  .optional()
  .nullable()
  .refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: 'Expected YYYY-MM-DD',
  });

const optionalTargetSize = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.coerce.number().positive().max(99).optional().nullable(),
);

const wishlistCatalogFields = {
  sku: z.string().trim().max(50).optional().nullable(),
  catalogSource: z.enum(catalogSources).optional().nullable(),
  catalogId: z.string().trim().max(200).optional().nullable(),
  nickname: z.string().trim().max(100).optional().nullable(),
  releaseDate: dateField,
  description: z.string().trim().max(5000).optional().nullable(),
  imageUrl: z.string().trim().url().max(2000).optional().nullable(),
} as const;

export const createWishlistItemSchema = z.object({
  brand: z.string().trim().min(1).max(100),
  model: z.string().trim().min(1).max(100),
  colorway: z.string().trim().max(100).optional().nullable(),
  targetSize: optionalTargetSize,
  priority: z.enum(wishlistPriorities).default('medium'),
  notes: z.string().trim().max(2000).optional().nullable(),
  ...wishlistCatalogFields,
});

/** PATCH bodies must not apply create-time defaults (e.g. priority) when fields are omitted. */
export const updateWishlistItemSchema = createWishlistItemSchema
  .omit({ priority: true })
  .partial()
  .extend({
    priority: z.enum(wishlistPriorities).optional(),
  });

export const createWishlistFromCatalogSchema = z.object({
  catalogSource: z.enum(catalogSources),
  catalogId: z.string().trim().min(1).max(200),
  targetSize: optionalTargetSize,
  priority: z.enum(wishlistPriorities).default('medium'),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const moveWishlistToCollectionSchema = z.object({
  size: z.coerce.number().positive().max(99),
  condition: z.enum(sneakerConditions),
  purchasePrice: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.coerce.number().nonnegative().optional().nullable(),
  ),
  purchaseDate: dateField,
  notes: z.string().trim().max(2000).optional().nullable(),
});

export type CreateWishlistItemInput = z.infer<typeof createWishlistItemSchema>;
export type CreateWishlistFromCatalogInput = z.infer<typeof createWishlistFromCatalogSchema>;
export type UpdateWishlistItemInput = z.infer<typeof updateWishlistItemSchema>;
export type MoveWishlistToCollectionInput = z.infer<typeof moveWishlistToCollectionSchema>;
