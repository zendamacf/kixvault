import { getTestDatabaseUrl, prepareTestDatabase } from './helpers';

const testDatabaseUrl = getTestDatabaseUrl();

if (!testDatabaseUrl) {
  throw new Error('TEST_DATABASE_URL is required to prepare the test database.');
}

await prepareTestDatabase(testDatabaseUrl);
console.log(`Prepared test database: ${testDatabaseUrl}`);
