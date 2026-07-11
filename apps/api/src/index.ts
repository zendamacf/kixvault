import { app } from "./app.js";
import { env } from "./lib/env.js";

export type { AppType } from "./app.js";

console.log("KixVault API listening on port", env.port);

export default {
  port: env.port,
  fetch: app.fetch,
};
