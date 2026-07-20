import { configureClient } from '@kicksdb/sdk';
import { env } from './env';

const clientState = {
  configured: false,
};

export function resetKicksdbClientForTests(): void {
  clientState.configured = false;
}

export const isKicksdbConfigured = (): boolean => !!env.kicksdbApiKey;

/** Configure the KicksDB SDK client. Call before any catalog API requests. */
export function ensureKicksdbClient(): void {
  if (clientState.configured) {
    return;
  }

  if (!isKicksdbConfigured()) {
    throw new Error('KICKSDB_API_KEY environment variable is required for catalog search');
  }

  configureClient(env.kicksdbApiKey as string);
  clientState.configured = true;
}
