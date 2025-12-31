import { Hono } from "hono";
import { cors } from "hono/cors";
import { jwt } from "hono/jwt";
import { drizzle } from "drizzle-orm/d1";
import { eq, desc, and } from "drizzle-orm";
import * as schema from "../drizzle/schema";
import { authRoutes } from "./routes/auth";
import { projectRoutes } from "./routes/projects";
import { chatRoutes } from "./routes/chat";
import { templateRoutes } from "./routes/templates";
import { userRoutes } from "./routes/users";
import { adminRoutes } from "./routes/admin";
import { stripeRoutes } from "./routes/stripe";

export interface Env {
  DB: D1Database;
  STORAGE: R2Bucket;
  SESSIONS: KVNamespace;
  JWT_SECRET: string;
  ENVIRONMENT: string;
  APP_URL: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  OPENAI_API_KEY?: string;
}

export type Variables = {
  user: schema.User | null;
  db: ReturnType<typeof drizzle>;
};

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// CORS middleware
app.use("*", cors({
  origin: ["http://localhost:5173", "https://adele.ayonix.com"],
  credentials: true,
  allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

// Database middleware
app.use("*", async (c, next) => {
  const db = drizzle(c.env.DB, { schema });
  c.set("db", db);
  await next();
});

// Public routes (no auth required)
app.route("/api/auth", authRoutes);
app.route("/api/templates", templateRoutes);

// Stripe webhook (no auth, but verified by signature)
app.route("/api/stripe", stripeRoutes);

// Protected routes middleware
app.use("/api/*", async (c, next) => {
  // Skip auth for public routes
  const path = c.req.path;
  if (
    path.startsWith("/api/auth") || 
    path.startsWith("/api/templates") ||
    path.startsWith("/api/stripe/webhook")
  ) {
    return next();
  }

  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.substring(7);
  
  try {
    const { verify } = await import("hono/jwt");
    const payload = await verify(token, c.env.JWT_SECRET);
    
    const db = c.get("db");
    const user = await db.select().from(schema.users).where(eq(schema.users.id, payload.userId as number)).get();
    
    if (!user) {
      return c.json({ error: "User not found" }, 401);
    }
    
    c.set("user", user);
    await next();
  } catch (error) {
    return c.json({ error: "Invalid token" }, 401);
  }
});

// Protected routes
app.route("/api/projects", projectRoutes);
app.route("/api/chat", chatRoutes);
app.route("/api/users", userRoutes);
app.route("/api/admin", adminRoutes);

// Health check
app.get("/api/health", (c) => {
  return c.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT 
  });
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: "Not found" }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error("Error:", err);
  return c.json({ 
    error: "Internal server error", 
    message: c.env.ENVIRONMENT === "development" ? err.message : undefined 
  }, 500);
});

export default app;
