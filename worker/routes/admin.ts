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
  // Use updated_at instead of lastSignedIn since that column doesn't exist
  const activeUsers = await db.select({ count: count() })
    .from(schema.users)
    .where(sql`${schema.users.updatedAt} > datetime('now', '-7 days')`)
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
  
  // Return in format expected by frontend
  return c.json({
    totalUsers: totalUsers?.count || 0,
    totalProjects: totalProjects?.count || 0,
    activeSubscriptions: (proUsers?.count || 0) + (enterpriseUsers?.count || 0),
    monthlyRevenue: ((proUsers?.count || 0) * 29) + ((enterpriseUsers?.count || 0) * 99),
    // Also include detailed stats for other uses
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
  
  // Only select columns that exist in the actual database
  // Actual columns: id, email, password, name, role, phone, company, position, face_embedding, voice_embedding, created_at, updated_at
  const users = await db.select({
    id: schema.users.id,
    email: schema.users.email,
    name: schema.users.name,
    role: schema.users.role,
    phone: schema.users.phone,
    company: schema.users.company,
    position: schema.users.position,
    createdAt: schema.users.createdAt,
    updatedAt: schema.users.updatedAt,
  })
    .from(schema.users)
    .orderBy(desc(schema.users.createdAt))
    .limit(limit)
    .offset(offset);
  
  const total = await db.select({ count: count() }).from(schema.users).get();
  
  return c.json({ users, total: total?.count || 0 });
});

// SHA-256 hash function for password hashing (matching auth.ts)
async function hashPasswordSHA256(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

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
    .set({ role, updatedAt: new Date() })
    .where(eq(schema.users.id, userId));
  
  return c.json({ success: true });
});

// Update user (full update)
adminRoutes.put("/users/:id", async (c) => {
  const db = c.get("db");
  const userId = parseInt(c.req.param("id"));
  const body = await c.req.json();
  
  const { name, email, role, phone, company, position } = body;
  
  // Validate role if provided
  if (role && !["user", "admin"].includes(role)) {
    return c.json({ error: "Invalid role" }, 400);
  }
  
  // Check if email is already taken by another user
  if (email) {
    const existingUser = await db.select()
      .from(schema.users)
      .where(eq(schema.users.email, email.toLowerCase()))
      .get();
    
    if (existingUser && existingUser.id !== userId) {
      return c.json({ error: "Email already in use" }, 400);
    }
  }
  
  const updateData: any = { updatedAt: new Date() };
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email.toLowerCase();
  if (role !== undefined) updateData.role = role;
  if (phone !== undefined) updateData.phone = phone;
  if (company !== undefined) updateData.company = company;
  if (position !== undefined) updateData.position = position;
  
  await db.update(schema.users)
    .set(updateData)
    .where(eq(schema.users.id, userId));
  
  // Get updated user
  const updatedUser = await db.select({
    id: schema.users.id,
    email: schema.users.email,
    name: schema.users.name,
    role: schema.users.role,
    phone: schema.users.phone,
    company: schema.users.company,
    position: schema.users.position,
    createdAt: schema.users.createdAt,
    updatedAt: schema.users.updatedAt,
  })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .get();
  
  return c.json({ success: true, user: updatedUser });
});

// Change user password
adminRoutes.put("/users/:id/password", async (c) => {
  const db = c.get("db");
  const userId = parseInt(c.req.param("id"));
  const body = await c.req.json();
  
  const { password } = body;
  
  if (!password || password.length < 6) {
    return c.json({ error: "Password must be at least 6 characters" }, 400);
  }
  
  // Hash password using SHA-256 (matching auth.ts)
  const passwordHash = await hashPasswordSHA256(password);
  
  await db.update(schema.users)
    .set({ password: passwordHash, updatedAt: new Date() })
    .where(eq(schema.users.id, userId));
  
  return c.json({ success: true });
});

// Delete user
adminRoutes.delete("/users/:id", async (c) => {
  const db = c.get("db");
  const userId = parseInt(c.req.param("id"));
  const currentUser = c.get("user");
  
  // Prevent admin from deleting themselves
  if (currentUser && currentUser.id === userId) {
    return c.json({ error: "Cannot delete your own account" }, 400);
  }
  
  // Check if user exists
  const user = await db.select()
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .get();
  
  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }
  
  // Delete user
  await db.delete(schema.users)
    .where(eq(schema.users.id, userId));
  
  return c.json({ success: true });
});

// Save API keys configuration
adminRoutes.post("/config/api-keys", async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const body = await c.req.json();
  
  const { key, value } = body;
  
  if (!key || !value) {
    return c.json({ error: "Key and value are required" }, 400);
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
        isEncrypted: true,
        updatedBy: user?.id,
        updatedAt: new Date(),
      })
      .where(eq(schema.adminConfig.key, key));
  } else {
    await db.insert(schema.adminConfig).values({
      key,
      value,
      isEncrypted: true,
      updatedBy: user?.id,
    });
  }
  
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

// Get API configurations
adminRoutes.get("/api-configs", async (c) => {
  const db = c.get("db");
  
  try {
    const configs = await db.select()
      .from(schema.adminConfig);
    
    // Convert to object format and mask secrets
    const configMap: Record<string, Record<string, string>> = {};
    for (const config of configs) {
      const [apiId, ...keyParts] = config.key.split("_");
      const fieldKey = keyParts.join("_");
      
      if (!configMap[apiId]) {
        configMap[apiId] = {};
      }
      // Mask secret values
      const value = config.isEncrypted && config.value 
        ? config.value.substring(0, 4) + "..." + config.value.substring(config.value.length - 4)
        : config.value || "";
      configMap[apiId][config.key] = value;
    }
    
    return c.json(configMap);
  } catch (error) {
    console.error("Failed to get API configs:", error);
    return c.json({ error: "Failed to get configs" }, 500);
  }
});

// Save API configuration
adminRoutes.post("/api-configs", async (c) => {
  const db = c.get("db");
  const user = c.get("user")!;
  const { apiId, config } = await c.req.json();
  
  if (!apiId || !config) {
    return c.json({ error: "Missing apiId or config" }, 400);
  }
  
  try {
    // Determine which fields are secrets
    const secretFields = [
      "API_KEY", "SECRET", "TOKEN", "PASSWORD", "PRIVATE_KEY", "CLIENT_SECRET",
      "AUTH_TOKEN", "WEBHOOK_SECRET", "DSN"
    ];
    
    for (const [key, value] of Object.entries(config)) {
      if (typeof value !== "string") continue;
      
      const isSecret = secretFields.some(sf => key.toUpperCase().includes(sf));
      const fullKey = `${apiId}_${key}`;
      
      // Check if config exists
      const existing = await db.select()
        .from(schema.adminConfig)
        .where(eq(schema.adminConfig.key, fullKey))
        .get();
      
      if (existing) {
        // Only update if value changed (not masked)
        if (!value.includes("...")) {
          await db.update(schema.adminConfig)
            .set({ 
              value, 
              isEncrypted: isSecret,
              updatedAt: new Date(),
              updatedBy: user.id 
            })
            .where(eq(schema.adminConfig.id, existing.id));
        }
      } else {
        await db.insert(schema.adminConfig).values({
          key: fullKey,
          value,
          isEncrypted: isSecret,
          updatedBy: user.id,
        });
      }
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to save API config:", error);
    return c.json({ error: "Failed to save config" }, 500);
  }
});

// Test API connection
adminRoutes.post("/test-api/:provider", async (c) => {
  const provider = c.req.param("provider");
  const { config } = await c.req.json();
  
  try {
    switch (provider) {
      case "resend": {
        const apiKey = config?.RESEND_API_KEY;
        if (!apiKey || apiKey.includes("...")) {
          return c.json({ success: false, message: "API key is required" }, 400);
        }
        
        const response = await fetch("https://api.resend.com/domains", {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        
        if (response.ok) {
          return c.json({ success: true, message: "Resend API connection successful!" });
        } else {
          const error = await response.json();
          return c.json({ success: false, message: `Resend API error: ${(error as any).message || "Unknown error"}` });
        }
      }
      
      case "openai": {
        const apiKey = config?.OPENAI_API_KEY;
        if (!apiKey || apiKey.includes("...")) {
          return c.json({ success: false, message: "API key is required" }, 400);
        }
        
        const response = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        
        if (response.ok) {
          return c.json({ success: true, message: "OpenAI API connection successful!" });
        } else {
          const error = await response.json();
          return c.json({ success: false, message: `OpenAI API error: ${(error as any).error?.message || "Unknown error"}` });
        }
      }
      
      case "anthropic": {
        const apiKey = config?.ANTHROPIC_API_KEY;
        if (!apiKey || apiKey.includes("...")) {
          return c.json({ success: false, message: "API key is required" }, 400);
        }
        
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-3-haiku-20240307",
            max_tokens: 10,
            messages: [{ role: "user", content: "Hi" }],
          }),
        });
        
        if (response.ok) {
          return c.json({ success: true, message: "Anthropic API connection successful!" });
        } else {
          const error = await response.json();
          return c.json({ success: false, message: `Anthropic API error: ${(error as any).error?.message || "Unknown error"}` });
        }
      }
      
      case "stripe": {
        const secretKey = config?.STRIPE_SECRET_KEY;
        if (!secretKey || secretKey.includes("...")) {
          return c.json({ success: false, message: "Secret key is required" }, 400);
        }
        
        const response = await fetch("https://api.stripe.com/v1/balance", {
          headers: { Authorization: `Bearer ${secretKey}` },
        });
        
        if (response.ok) {
          return c.json({ success: true, message: "Stripe API connection successful!" });
        } else {
          const error = await response.json();
          return c.json({ success: false, message: `Stripe API error: ${(error as any).error?.message || "Unknown error"}` });
        }
      }
      
      case "elevenlabs": {
        const apiKey = config?.ELEVENLABS_API_KEY;
        if (!apiKey || apiKey.includes("...")) {
          return c.json({ success: false, message: "API key is required" }, 400);
        }
        
        const response = await fetch("https://api.elevenlabs.io/v1/user", {
          headers: { "xi-api-key": apiKey },
        });
        
        if (response.ok) {
          return c.json({ success: true, message: "ElevenLabs API connection successful!" });
        } else {
          return c.json({ success: false, message: "ElevenLabs API connection failed" });
        }
      }
      
      case "database": {
        const dbUrl = config?.DATABASE_URL;
        if (!dbUrl || dbUrl.includes("...")) {
          return c.json({ success: false, message: "Database URL is required" }, 400);
        }
        
        // For security, we just validate the URL format
        try {
          new URL(dbUrl.replace(/^(postgresql|mysql|mongodb):/, "http:"));
          return c.json({ success: true, message: "Database URL format is valid. Connection test requires deployment." });
        } catch {
          return c.json({ success: false, message: "Invalid database URL format" });
        }
      }
      
      default:
        return c.json({ success: false, message: `Unknown provider: ${provider}` }, 400);
    }
  } catch (error) {
    console.error(`Failed to test ${provider} API:`, error);
    return c.json({ 
      success: false, 
      message: error instanceof Error ? error.message : "Connection test failed" 
    }, 500);
  }
});
