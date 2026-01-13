import { Hono } from "hono";
import { cors } from "hono/cors";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import * as schema from "../drizzle/schema";
import { authRoutes } from "./routes/auth";
import { oauthRoutes } from "./routes/oauth";
import { projectRoutes } from "./routes/projects";
import { chatRoutes } from "./routes/chat";
import { templateRoutes } from "./routes/templates";
import { userRoutes } from "./routes/users";
import { adminRoutes } from "./routes/admin";
import { stripeRoutes } from "./routes/stripe";
// New routes
import { accountRoutes } from "./routes/account";
import { usageRoutes } from "./routes/usage";
import { billingRoutes } from "./routes/billing";
import { workOrderRoutes } from "./routes/workOrders";
import { deployRoutes } from "./routes/deploy";
import { scheduledWorksRoutes } from "./routes/scheduledWorks";
import { connectorsRoutes } from "./routes/connectors";
import { cloudRoutes } from "./routes/cloud";
import { voiceRoutes } from "./routes/voice";
import { dataControlsRoutes } from "./routes/dataControls";
import { integrationsRoutes } from "./routes/integrations";
import { auditRoutes } from "./routes/audit";
import { mailRoutes } from "./routes/mail";
import { cloudBrowserRoutes } from "./routes/cloudBrowser";
import { createEmailService, EmailService } from "./services/email";
import { rateLimiters } from "./middleware/rateLimit";
import { 
  initMonitoring, 
  Logger, 
  MetricsCollector, 
  ErrorTracker,
  createRequestMiddleware,
  createHealthCheck,
  LogLevel
} from "./services/monitoring";

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
  RESEND_API_KEY?: string;
  FROM_EMAIL?: string;
  FROM_NAME?: string;
  SENTRY_DSN?: string;
  VERSION?: string;
  // OAuth providers
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  APPLE_CLIENT_ID?: string;
  APPLE_CLIENT_SECRET?: string;
  APPLE_TEAM_ID?: string;
  APPLE_KEY_ID?: string;
  MICROSOFT_CLIENT_ID?: string;
  MICROSOFT_CLIENT_SECRET?: string;
  MICROSOFT_TENANT_ID?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  FACEBOOK_CLIENT_ID?: string;
  FACEBOOK_CLIENT_SECRET?: string;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_PHONE_NUMBER?: string;
  // AWS credentials for deployment
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_REGION?: string;
}

export type Variables = {
  user: schema.User | null;
  db: ReturnType<typeof drizzle>;
  email: EmailService | null;
  logger: Logger;
  metrics: MetricsCollector;
  errorTracker: ErrorTracker;
  requestId: string;
};

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Track server start time for uptime
const startTime = Date.now();

// CORS middleware - allow Pages preview URLs and production domains
app.use("*", cors({
  origin: (origin) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return "https://adele.ayonix.com";
    
    // Allow localhost for development
    if (origin.startsWith("http://localhost:")) return origin;
    
    // Allow all Cloudflare Pages preview URLs
    if (origin.endsWith(".pages.dev")) return origin;
    
    // Allow production domains
    if (origin === "https://adele.ayonix.com" || origin === "https://www.adele.ayonix.com") {
      return origin;
    }
    
    // Default to production domain
    return "https://adele.ayonix.com";
  },
  credentials: true,
  allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
}));

// Initialize services middleware
app.use("*", async (c, next) => {
  // Initialize database
  const db = drizzle(c.env.DB, { schema });
  c.set("db", db);

  // Initialize email service
  const emailService = createEmailService({
    RESEND_API_KEY: c.env.RESEND_API_KEY,
    FROM_EMAIL: c.env.FROM_EMAIL,
    FROM_NAME: c.env.FROM_NAME
  });
  c.set("email", emailService);

  // Initialize monitoring
  const { logger, metrics, errorTracker } = initMonitoring({
    serviceName: "adele-api",
    environment: c.env.ENVIRONMENT || "production",
    sentryDsn: c.env.SENTRY_DSN,
    logLevel: c.env.ENVIRONMENT === "development" ? LogLevel.DEBUG : LogLevel.INFO
  });
  c.set("logger", logger);
  c.set("metrics", metrics);
  c.set("errorTracker", errorTracker);

  // Generate request ID
  const requestId = c.req.header("X-Request-ID") || crypto.randomUUID();
  c.set("requestId", requestId);

  await next();
});

// Request logging middleware
app.use("*", async (c, next) => {
  const logger = c.get("logger");
  const metrics = c.get("metrics");
  const requestId = c.get("requestId");
  const middleware = createRequestMiddleware(logger, metrics);

  const url = new URL(c.req.url);
  const reqMetrics = middleware.onRequest(c.req.raw, undefined);

  // Add request ID to response headers
  c.header("X-Request-ID", requestId);

  try {
    await next();
    middleware.onResponse(reqMetrics, c.res.status);
  } catch (error) {
    if (error instanceof Error) {
      middleware.onError(reqMetrics, error);
    }
    throw error;
  }
});

// Rate limiting for auth endpoints
app.use("/api/auth/*", rateLimiters.auth);
app.use("/api/oauth/*", rateLimiters.auth);

// Rate limiting for expensive operations (AI, chat, voice)
app.use("/api/chat/*", rateLimiters.expensive);
app.use("/api/voice/*", rateLimiters.expensive);
app.use("/api/projects/*/generate", rateLimiters.expensive);

// General API rate limiting
app.use("/api/*", rateLimiters.api);

// Public routes (no auth required)
app.route("/api/auth", authRoutes);
app.route("/api/oauth", oauthRoutes);
app.route("/api/templates", templateRoutes);

// Stripe webhook (no auth, but verified by signature)
app.route("/api/stripe", stripeRoutes);

// Health check endpoint with detailed status
app.get("/api/health", async (c) => {
  const healthCheck = createHealthCheck(
    startTime,
    c.env.VERSION || "1.0.0",
    [
      {
        name: "database",
        check: async () => {
          try {
            const db = c.get("db");
            await db.select().from(schema.users).limit(1);
            return true;
          } catch {
            return false;
          }
        }
      },
      {
        name: "kv",
        check: async () => {
          try {
            await c.env.SESSIONS.get("health-check");
            return true;
          } catch {
            return false;
          }
        }
      },
      {
        name: "r2",
        check: async () => {
          try {
            await c.env.STORAGE.head("health-check");
            return true;
          } catch {
            return false;
          }
        }
      }
    ]
  );
  const status = await healthCheck();
  const httpStatus = status.status === "healthy" ? 200 : status.status === "degraded" ? 200 : 503;

  return c.json(status, httpStatus);
});

// Metrics endpoint (admin only in production)
app.get("/api/metrics", async (c) => {
  const metrics = c.get("metrics");
  
  // In production, require admin auth
  if (c.env.ENVIRONMENT !== "development") {
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    try {
      const { verify } = await import("hono/jwt");
      const token = authHeader.substring(7);
      const payload = await verify(token, c.env.JWT_SECRET);
      
      const db = c.get("db");
      const user = await db.select().from(schema.users).where(eq(schema.users.id, payload.userId as number)).get();
      
      if (!user || user.role !== "admin") {
        return c.json({ error: "Admin access required" }, 403);
      }
    } catch {
      return c.json({ error: "Invalid token" }, 401);
    }
  }

  return c.json({
    timestamp: new Date().toISOString(),
    uptime: Date.now() - startTime,
    ...metrics.getSummary()
  });
});

// Recent logs endpoint (admin only)
app.get("/api/logs", async (c) => {
  const logger = c.get("logger");
  
  // Require admin auth
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const { verify } = await import("hono/jwt");
    const token = authHeader.substring(7);
    const payload = await verify(token, c.env.JWT_SECRET);
    
    const db = c.get("db");
    const user = await db.select().from(schema.users).where(eq(schema.users.id, payload.userId as number)).get();
    
    if (!user || user.role !== "admin") {
      return c.json({ error: "Admin access required" }, 403);
    }
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }

  const count = parseInt(c.req.query("count") || "50", 10);
  return c.json({
    logs: logger.getRecentLogs(Math.min(count, 200))
  });
});

// Recent errors endpoint (admin only)
app.get("/api/errors", async (c) => {
  const errorTracker = c.get("errorTracker");
  
  // Require admin auth
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const { verify } = await import("hono/jwt");
    const token = authHeader.substring(7);
    const payload = await verify(token, c.env.JWT_SECRET);
    
    const db = c.get("db");
    const user = await db.select().from(schema.users).where(eq(schema.users.id, payload.userId as number)).get();
    
    if (!user || user.role !== "admin") {
      return c.json({ error: "Admin access required" }, 403);
    }
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }

  const count = parseInt(c.req.query("count") || "20", 10);
  return c.json({
    errors: errorTracker.getRecentErrors(Math.min(count, 100))
  });
});

// Protected routes middleware
app.use("/api/*", async (c, next) => {
  // Skip auth for public routes
  const path = c.req.path;
  if (
    path.startsWith("/api/auth") || 
    path.startsWith("/api/oauth") ||
    path.startsWith("/api/templates") ||
    path.startsWith("/api/stripe/webhook") ||
    path === "/api/health" ||
    path === "/api/metrics" ||
    path === "/api/logs" ||
    path === "/api/errors"
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
    
    // Update metrics with user context
    const metrics = c.get("metrics");
    metrics.increment("requests.authenticated");
    
    await next();
  } catch (error) {
    const logger = c.get("logger");
    logger.warn("Authentication failed", { error: error instanceof Error ? error.message : "Unknown error" });
    return c.json({ error: "Invalid token" }, 401);
  }
});

// Protected routes - Original
app.route("/api/projects", projectRoutes);
app.route("/api/chat", chatRoutes);
app.route("/api/users", userRoutes);
app.route("/api/admin", adminRoutes);

// Protected routes - New Enterprise Features
app.route("/api/account", accountRoutes);
app.route("/api/usage", usageRoutes);
app.route("/api/billing", billingRoutes);
app.route("/api/work-orders", workOrderRoutes);
app.route("/api/deploy", deployRoutes);
app.route("/api/scheduled-works", scheduledWorksRoutes);
app.route("/api/connectors", connectorsRoutes);
app.route("/api/cloud", cloudRoutes);
app.route("/api/voice", voiceRoutes);
app.route("/api/data", dataControlsRoutes);
app.route("/api/integrations", integrationsRoutes);
app.route("/api/audit", auditRoutes);
app.route("/api/mail", mailRoutes);
app.route("/api/browser", cloudBrowserRoutes);

// 404 handler
app.notFound((c) => {
  const logger = c.get("logger");
  logger.warn("Route not found", { path: c.req.path });
  return c.json({ error: "Not found" }, 404);
});

app.get("/api/health", (c) =>
  c.json({ ok: true, env: c.env.ENVIRONMENT, ts: Date.now() })
);

// Error handler with tracking
app.onError(async (err, c) => {
  const logger = c.get("logger");
  const errorTracker = c.get("errorTracker");
  const metrics = c.get("metrics");
  const requestId = c.get("requestId");

  // Log and track the error
  logger.error("Unhandled error", err, { 
    path: c.req.path, 
    method: c.req.method,
    requestId 
  });
  
  await errorTracker.capture(err, {
    path: c.req.path,
    method: c.req.method,
    requestId
  });

  metrics.increment("errors.unhandled");

  return c.json({ 
    error: "Internal server error",
    requestId,
    message: c.env.ENVIRONMENT === "development" ? err.message : undefined 
  }, 500);
});

export default app;
