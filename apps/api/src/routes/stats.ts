import { sneakers } from "@kixvault/db";
import { eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../lib/db.js";
import { requireAuth, sessionMiddleware } from "../middleware/session.js";
import type { ApiEnv } from "../types.js";

export const statsRoutes = new Hono<ApiEnv>();

statsRoutes.use("*", sessionMiddleware);
statsRoutes.use("*", requireAuth);

statsRoutes.get("/", async (c) => {
  const user = c.get("user");

  const [result] = await db
    .select({
      count: sql<number>`cast(count(*) as int)`,
      totalSpend: sql<string | null>`sum(${sneakers.purchasePrice})`,
    })
    .from(sneakers)
    .where(eq(sneakers.userId, user?.id ?? ""));

  return c.json({
    stats: {
      count: result?.count ?? 0,
      totalSpend: result?.totalSpend ? Number(result.totalSpend) : 0,
    },
  });
});
