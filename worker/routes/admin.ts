import { Hono } from "hono";
import { eq, desc, sql, count } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import type { Env, Variables } from "../index";

export const adminRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// Admin middleware
adminRoutes.use("*", async (c, next) => {
  const user = c.get("user");
  if (!user || user.role !== "admin") {
    return c.json({ error: "Admin access required" }, 403);
  }
  await next();
});

// Get dashboard stats
adminRoutes.get("/stats", async (c) => {
  const db = c.get("db");
  
  // User stats
  const totalUsers = await db.select({ count: count() }).from(schema.users).get();
  const activeUsers = await db.select({ count: count() })
    .from(schema.users)
    .where(sql`${schema.users.lastSignedIn} > datetime('now', '-7 days')`)
    .get();
  
  // Project stats
  const totalProjects = await db.select({ count: count() }).from(schema.projects).get();
  const completedProjects = await db.select({ count: count() })
    .from(schema.projects)
    .where(eq(schema.projects.status, "completed"))
    .get();
  
  // Subscription stats
  const freeUsers = await db.select({ count: count() })
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.plan, "free"))
    .get();
  const proUsers = await db.select({ count: count() })
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.plan, "pro"))
    .get();
  const enterpriseUsers = await db.select({ count: count() })
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.plan, "enterprise"))
    .get();
  
  // Template usage
  const templateUsage = await db.select({
    name: schema.appTemplates.name,
    usageCount: schema.appTemplates.usageCount,
  })
    .from(schema.appTemplates)
    .orderBy(desc(schema.appTemplates.usageCount))
    .limit(10);
  
  return c.json({
    users: {
      total: totalUsers?.count || 0,
      activeWeekly: activeUsers?.count || 0,
    },
    projects: {
      total: totalProjects?.count || 0,
      completed: completedProjects?.count || 0,
    },
    subscriptions: {
      free: freeUsers?.count || 0,
      pro: proUsers?.count || 0,
      enterprise: enterpriseUsers?.count || 0,
    },
    topTemplates: templateUsage,
  });
});

// List all users
adminRoutes.get("/users", async (c) => {
  const db = c.get("db");
  const limit = parseInt(c.req.query("limit") || "50");
  const offset = parseInt(c.req.query("offset") || "0");
  
  const users = await db.select({
    id: schema.users.id,
    email: schema.users.email,
    name: schema.users.name,
    role: schema.users.role,
    emailVerified: schema.users.emailVerified,
    createdAt: schema.users.createdAt,
    lastSignedIn: schema.users.lastSignedIn,
  })
    .from(schema.users)
    .orderBy(desc(schema.users.createdAt))
    .limit(limit)
    .offset(offset);
  
  const total = await db.select({ count: count() }).from(schema.users).get();
  
  return c.json({ users, total: total?.count || 0 });
});

// Update user role
adminRoutes.patch("/users/:id/role", async (c) => {
  const db = c.get("db");
  const userId = parseInt(c.req.param("id"));
  const body = await c.req.json();
  
  const { role } = body;
  
  if (!["user", "admin"].includes(role)) {
    return c.json({ error: "Invalid role" }, 400);
  }
  
  await db.update(schema.users)
    .set({ role })
    .where(eq(schema.users.id, userId));
  
  return c.json({ success: true });
});

// Get admin config
adminRoutes.get("/config", async (c) => {
  const db = c.get("db");
  
  const configs = await db.select()
    .from(schema.adminConfig);
  
  // Don't expose encrypted values directly
  return c.json({ 
    configs: configs.map(cfg => ({
      key: cfg.key,
      hasValue: !!cfg.value,
      isEncrypted: cfg.isEncrypted,
      updatedAt: cfg.updatedAt,
    }))
  });
});

// Set admin config
adminRoutes.post("/config", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const body = await c.req.json();
  
  const { key, value, isEncrypted } = body;
  
  if (!key) {
    return c.json({ error: "Key is required" }, 400);
  }
  
  // Check if exists
  const existing = await db.select()
    .from(schema.adminConfig)
    .where(eq(schema.adminConfig.key, key))
    .get();
  
  if (existing) {
    await db.update(schema.adminConfig)
      .set({ 
        value, 
        isEncrypted: isEncrypted || false,
        updatedBy: user?.id,
        updatedAt: new Date(),
      })
      .where(eq(schema.adminConfig.key, key));
  } else {
    await db.insert(schema.adminConfig).values({
      key,
      value,
      isEncrypted: isEncrypted || false,
      updatedBy: user?.id,
    });
  }
  
  return c.json({ success: true });
});

// Delete admin config
adminRoutes.delete("/config/:key", async (c) => {
  const db = c.get("db");
  const key = c.req.param("key");
  
  await db.delete(schema.adminConfig)
    .where(eq(schema.adminConfig.key, key));
  
  return c.json({ success: true });
});

// Get analytics data
adminRoutes.get("/analytics", async (c) => {
  const db = c.get("db");
  const days = parseInt(c.req.query("days") || "30");
  
  // Get events grouped by type
  const eventsByType = await db.select({
    eventType: schema.analyticsEvents.eventType,
    count: count(),
  })
    .from(schema.analyticsEvents)
    .where(sql`${schema.analyticsEvents.createdAt} > datetime('now', '-${days} days')`)
    .groupBy(schema.analyticsEvents.eventType);
  
  // Get daily active users
  const dailyUsers = await db.select({
    date: sql`date(${schema.analyticsEvents.createdAt})`.as("date"),
    uniqueUsers: sql`count(distinct ${schema.analyticsEvents.userId})`.as("uniqueUsers"),
  })
    .from(schema.analyticsEvents)
    .where(sql`${schema.analyticsEvents.createdAt} > datetime('now', '-${days} days')`)
    .groupBy(sql`date(${schema.analyticsEvents.createdAt})`);
  
  return c.json({
    eventsByType,
    dailyUsers,
    period: `${days} days`,
  });
});

// Log analytics event
adminRoutes.post("/analytics/event", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const body = await c.req.json();
  
  const { eventType, eventData, sessionId } = body;
  
  if (!eventType) {
    return c.json({ error: "Event type is required" }, 400);
  }
  
  await db.insert(schema.analyticsEvents).values({
    userId: user?.id,
    eventType,
    eventData: eventData ? JSON.stringify(eventData) : null,
    sessionId,
    userAgent: c.req.header("User-Agent"),
    ipAddress: c.req.header("CF-Connecting-IP") || c.req.header("X-Forwarded-For"),
  });
  
  return c.json({ success: true });
});

// Manage templates
adminRoutes.post("/templates", async (c) => {
  const db = c.get("db");
  const body = await c.req.json();
  
  const { name, description, category, icon, techStack, features, basePrompt, previewImage } = body;
  
  if (!name || !category) {
    return c.json({ error: "Name and category are required" }, 400);
  }
  
  const result = await db.insert(schema.appTemplates).values({
    name,
    description,
    category,
    icon,
    techStack: techStack ? JSON.stringify(techStack) : null,
    features: features ? JSON.stringify(features) : null,
    basePrompt,
    previewImage,
    isActive: true,
  }).returning();
  
  return c.json({ template: result[0] });
});

adminRoutes.patch("/templates/:id", async (c) => {
  const db = c.get("db");
  const templateId = parseInt(c.req.param("id"));
  const body = await c.req.json();
  
  const { name, description, category, icon, techStack, features, basePrompt, previewImage, isActive } = body;
  
  const updateData: any = {};
  
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (category !== undefined) updateData.category = category;
  if (icon !== undefined) updateData.icon = icon;
  if (techStack !== undefined) updateData.techStack = JSON.stringify(techStack);
  if (features !== undefined) updateData.features = JSON.stringify(features);
  if (basePrompt !== undefined) updateData.basePrompt = basePrompt;
  if (previewImage !== undefined) updateData.previewImage = previewImage;
  if (isActive !== undefined) updateData.isActive = isActive;
  
  const result = await db.update(schema.appTemplates)
    .set(updateData)
    .where(eq(schema.appTemplates.id, templateId))
    .returning();
  
  return c.json({ template: result[0] });
});

adminRoutes.delete("/templates/:id", async (c) => {
  const db = c.get("db");
  const templateId = parseInt(c.req.param("id"));
  
  await db.delete(schema.appTemplates)
    .where(eq(schema.appTemplates.id, templateId));
  
  return c.json({ success: true });
});
