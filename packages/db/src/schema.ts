import { relations, type SQL, sql } from 'drizzle-orm';
import { date, index, numeric, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
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
    imageUrl: text('image_url'),
    catalogSource: text('catalog_source'),
    catalogId: text('catalog_id'),
    searchVector: tsvector('search_vector')
      .notNull()
      .generatedAlwaysAs(
        (): SQL =>
          sql`setweight(to_tsvector('english', coalesce(${sneakers.brand}, '')), 'A') ||
              setweight(to_tsvector('english', coalesce(${sneakers.model}, '')), 'A') ||
              setweight(to_tsvector('english', coalesce(${sneakers.colorway}, '')), 'B') ||
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

export const sneakersRelations = relations(sneakers, ({ one }) => ({
  user: one(users, {
    fields: [sneakers.userId],
    references: [users.id],
  }),
}));
