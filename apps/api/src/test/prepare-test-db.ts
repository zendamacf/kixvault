import { logger } from '../lib/logger';
import { getTestDatabaseUrl, prepareTestDatabase } from './helpers';

const testDatabaseUrl = getTestDatabaseUrl();

if (!testDatabaseUrl) {
  throw new Error('TEST_DATABASE_URL is required to prepare the test database.');
}

await prepareTestDatabase(testDatabaseUrl);
logger.log(`Prepared test database: ${testDatabaseUrl}`);
