import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as schema from '@kixvault/db';
import { sessions, sneakers, users } from '@kixvault/db';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const migrationsFolder = join(
  fileURLToPath(new URL('.', import.meta.url)),
  '../../../../packages/db/drizzle',
);

export function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for API tests');
  }

  return databaseUrl;
}

export async function prepareTestDatabase(databaseUrl: string) {
  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzle(client, { schema });

  await migrate(db, { migrationsFolder });
  await client.end({ timeout: 5 });
}

export async function resetDatabase(databaseUrl: string) {
  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzle(client, { schema });

  try {
    await db.execute(
      sql`TRUNCATE TABLE ${sneakers}, ${sessions}, ${users} RESTART IDENTITY CASCADE`,
    );
  } finally {
    await client.end({ timeout: 5 });
  }
}

export function getSessionCookie(response: Response): string {
  const cookies = response.headers.getSetCookie();

  if (cookies.length > 0) {
    return cookies.map((cookie) => cookie.split(';')[0]).join('; ');
  }

  return response.headers.get('set-cookie')?.split(';')[0] ?? '';
}

export async function registerTestUser(
  app: { request: (input: string, init?: RequestInit) => Response | Promise<Response> },
  email: string,
  password = 'password123',
) {
  const response = await app.request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  return {
    response,
    cookie: getSessionCookie(response),
  };
}
