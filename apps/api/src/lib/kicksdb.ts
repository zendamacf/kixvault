import { configureClient } from "@kicksdb/sdk";
import { env } from "./env.js";

let configured = false;

export const isKicksdbConfigured = (): boolean => !!env.kicksdbApiKey;

/** Configure the KicksDB SDK client. Call before any catalog API requests. */
export function ensureKicksdbClient(): void {
  if (configured) {
    return;
  }

  if (!isKicksdbConfigured()) {
    throw new Error("KICKSDB_API_KEY environment variable is required for catalog search");
  }

  configureClient(env.kicksdbApiKey as string);
  configured = true;
}
