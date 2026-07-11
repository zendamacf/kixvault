import { APP_NAME } from "@kixvault/shared";
import { Hono } from "hono";
import { env } from "./lib/env.js";
import { authRoutes } from "./routes/auth.js";
import { sneakerRoutes } from "./routes/sneakers.js";
import { statsRoutes } from "./routes/stats.js";
import type { ApiEnv } from "./types.js";

const app = new Hono<ApiEnv>();

app.get("/api/health", (c) => {
  return c.json({ status: "ok", app: APP_NAME });
});

const routes = app
  .route("/api/auth", authRoutes)
  .route("/api/sneakers", sneakerRoutes)
  .route("/api/stats", statsRoutes);

export type AppType = typeof routes;

console.log(`${APP_NAME} API listening on port ${env.port}`);

export default {
  port: env.port,
  fetch: routes.fetch,
};
