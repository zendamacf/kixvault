const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

export const env = {
  databaseUrl,
  kicksdbApiKey: process.env.KICKSDB_API_KEY,
  port: Number(process.env.PORT) || 3000,
  isProduction: process.env.NODE_ENV === 'production',
  sentryDsn: process.env.SENTRY_DSN,
  sentryRelease: process.env.SENTRY_RELEASE,
} as const;
