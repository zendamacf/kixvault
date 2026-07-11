import { zValidator } from "@hono/zod-validator";
import { sneakers } from "@kixvault/db";
import {
  createSneakerSchema,
  listSneakersQuerySchema,
  updateSneakerSchema,
} from "@kixvault/shared";
import { and, asc, desc, eq, ilike } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../lib/db.js";
import { formatSneaker, parsePurchaseDate, parseSneakerId } from "../lib/sneakers.js";
import { requireAuth, sessionMiddleware } from "../middleware/session.js";
import type { ApiEnv } from "../types.js";

export const sneakerRoutes = new Hono<ApiEnv>();

sneakerRoutes.use("*", sessionMiddleware);
sneakerRoutes.use("*", requireAuth);

sneakerRoutes.get("/", zValidator("query", listSneakersQuerySchema), async (c) => {
  const user = c.get("user");
  const query = c.req.valid("query");

  const filters = [eq(sneakers.userId, user?.id ?? "")];

  if (query.brand) {
    filters.push(ilike(sneakers.brand, `%${query.brand}%`));
  }

  if (query.condition) {
    filters.push(eq(sneakers.condition, query.condition));
  }

  const sortColumn = {
    created_at: sneakers.createdAt,
    purchase_date: sneakers.purchaseDate,
    purchase_price: sneakers.purchasePrice,
    brand: sneakers.brand,
  }[query.sort];

  const orderBy = query.order === "asc" ? asc(sortColumn) : desc(sortColumn);

  const rows = await db
    .select()
    .from(sneakers)
    .where(and(...filters))
    .orderBy(orderBy);

  return c.json({ sneakers: rows.map(formatSneaker) });
});

sneakerRoutes.get("/:id", async (c) => {
  const user = c.get("user");
  const id = parseSneakerId(c.req.param("id"));

  if (!id) {
    return c.json({ error: "Invalid sneaker id" }, 400);
  }

  const [row] = await db
    .select()
    .from(sneakers)
    .where(and(eq(sneakers.id, id), eq(sneakers.userId, user?.id ?? "")));

  if (!row) {
    return c.json({ error: "Sneaker not found" }, 404);
  }

  return c.json({ sneaker: formatSneaker(row) });
});

sneakerRoutes.post("/", zValidator("json", createSneakerSchema), async (c) => {
  const user = c.get("user");
  const input = c.req.valid("json");

  const [row] = await db
    .insert(sneakers)
    .values({
      userId: user?.id ?? "",
      brand: input.brand,
      model: input.model,
      colorway: input.colorway ?? null,
      size: input.size.toString(),
      condition: input.condition,
      purchasePrice: input.purchasePrice?.toString() ?? null,
      purchaseDate: parsePurchaseDate(input.purchaseDate),
      notes: input.notes ?? null,
    })
    .returning();

  return c.json({ sneaker: formatSneaker(row) }, 201);
});

sneakerRoutes.patch("/:id", zValidator("json", updateSneakerSchema), async (c) => {
  const user = c.get("user");
  const id = parseSneakerId(c.req.param("id"));
  const input = c.req.valid("json");

  if (!id) {
    return c.json({ error: "Invalid sneaker id" }, 400);
  }

  const [existing] = await db
    .select({ id: sneakers.id })
    .from(sneakers)
    .where(and(eq(sneakers.id, id), eq(sneakers.userId, user?.id ?? "")));

  if (!existing) {
    return c.json({ error: "Sneaker not found" }, 404);
  }

  const [row] = await db
    .update(sneakers)
    .set({
      ...(input.brand !== undefined ? { brand: input.brand } : {}),
      ...(input.model !== undefined ? { model: input.model } : {}),
      ...(input.colorway !== undefined ? { colorway: input.colorway } : {}),
      ...(input.size !== undefined ? { size: input.size.toString() } : {}),
      ...(input.condition !== undefined ? { condition: input.condition } : {}),
      ...(input.purchasePrice !== undefined
        ? { purchasePrice: input.purchasePrice?.toString() ?? null }
        : {}),
      ...(input.purchaseDate !== undefined
        ? { purchaseDate: parsePurchaseDate(input.purchaseDate) }
        : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    })
    .where(eq(sneakers.id, id))
    .returning();

  return c.json({ sneaker: formatSneaker(row) });
});

sneakerRoutes.delete("/:id", async (c) => {
  const user = c.get("user");
  const id = parseSneakerId(c.req.param("id"));

  if (!id) {
    return c.json({ error: "Invalid sneaker id" }, 400);
  }

  const [row] = await db
    .delete(sneakers)
    .where(and(eq(sneakers.id, id), eq(sneakers.userId, user?.id ?? "")))
    .returning({ id: sneakers.id });

  if (!row) {
    return c.json({ error: "Sneaker not found" }, 404);
  }

  return c.json({ success: true });
});
