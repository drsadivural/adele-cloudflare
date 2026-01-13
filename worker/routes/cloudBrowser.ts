import { Hono } from "hono";
import { eq, and, desc } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { authMiddleware } from "../middleware/auth";
import { Env, Variables } from "../index";

const cloudBrowser = new Hono<{ Bindings: Env; Variables: Variables }>();

// Apply auth middleware to all routes
cloudBrowser.use("*", authMiddleware);

// Get all browser sessions
cloudBrowser.get("/sessions", async (c) => {
  const user = c.get("user");
  const db = c.get("db");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const sessions = await db.query.browserSessions.findMany({
    where: eq(schema.browserSessions.userId, user.id),
    orderBy: desc(schema.browserSessions.createdAt),
  });

  return c.json({
    sessions: sessions.map((s) => ({
      id: s.id.toString(),
      name: s.name,
      status: s.status,
      resolution: s.resolution,
      currentUrl: s.currentUrl,
      profileId: s.profileId,
      createdAt: s.createdAt?.toISOString(),
      expiresAt: s.expiresAt?.toISOString(),
    })),
  });
});

// Get single browser session
cloudBrowser.get("/sessions/:id", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const session = await db.query.browserSessions.findFirst({
    where: and(
      eq(schema.browserSessions.id, id),
      eq(schema.browserSessions.userId, user.id)
    ),
  });

  if (!session) {
    return c.json({ error: "Session not found" }, 404);
  }

  return c.json({
    session: {
      id: session.id.toString(),
      name: session.name,
      status: session.status,
      resolution: session.resolution,
      currentUrl: session.currentUrl,
      profileId: session.profileId,
      createdAt: session.createdAt?.toISOString(),
      expiresAt: session.expiresAt?.toISOString(),
    },
  });
});

// Create browser session
cloudBrowser.post("/sessions", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const body = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Set expiry to 24 hours from now
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  const [session] = await db
    .insert(schema.browserSessions)
    .values({
      userId: user.id,
      name: body.name || `Session ${Date.now()}`,
      status: "active",
      resolution: body.resolution || "1920x1080",
      currentUrl: body.startUrl || "about:blank",
      profileId: body.profileId,
      expiresAt,
    })
    .returning();

  // Generate a connection URL (in production, this would connect to actual browser service)
  const connectUrl = `wss://browser.adele.ayonix.com/session/${session.id}`;

  return c.json({
    session: {
      id: session.id.toString(),
      name: session.name,
      status: session.status,
      resolution: session.resolution,
      currentUrl: session.currentUrl,
      createdAt: session.createdAt?.toISOString(),
      expiresAt: session.expiresAt?.toISOString(),
    },
    connectUrl,
  });
});

// Update browser session
cloudBrowser.patch("/sessions/:id", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const existing = await db.query.browserSessions.findFirst({
    where: and(
      eq(schema.browserSessions.id, id),
      eq(schema.browserSessions.userId, user.id)
    ),
  });

  if (!existing) {
    return c.json({ error: "Session not found" }, 404);
  }

  await db
    .update(schema.browserSessions)
    .set({
      name: body.name ?? existing.name,
      currentUrl: body.currentUrl ?? existing.currentUrl,
      status: body.status ?? existing.status,
      updatedAt: new Date(),
    })
    .where(eq(schema.browserSessions.id, id));

  return c.json({ success: true });
});

// Delete browser session
cloudBrowser.delete("/sessions/:id", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await db
    .delete(schema.browserSessions)
    .where(
      and(
        eq(schema.browserSessions.id, id),
        eq(schema.browserSessions.userId, user.id)
      )
    );

  return c.json({ success: true });
});

// Take screenshot of session
cloudBrowser.post("/sessions/:id/screenshot", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const storage = c.env.STORAGE;
  const id = parseInt(c.req.param("id"));

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const session = await db.query.browserSessions.findFirst({
    where: and(
      eq(schema.browserSessions.id, id),
      eq(schema.browserSessions.userId, user.id)
    ),
  });

  if (!session) {
    return c.json({ error: "Session not found" }, 404);
  }

  // TODO: Actually capture screenshot from browser service
  // For now, return a placeholder

  const screenshotKey = `screenshots/${user.id}/${id}/${Date.now()}.png`;
  const screenshotUrl = `https://storage.adele.ayonix.com/${screenshotKey}`;

  return c.json({
    success: true,
    screenshotUrl,
    timestamp: new Date().toISOString(),
  });
});

// Navigate session to URL
cloudBrowser.post("/sessions/:id/navigate", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));
  const { url } = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const session = await db.query.browserSessions.findFirst({
    where: and(
      eq(schema.browserSessions.id, id),
      eq(schema.browserSessions.userId, user.id)
    ),
  });

  if (!session) {
    return c.json({ error: "Session not found" }, 404);
  }

  // Update current URL
  await db
    .update(schema.browserSessions)
    .set({
      currentUrl: url,
      updatedAt: new Date(),
    })
    .where(eq(schema.browserSessions.id, id));

  // TODO: Actually navigate in browser service

  return c.json({ success: true, url });
});

// Get browser profiles
cloudBrowser.get("/profiles", async (c) => {
  const user = c.get("user");
  const db = c.get("db");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const profiles = await db.query.browserProfiles.findMany({
    where: eq(schema.browserProfiles.userId, user.id),
    orderBy: desc(schema.browserProfiles.createdAt),
  });

  return c.json({
    profiles: profiles.map((p) => ({
      id: p.id,
      name: p.name,
      userAgent: p.userAgent,
      viewport: p.viewport,
      locale: p.locale,
      timezone: p.timezone,
      isDefault: p.isDefault,
      createdAt: p.createdAt?.toISOString(),
    })),
  });
});

// Create browser profile
cloudBrowser.post("/profiles", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const body = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const [profile] = await db
    .insert(schema.browserProfiles)
    .values({
      userId: user.id,
      name: body.name,
      userAgent: body.userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      viewport: body.viewport || "1920x1080",
      locale: body.locale || "en-US",
      timezone: body.timezone || "UTC",
      isDefault: body.isDefault || false,
    })
    .returning();

  return c.json({
    profile: {
      id: profile.id,
      name: profile.name,
      userAgent: profile.userAgent,
      viewport: profile.viewport,
      locale: profile.locale,
      timezone: profile.timezone,
      isDefault: profile.isDefault,
      createdAt: profile.createdAt?.toISOString(),
    },
  });
});

// Update browser profile
cloudBrowser.patch("/profiles/:id", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const existing = await db.query.browserProfiles.findFirst({
    where: and(
      eq(schema.browserProfiles.id, id),
      eq(schema.browserProfiles.userId, user.id)
    ),
  });

  if (!existing) {
    return c.json({ error: "Profile not found" }, 404);
  }

  await db
    .update(schema.browserProfiles)
    .set({
      name: body.name ?? existing.name,
      userAgent: body.userAgent ?? existing.userAgent,
      viewport: body.viewport ?? existing.viewport,
      locale: body.locale ?? existing.locale,
      timezone: body.timezone ?? existing.timezone,
      isDefault: body.isDefault ?? existing.isDefault,
      updatedAt: new Date(),
    })
    .where(eq(schema.browserProfiles.id, id));

  return c.json({ success: true });
});

// Delete browser profile
cloudBrowser.delete("/profiles/:id", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await db
    .delete(schema.browserProfiles)
    .where(
      and(
        eq(schema.browserProfiles.id, id),
        eq(schema.browserProfiles.userId, user.id)
      )
    );

  return c.json({ success: true });
});

// Get session history
cloudBrowser.get("/sessions/:id/history", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const session = await db.query.browserSessions.findFirst({
    where: and(
      eq(schema.browserSessions.id, id),
      eq(schema.browserSessions.userId, user.id)
    ),
  });

  if (!session) {
    return c.json({ error: "Session not found" }, 404);
  }

  // TODO: Get actual browsing history from browser service
  return c.json({
    history: [],
  });
});

// Execute action in session
cloudBrowser.post("/sessions/:id/action", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));
  const { action, params } = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const session = await db.query.browserSessions.findFirst({
    where: and(
      eq(schema.browserSessions.id, id),
      eq(schema.browserSessions.userId, user.id)
    ),
  });

  if (!session) {
    return c.json({ error: "Session not found" }, 404);
  }

  // TODO: Execute action in browser service
  // Actions: click, type, scroll, wait, etc.

  return c.json({
    success: true,
    action,
    result: null,
  });
});

export { cloudBrowser as cloudBrowserRoutes };
