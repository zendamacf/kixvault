import { z } from "zod";
import { sneakerConditions } from "../types.js";
import { catalogSources } from "./catalog.js";

const sneakerCatalogFields = {
  sku: z.string().trim().max(50).optional().nullable(),
  imageUrl: z.string().trim().url().max(2000).optional().nullable(),
  catalogSource: z.enum(catalogSources).optional().nullable(),
  catalogId: z.string().trim().max(200).optional().nullable(),
} as const;

export const createSneakerSchema = z.object({
  brand: z.string().trim().min(1).max(100),
  model: z.string().trim().min(1).max(100),
  colorway: z.string().trim().max(100).optional().nullable(),
  size: z.coerce.number().positive().max(99),
  condition: z.enum(sneakerConditions),
  purchasePrice: z.coerce.number().nonnegative().optional().nullable(),
  purchaseDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")
    .optional()
    .nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  ...sneakerCatalogFields,
});

export const updateSneakerSchema = createSneakerSchema.partial();

export const listSneakersQuerySchema = z.object({
  brand: z.string().trim().optional(),
  condition: z.enum(sneakerConditions).optional(),
  sort: z.enum(["created_at", "purchase_date", "purchase_price", "brand"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateSneakerInput = z.infer<typeof createSneakerSchema>;
export type UpdateSneakerInput = z.infer<typeof updateSneakerSchema>;
export type ListSneakersQuery = z.infer<typeof listSneakersQuerySchema>;
