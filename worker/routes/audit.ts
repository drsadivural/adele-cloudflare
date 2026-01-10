import { Hono } from "hono";
import { eq, and, desc, gte, like, sql } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { authMiddleware } from "../middleware/auth";
import { Env, Variables } from "../index";

const audit = new Hono<{ Bindings: Env; Variables: Variables }>();

// Apply auth middleware to all routes
audit.use("*", authMiddleware);

// Get audit logs
audit.get("/logs", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const action = c.req.query("action");
  const resource = c.req.query("resource");
  const userId = c.req.query("userId");
  const limit = parseInt(c.req.query("limit") || "100");
  const offset = parseInt(c.req.query("offset") || "0");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Only admins can view all logs, regular users see their own
  let whereClause;
  if (user.role === "admin") {
    whereClause = sql`1=1`;
    if (userId) {
      whereClause = eq(schema.auditLogs.userId, parseInt(userId));
    }
  } else {
    whereClause = eq(schema.auditLogs.userId, user.id);
  }

  if (action) {
    whereClause = and(whereClause, eq(schema.auditLogs.action, action));
  }
  if (resource) {
    whereClause = and(whereClause, eq(schema.auditLogs.resource, resource));
  }

  const logs = await db.query.auditLogs.findMany({
    where: whereClause,
    orderBy: desc(schema.auditLogs.timestamp),
    limit,
    offset,
  });

  // Get user names for admin view
  const enrichedLogs = await Promise.all(
    logs.map(async (log) => {
      let userName = "Unknown";
      if (log.userId) {
        const logUser = await db.query.users.findFirst({
          where: eq(schema.users.id, log.userId),
        });
        userName = logUser?.name || logUser?.email || "Unknown";
      }
      return {
        ...log,
        userName,
        timestamp: log.timestamp?.toISOString(),
      };
    })
  );

  return c.json({ logs: enrichedLogs });
});

// Export audit logs
audit.post("/export", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const storage = c.env.STORAGE;
  const { format, filters } = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Only admins can export all logs
  let whereClause;
  if (user.role === "admin") {
    whereClause = sql`1=1`;
  } else {
    whereClause = eq(schema.auditLogs.userId, user.id);
  }

  // Apply filters
  if (filters?.startDate) {
    whereClause = and(whereClause, gte(schema.auditLogs.timestamp, new Date(filters.startDate)));
  }
  if (filters?.action) {
    whereClause = and(whereClause, eq(schema.auditLogs.action, filters.action));
  }
  if (filters?.resource) {
    whereClause = and(whereClause, eq(schema.auditLogs.resource, filters.resource));
  }

  const logs = await db.query.auditLogs.findMany({
    where: whereClause,
    orderBy: desc(schema.auditLogs.timestamp),
    limit: 10000, // Max export limit
  });

  let content: string;
  let contentType: string;
  let extension: string;

  if (format === "csv") {
    const headers = ["timestamp", "userId", "action", "resource", "resourceId", "details", "ipAddress"];
    const rows = logs.map((log) =>
      [
        log.timestamp?.toISOString(),
        log.userId,
        log.action,
        log.resource,
        log.resourceId,
        `"${(log.details || "").replace(/"/g, '""')}"`,
        log.ipAddress,
      ].join(",")
    );
    content = [headers.join(","), ...rows].join("\n");
    contentType = "text/csv";
    extension = "csv";
  } else {
    content = JSON.stringify(logs, null, 2);
    contentType = "application/json";
    extension = "json";
  }

  // Store in R2
  const key = `audit-exports/${user.id}/${Date.now()}.${extension}`;
  await storage.put(key, content, {
    httpMetadata: { contentType },
  });

  const url = `https://storage.adele.ayonix.com/${key}`;
  return c.json({ url });
});

// Helper function to create audit log (exported for use in other routes)
export async function createAuditLog(
  db: any,
  data: {
    userId: number;
    action: string;
    resource: string;
    resourceId?: string;
    details?: string;
    ipAddress?: string;
    userAgent?: string;
  }
) {
  await db.insert(schema.auditLogs).values({
    userId: data.userId,
    action: data.action,
    resource: data.resource,
    resourceId: data.resourceId,
    details: data.details,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    timestamp: new Date(),
  });
}

export { audit as auditRoutes };
