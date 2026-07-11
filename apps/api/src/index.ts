import { APP_NAME } from "@kixvault/shared";
import { Hono } from "hono";

const app = new Hono();

app.get("/api/health", (c) => {
  return c.json({ status: "ok", app: APP_NAME });
});

const port = Number(process.env.PORT) || 3000;

console.log(`${APP_NAME} API listening on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
