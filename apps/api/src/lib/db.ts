import { createDb, type Db } from '@kixvault/db';
import { env } from './env';

if (!env.databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

export const db: Db = createDb(env.databaseUrl);
