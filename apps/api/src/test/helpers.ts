import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as schema from '@kixvault/db';
import { emailVerificationTokens, sessions, sneakers, users } from '@kixvault/db';
import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const migrationsFolder = join(
  fileURLToPath(new URL('.', import.meta.url)),
  '../../../../packages/db/drizzle',
);

export function getTestDatabaseUrl(): string | null {
  return process.env.TEST_DATABASE_URL ?? null;
}

export async function ensureTestDatabase(databaseUrl: string) {
  const url = new URL(databaseUrl);
  const databaseName = url.pathname.replace(/^\//, '');

  if (!databaseName) {
    throw new Error('Test database URL must include a database name');
  }

  if (!/^[a-zA-Z0-9_]+$/.test(databaseName)) {
    throw new Error(`Invalid test database name: ${databaseName}`);
  }

  url.pathname = '/postgres';
  const admin = postgres(url.toString(), { max: 1 });

  try {
    const [{ exists }] = await admin<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM pg_database WHERE datname = ${databaseName}
      ) AS exists
    `;

    if (!exists) {
      await admin.unsafe(`CREATE DATABASE ${databaseName}`);
    }
  } finally {
    await admin.end({ timeout: 5 });
  }
}

export async function prepareTestDatabase(databaseUrl: string) {
  await ensureTestDatabase(databaseUrl);

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
      sql`TRUNCATE TABLE ${sneakers}, ${emailVerificationTokens}, ${sessions}, ${users} RESTART IDENTITY CASCADE`,
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

export async function verifyTestUserEmail(databaseUrl: string, email: string) {
  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzle(client, { schema });

  try {
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));

    if (!user) {
      return;
    }

    await db
      .update(users)
      .set({ emailVerified: true, emailVerifiedAt: new Date() })
      .where(eq(users.id, user.id));
    await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, user.id));
  } finally {
    await client.end({ timeout: 5 });
  }
}

export async function loginTestUser(
  app: { request: (input: string, init?: RequestInit) => Response | Promise<Response> },
  email: string,
  password = 'password123',
) {
  const response = await app.request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  return {
    response,
    cookie: getSessionCookie(response),
  };
}

export async function registerAndLoginTestUser(
  app: { request: (input: string, init?: RequestInit) => Response | Promise<Response> },
  email: string,
  password = 'password123',
  databaseUrl: string,
) {
  const { response: registerResponse } = await registerTestUser(app, email, password);
  await verifyTestUserEmail(databaseUrl, email);
  const { response: loginResponse, cookie } = await loginTestUser(app, email, password);

  return {
    registerResponse,
    loginResponse,
    cookie,
  };
}
