import { configureClient } from "@kicksdb/sdk";
import { env } from "./env.js";

let configured = false;

/** Configure the KicksDB SDK client. Call before any catalog API requests. */
export function ensureKicksdbClient(): void {
  if (configured) {
    return;
  }

  if (!env.kicksdbApiKey) {
    throw new Error("KICKSDB_API_KEY environment variable is required for catalog search");
  }

  configureClient(env.kicksdbApiKey);
  configured = true;
}
