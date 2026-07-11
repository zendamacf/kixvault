import { APP_NAME } from '@kixvault/shared';
import { Hono } from 'hono';
import { authRoutes } from './routes/auth';
import { catalogRoutes } from './routes/catalog';
import { sneakerRoutes } from './routes/sneakers';
import { statsRoutes } from './routes/stats';
import type { ApiEnv } from './types';

const routes = new Hono<ApiEnv>()
  .get('/api/health', (c) => c.json({ status: 'ok', app: APP_NAME }))
  .route('/api/auth', authRoutes)
  .route('/api/catalog', catalogRoutes)
  .route('/api/sneakers', sneakerRoutes)
  .route('/api/stats', statsRoutes);

export const app = routes;
export type AppType = typeof routes;
