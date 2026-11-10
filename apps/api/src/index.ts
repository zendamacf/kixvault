import { app } from './app';
import { env, requireDatabaseUrl } from './lib/env';
import { logger } from './lib/logger';

requireDatabaseUrl();

export type { AppType } from './app';

logger.log('KixVault API listening on port', env.port);

export default {
  port: env.port,
  fetch: app.fetch,
};
