import { APP_NAME } from '@kixvault/shared';
import { sentry } from '@sentry/hono/bun';
import { Hono } from 'hono';
import { env } from './lib/env';
import { globalApiRateLimit } from './middleware/global-rate-limit';
import { requestLogMiddleware } from './middleware/request-log';
import { auditRoutes } from './routes/audit';
import { authRoutes } from './routes/auth';
import { catalogRoutes } from './routes/catalog';
import { imageRoutes } from './routes/images';
import { sneakerRoutes } from './routes/sneakers';
import { statsRoutes } from './routes/stats';
import { wishlistRoutes } from './routes/wishlist';
import type { ApiEnv } from './types';

const routes = new Hono<ApiEnv>();

const withSentry = env.isProduction
  ? routes.use(
      sentry(routes, {
        dsn: env.sentryDsn,
        environment: 'production',
        release: env.sentryRelease,
        tracesSampleRate: 0.2,
        enableLogs: true,
      }),
    )
  : routes;

export const app = withSentry
  .use(requestLogMiddleware)
  .get('/api/health', (c) => c.json({ status: 'ok', app: APP_NAME }))
  .use('/api/*', async (c, next) => {
    if (c.req.path === '/api/health') {
      return next();
    }

    return globalApiRateLimit(c, next);
  })
  .route('/api/audit', auditRoutes)
  .route('/api/auth', authRoutes)
  .route('/api/catalog', catalogRoutes)
  .route('/api/images', imageRoutes)
  .route('/api/sneakers', sneakerRoutes)
  .route('/api/stats', statsRoutes)
  .route('/api/wishlist', wishlistRoutes);

export type AppType = typeof app;
