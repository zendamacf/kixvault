import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import journal from '../drizzle/meta/_journal.json';
import * as schema from './schema';
import { sneakers, users } from './schema';

const databaseUrl = process.env.TEST_DATABASE_URL ?? null;

const migrationsFolder = join(fileURLToPath(new URL('.', import.meta.url)), '../drizzle');

describe.skipIf(!databaseUrl)('migrations', () => {
  let client: ReturnType<typeof postgres>;
  let db: ReturnType<typeof drizzle<typeof schema>>;

  beforeAll(async () => {
    if (!databaseUrl) {
      return;
    }

    const connectionString = databaseUrl;
    client = postgres(connectionString, { max: 1 });
    db = drizzle(client, { schema });

    await migrate(db, { migrationsFolder });
  });

  afterAll(async () => {
    await client.end({ timeout: 5 });
  });

  test('applies all migrations on an empty database', async () => {
    const [{ count }] = await client<{ count: number }[]>`
      SELECT count(*)::int AS count
      FROM drizzle.__drizzle_migrations
    `;

    expect(count).toBe(journal.entries.length);
  });

  test('creates the expected public tables', async () => {
    const tables = await client<{ table_name: string }[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    expect(tables.map((row) => row.table_name)).toEqual([
      'audit_events',
      'catalog_market_prices',
      'catalog_product_cache',
      'email_verification_tokens',
      'password_reset_tokens',
      'price_snapshots',
      'pricing_refresh_runs',
      'sessions',
      'sneaker_gallery_360_images',
      'sneaker_images',
      'sneaker_wears',
      'sneakers',
      'users',
      'wishlist_items',
    ]);
  });

  test('creates catalog and full-text search columns on sneakers', async () => {
    const columns = await client<{ column_name: string }[]>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'sneakers'
      ORDER BY column_name
    `;

    expect(columns.map((row) => row.column_name)).toEqual([
      'brand',
      'catalog_id',
      'catalog_source',
      'colorway',
      'condition',
      'created_at',
      'departed_on',
      'departure_notes',
      'departure_type',
      'description',
      'id',
      'model',
      'nickname',
      'notes',
      'primary_image_id',
      'purchase_date',
      'purchase_price',
      'release_date',
      'sale_price',
      'search_vector',
      'size',
      'sku',
      'updated_at',
      'user_id',
    ]);
  });

  test('adds the departure type enum and its index', async () => {
    const [{ labels }] = await client<{ labels: string[] }[]>`
      SELECT array_agg(enumlabel ORDER BY enumsortorder) AS labels
      FROM pg_enum
      JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
      WHERE pg_type.typname = 'departure_type'
    `;

    expect(labels).toEqual(['sold', 'donated', 'gifted', 'traded', 'lost', 'other']);

    const indexes = await client<{ indexname: string }[]>`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'sneakers'
        AND indexname = 'sneakers_user_id_departure_type_idx'
    `;

    expect(indexes).toHaveLength(1);
  });

  test('leaves existing pairs active with no departure data', async () => {
    const userId = 'departure-default-user';

    await db.insert(users).values({
      id: userId,
      email: 'departure-default@example.com',
      passwordHash: 'hash',
    });
    const [row] = await db
      .insert(sneakers)
      .values({ userId, brand: 'Nike', model: 'Dunk', size: '10', condition: 'worn' })
      .returning();

    expect(row.departureType).toBeNull();
    expect(row.departedOn).toBeNull();
    expect(row.salePrice).toBeNull();
    expect(row.departureNotes).toBeNull();

    await db.delete(users).where(eq(users.id, userId));
  });

  test('creates sneaker_images table columns', async () => {
    const columns = await client<{ column_name: string }[]>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'sneaker_images'
      ORDER BY column_name
    `;

    expect(columns.map((row) => row.column_name)).toEqual([
      'created_at',
      'fetch_error',
      'fetch_status',
      'fetched_at',
      'id',
      'sneaker_id',
      'source_url',
      'storage_path',
    ]);
  });

  test('creates sneaker_gallery_360_images table columns', async () => {
    const columns = await client<{ column_name: string }[]>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'sneaker_gallery_360_images'
      ORDER BY column_name
    `;

    expect(columns.map((row) => row.column_name)).toEqual([
      'created_at',
      'fetch_error',
      'fetch_status',
      'fetched_at',
      'id',
      'sneaker_id',
      'sort_order',
      'source_url',
      'storage_path',
    ]);
  });

  test('supports basic inserts after migration', async () => {
    const userId = `migration-test-${crypto.randomUUID()}`;

    await db.insert(users).values({
      id: userId,
      email: `${userId}@example.com`,
      passwordHash: 'test-hash',
    });

    const [sneaker] = await db
      .insert(sneakers)
      .values({
        userId,
        brand: 'Nike',
        model: 'Air Max 1',
        size: '10',
        condition: 'deadstock',
        sku: 'TEST-SKU-001',
        notes: 'migration smoke test',
      })
      .returning({
        id: sneakers.id,
        searchVector: sneakers.searchVector,
      });

    expect(sneaker?.id).toBeTruthy();
    expect(sneaker?.searchVector).toBeTruthy();

    const searchMatches = await db
      .select({ id: sneakers.id })
      .from(sneakers)
      .where(sql`${sneakers.searchVector} @@ plainto_tsquery('english', 'Nike')`);

    expect(searchMatches.some((row) => row.id === sneaker?.id)).toBe(true);

    await db.delete(sneakers).where(sql`${sneakers.userId} = ${userId}`);
    await db.delete(users).where(sql`${users.id} = ${userId}`);
  });
});
