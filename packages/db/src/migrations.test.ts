import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sql } from 'drizzle-orm';
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

    expect(tables.map((row) => row.table_name)).toEqual(['sessions', 'sneakers', 'users']);
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
      'id',
      'image_url',
      'model',
      'nickname',
      'notes',
      'purchase_date',
      'purchase_price',
      'search_vector',
      'size',
      'sku',
      'updated_at',
      'user_id',
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
