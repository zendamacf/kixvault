import { app } from './app';
import { startImageWorker } from './jobs/image-worker';
import { startScheduler } from './jobs/scheduler';
import { env, requireDatabaseUrl } from './lib/env';
import { logger } from './lib/logger';

requireDatabaseUrl();

export type { AppType } from './app';

logger.log('KixVault API listening on port', env.port);

if (env.runJobs) {
  startScheduler();
  startImageWorker();
} else {
  logger.log('Background jobs are off in this process (RUN_JOBS=false)');
}

export default {
  port: env.port,
  fetch: app.fetch,
};
