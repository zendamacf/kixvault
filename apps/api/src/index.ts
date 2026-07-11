import { app } from './app';
import { env } from './lib/env';

export type { AppType } from './app';

console.log('KixVault API listening on port', env.port);

export default {
  port: env.port,
  fetch: app.fetch,
};
