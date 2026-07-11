import { zValidator } from "@hono/zod-validator";
import { users } from "@kixvault/db";
import { loginSchema, registerSchema } from "@kixvault/shared";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { generateIdFromEntropySize } from "lucia";
import { lucia } from "../lib/auth.js";
import { db } from "../lib/db.js";
import { sessionMiddleware } from "../middleware/session.js";
import type { ApiEnv } from "../types.js";

export const authRoutes = new Hono<ApiEnv>()
  .use(sessionMiddleware)
  .post("/register", zValidator("json", registerSchema), async (c) => {
    const { email, password } = c.req.valid("json");

    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email));

    if (existingUser) {
      return c.json({ error: "Email already in use" }, 409);
    }

    const userId = generateIdFromEntropySize(10);
    const passwordHash = await Bun.password.hash(password, { algorithm: "argon2id" });

    await db.insert(users).values({
      id: userId,
      email,
      passwordHash,
    });

    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    return c.json({ user: { id: userId, email } }, 201, {
      "Set-Cookie": sessionCookie.serialize(),
    });
  })
  .post("/login", zValidator("json", loginSchema), async (c) => {
    const { email, password } = c.req.valid("json");

    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    const validPassword = await Bun.password.verify(password, user.passwordHash);

    if (!validPassword) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    return c.json({ user: { id: user.id, email: user.email } }, 200, {
      "Set-Cookie": sessionCookie.serialize(),
    });
  })
  .post("/logout", async (c) => {
    const session = c.get("session");

    if (session) {
      await lucia.invalidateSession(session.id);
    }

    const sessionCookie = lucia.createBlankSessionCookie();

    return c.json({ success: true }, 200, { "Set-Cookie": sessionCookie.serialize() });
  })
  .get("/me", async (c) => {
    const user = c.get("user");

    if (!user) {
      return c.json({ user: null });
    }

    return c.json({
      user: {
        id: user.id,
        email: user.email,
      },
    });
  });
