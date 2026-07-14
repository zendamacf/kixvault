import { APP_NAME } from '@kixvault/shared';
import { sentry } from '@sentry/hono/bun';
import { Hono } from 'hono';
import { env } from './lib/env';
import { authRoutes } from './routes/auth';
import { catalogRoutes } from './routes/catalog';
import { sneakerRoutes } from './routes/sneakers';
import { statsRoutes } from './routes/stats';
import type { ApiEnv } from './types';

const routes = new Hono<ApiEnv>();

export const app = routes
  .use(
    sentry(routes, {
      dsn: env.sentryDsn,
      environment: env.isProduction ? 'production' : 'development',
      release: env.sentryRelease,
      tracesSampleRate: env.isProduction ? 0.2 : 1.0,
      enableLogs: true,
    }),
  )
  .get('/api/health', (c) => c.json({ status: 'ok', app: APP_NAME }))
  .route('/api/auth', authRoutes)
  .route('/api/catalog', catalogRoutes)
  .route('/api/sneakers', sneakerRoutes)
  .route('/api/stats', statsRoutes);

export type AppType = typeof app;
