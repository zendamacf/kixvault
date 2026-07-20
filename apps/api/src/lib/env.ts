import { type LogLevel, parseLogLevel } from './log-level';

const databaseUrl = process.env.DATABASE_URL ?? process.env.TEST_DATABASE_URL ?? '';

export const env = {
  databaseUrl,
  kicksdbApiKey: process.env.KICKSDB_API_KEY,
  redisUrl: process.env.REDIS_URL,
  signupsEnabled: process.env.SIGNUPS_ENABLED === 'true',
  port: Number(process.env.PORT) || 3000,
  isProduction: process.env.NODE_ENV === 'production',
  logLevel: parseLogLevel(process.env.LOG_LEVEL) satisfies LogLevel,
  sentryDsn:
    'https://ae34349ec1f0ef631fa6878064cfa57d@o4509541345591296.ingest.de.sentry.io/4511732877164624',
  sentryRelease: process.env.SENTRY_RELEASE,
} as const;

export function requireDatabaseUrl(): string {
  if (!env.databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  return env.databaseUrl;
}
