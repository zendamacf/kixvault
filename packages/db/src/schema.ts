import { relations, type SQL, sql } from 'drizzle-orm';
import {
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { tsvector } from './custom-types';

export const sneakerConditions = ['deadstock', 'lightly_worn', 'worn', 'beat'] as const;
export type SneakerCondition = (typeof sneakerConditions)[number];

export const sneakerConditionEnum = pgEnum('sneaker_condition', sneakerConditions);

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
});

export const sneakers = pgTable(
  'sneakers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    brand: text('brand').notNull(),
    model: text('model').notNull(),
    colorway: text('colorway'),
    size: numeric('size', { precision: 4, scale: 1 }).notNull(),
    condition: sneakerConditionEnum('condition').notNull(),
    purchasePrice: numeric('purchase_price', { precision: 10, scale: 2 }),
    purchaseDate: date('purchase_date', { mode: 'date' }),
    notes: text('notes'),
    sku: text('sku'),
    catalogSource: text('catalog_source'),
    catalogId: text('catalog_id'),
    nickname: text('nickname'),
    releaseDate: date('release_date', { mode: 'date' }),
    description: text('description'),
    searchVector: tsvector('search_vector')
      .notNull()
      .generatedAlwaysAs(
        (): SQL =>
          sql`setweight(to_tsvector('english', coalesce(${sneakers.brand}, '')), 'A') ||
              setweight(to_tsvector('english', coalesce(${sneakers.model}, '')), 'A') ||
              setweight(to_tsvector('english', coalesce(${sneakers.colorway}, '')), 'B') ||
              setweight(to_tsvector('english', coalesce(${sneakers.nickname}, '')), 'B') ||
              setweight(to_tsvector('simple', coalesce(${sneakers.sku}, '')), 'A') ||
              setweight(to_tsvector('english', coalesce(${sneakers.notes}, '')), 'C')`,
      ),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index('sneakers_search_vector_idx').using('gin', table.searchVector)],
);

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  sneakers: many(sneakers),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const sneakerImageFetchStatuses = ['pending', 'ready', 'failed'] as const;
export type SneakerImageFetchStatus = (typeof sneakerImageFetchStatuses)[number];

export const sneakerImageFetchStatusEnum = pgEnum(
  'sneaker_image_fetch_status',
  sneakerImageFetchStatuses,
);

export const sneakerImages = pgTable(
  'sneaker_images',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sneakerId: uuid('sneaker_id')
      .notNull()
      .references(() => sneakers.id, { onDelete: 'cascade' }),
    sourceUrl: text('source_url').notNull(),
    storagePath: text('storage_path'),
    fetchStatus: sneakerImageFetchStatusEnum('fetch_status').notNull().default('pending'),
    fetchError: text('fetch_error'),
    fetchedAt: timestamp('fetched_at', { withTimezone: true, mode: 'date' }),
    sortOrder: integer('sort_order').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('sneaker_images_sneaker_id_idx').on(table.sneakerId),
    unique('sneaker_images_sneaker_id_sort_order_unique').on(table.sneakerId, table.sortOrder),
  ],
);

export const sneakersRelations = relations(sneakers, ({ one, many }) => ({
  user: one(users, {
    fields: [sneakers.userId],
    references: [users.id],
  }),
  images: many(sneakerImages),
}));

export const sneakerImagesRelations = relations(sneakerImages, ({ one }) => ({
  sneaker: one(sneakers, {
    fields: [sneakerImages.sneakerId],
    references: [sneakers.id],
  }),
}));

export type CatalogVariantPrice = {
  size: string;
  sizeType: string | null;
  price: number;
  variantId: string | null;
};

export const catalogProductCache = pgTable(
  'catalog_product_cache',
  {
    catalogSource: text('catalog_source').notNull(),
    catalogId: text('catalog_id').notNull(),
    sku: text('sku').notNull(),
    variantPrices: jsonb('variant_prices').$type<CatalogVariantPrice[]>().notNull(),
    fetchedAt: timestamp('fetched_at', { withTimezone: true, mode: 'date' }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.catalogSource, table.catalogId] })],
);

export const catalogMarketPrices = pgTable(
  'catalog_market_prices',
  {
    catalogSource: text('catalog_source').notNull(),
    sku: text('sku').notNull(),
    size: numeric('size', { precision: 4, scale: 1 }).notNull(),
    price: numeric('price', { precision: 10, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('USD'),
    pricedAt: timestamp('priced_at', { withTimezone: true, mode: 'date' }).notNull(),
    variantId: text('variant_id'),
  },
  (table) => [primaryKey({ columns: [table.catalogSource, table.sku, table.size] })],
);

export const priceSnapshots = pgTable(
  'price_snapshots',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    catalogSource: text('catalog_source').notNull(),
    sku: text('sku').notNull(),
    size: numeric('size', { precision: 4, scale: 1 }).notNull(),
    snapshotDate: date('snapshot_date', { mode: 'date' }).notNull(),
    price: numeric('price', { precision: 10, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('USD'),
  },
  (table) => [
    unique('price_snapshots_catalog_source_sku_size_snapshot_date_unique').on(
      table.catalogSource,
      table.sku,
      table.size,
      table.snapshotDate,
    ),
  ],
);

export const pricingRefreshStatuses = ['running', 'completed', 'failed'] as const;
export type PricingRefreshStatus = (typeof pricingRefreshStatuses)[number];

export const pricingRefreshStatusEnum = pgEnum('pricing_refresh_status', pricingRefreshStatuses);

export const pricingRefreshRuns = pgTable('pricing_refresh_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  startedAt: timestamp('started_at', { withTimezone: true, mode: 'date' }).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true, mode: 'date' }),
  status: pricingRefreshStatusEnum('status').notNull(),
  productsRefreshed: integer('products_refreshed'),
});
