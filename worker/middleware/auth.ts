import { Context, Next } from "hono";
import { verify } from "hono/jwt";
import { eq } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { Env, Variables } from "../index";

export async function authMiddleware(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  next: Next
) {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.substring(7);

  try {
    const payload = await verify(token, c.env.JWT_SECRET);
    const db = c.get("db");
    const user = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, payload.userId as number))
      .get();

    if (!user) {
      return c.json({ error: "User not found" }, 401);
    }

    c.set("user", user);
    await next();
  } catch (error) {
    return c.json({ error: "Invalid token" }, 401);
  }
}

export async function adminMiddleware(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  next: Next
) {
  const user = c.get("user");

  if (!user || user.role !== "admin") {
    return c.json({ error: "Admin access required" }, 403);
  }

  await next();
}

export async function optionalAuthMiddleware(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  next: Next
) {
  const authHeader = c.req.header("Authorization");

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);

    try {
      const payload = await verify(token, c.env.JWT_SECRET);
      const db = c.get("db");
      const user = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, payload.userId as number))
        .get();

      if (user) {
        c.set("user", user);
      }
    } catch {
      // Token invalid, but continue without user
    }
  }

  await next();
}
