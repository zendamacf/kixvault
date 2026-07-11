import { createDb, type Db } from '@kixvault/db';
import { env } from './env';

export const db: Db = createDb(env.databaseUrl);
