import { APP_NAME } from '@kixvault/shared';
import { Hono } from 'hono';
import { authRoutes } from './routes/auth.js';
import { catalogRoutes } from './routes/catalog.js';
import { sneakerRoutes } from './routes/sneakers.js';
import { statsRoutes } from './routes/stats.js';
import type { ApiEnv } from './types.js';

const routes = new Hono<ApiEnv>()
  .get('/api/health', (c) => c.json({ status: 'ok', app: APP_NAME }))
  .route('/api/auth', authRoutes)
  .route('/api/catalog', catalogRoutes)
  .route('/api/sneakers', sneakerRoutes)
  .route('/api/stats', statsRoutes);

export const app = routes;
export type AppType = typeof routes;
