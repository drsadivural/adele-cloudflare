import { Hono } from "hono";
import { eq, and, desc } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { authMiddleware } from "../middleware/auth";
import { Env, Variables } from "../index";

const connectors = new Hono<{ Bindings: Env; Variables: Variables }>();

// Apply auth middleware to all routes
connectors.use("*", authMiddleware);

// List user's connectors
connectors.get("/", async (c) => {
  const user = c.get("user");
  const db = c.get("db");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const userConnectors = await db.query.connectors.findMany({
    where: eq(schema.connectors.userId, user.id),
    orderBy: desc(schema.connectors.createdAt),
  });

  return c.json({ connectors: userConnectors });
});

// Get single connector
connectors.get("/:id", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const connector = await db.query.connectors.findFirst({
    where: and(
      eq(schema.connectors.id, id),
      eq(schema.connectors.userId, user.id)
    ),
  });

  if (!connector) {
    return c.json({ error: "Connector not found" }, 404);
  }

  return c.json({ connector });
});

// Create connector
connectors.post("/", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const body = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Encrypt sensitive config data
  const encryptedConfig = encryptConfig(body.config);

  const [connector] = await db
    .insert(schema.connectors)
    .values({
      userId: user.id,
      name: body.name,
      type: body.type,
      provider: body.provider,
      status: "pending",
      config: encryptedConfig,
    })
    .returning();

  // Test connection
  const testResult = await testConnection(body.provider, body.config);
  
  await db
    .update(schema.connectors)
    .set({
      status: testResult.success ? "connected" : "error",
      lastSyncAt: testResult.success ? new Date() : null,
    })
    .where(eq(schema.connectors.id, connector.id));

  return c.json({
    connector: {
      ...connector,
      status: testResult.success ? "connected" : "error",
    },
  });
});

// Update connector
connectors.patch("/:id", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const existing = await db.query.connectors.findFirst({
    where: and(
      eq(schema.connectors.id, id),
      eq(schema.connectors.userId, user.id)
    ),
  });

  if (!existing) {
    return c.json({ error: "Connector not found" }, 404);
  }

  const encryptedConfig = body.config ? encryptConfig(body.config) : existing.config;

  const [connector] = await db
    .update(schema.connectors)
    .set({
      name: body.name ?? existing.name,
      config: encryptedConfig,
      updatedAt: new Date(),
    })
    .where(eq(schema.connectors.id, id))
    .returning();

  return c.json({ connector });
});

// Delete connector
connectors.delete("/:id", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await db
    .delete(schema.connectors)
    .where(
      and(
        eq(schema.connectors.id, id),
        eq(schema.connectors.userId, user.id)
      )
    );

  return c.json({ success: true });
});

// Test connector
connectors.post("/:id/test", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const connector = await db.query.connectors.findFirst({
    where: and(
      eq(schema.connectors.id, id),
      eq(schema.connectors.userId, user.id)
    ),
  });

  if (!connector) {
    return c.json({ error: "Connector not found" }, 404);
  }

  const config = decryptConfig(connector.config);
  const result = await testConnection(connector.provider, config);

  await db
    .update(schema.connectors)
    .set({
      status: result.success ? "connected" : "error",
      lastSyncAt: result.success ? new Date() : connector.lastSyncAt,
    })
    .where(eq(schema.connectors.id, id));

  return c.json(result);
});

// Sync connector
connectors.post("/:id/sync", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const connector = await db.query.connectors.findFirst({
    where: and(
      eq(schema.connectors.id, id),
      eq(schema.connectors.userId, user.id)
    ),
  });

  if (!connector) {
    return c.json({ error: "Connector not found" }, 404);
  }

  // TODO: Implement actual sync logic based on connector type
  // This would involve fetching data from the external service

  await db
    .update(schema.connectors)
    .set({
      status: "syncing",
    })
    .where(eq(schema.connectors.id, id));

  // Simulate sync completion
  setTimeout(async () => {
    await db
      .update(schema.connectors)
      .set({
        status: "connected",
        lastSyncAt: new Date(),
      })
      .where(eq(schema.connectors.id, id));
  }, 3000);

  return c.json({ success: true });
});

// Get OAuth URL for a provider
connectors.get("/oauth/:provider", async (c) => {
  const user = c.get("user");
  const provider = c.req.param("provider");
  const env = c.env;

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const oauthConfigs: Record<string, { authUrl: string; clientId: string | undefined }> = {
    google: {
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      clientId: env.GOOGLE_CLIENT_ID,
    },
    microsoft: {
      authUrl: `https://login.microsoftonline.com/${env.MICROSOFT_TENANT_ID || "common"}/oauth2/v2.0/authorize`,
      clientId: env.MICROSOFT_CLIENT_ID,
    },
    github: {
      authUrl: "https://github.com/login/oauth/authorize",
      clientId: env.GITHUB_CLIENT_ID,
    },
    slack: {
      authUrl: "https://slack.com/oauth/v2/authorize",
      clientId: undefined, // Would need SLACK_CLIENT_ID
    },
  };

  const config = oauthConfigs[provider];
  if (!config || !config.clientId) {
    return c.json({ error: "Provider not configured" }, 400);
  }

  const state = Buffer.from(JSON.stringify({
    userId: user.id,
    provider,
    timestamp: Date.now(),
  })).toString("base64");

  const redirectUri = `${env.APP_URL}/api/connectors/oauth/callback`;
  
  const scopes: Record<string, string> = {
    google: "https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/calendar.readonly",
    microsoft: "Files.Read.All Calendars.Read User.Read",
    github: "repo read:user",
    slack: "channels:read chat:write",
  };

  const url = new URL(config.authUrl);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scopes[provider] || "");
  url.searchParams.set("state", state);

  return c.json({ url: url.toString() });
});

// OAuth callback
connectors.get("/oauth/callback", async (c) => {
  const db = c.get("db");
  const code = c.req.query("code");
  const state = c.req.query("state");

  if (!code || !state) {
    return c.json({ error: "Missing code or state" }, 400);
  }

  try {
    const stateData = JSON.parse(Buffer.from(state, "base64").toString());
    const { userId, provider } = stateData;

    // TODO: Exchange code for tokens
    // This would involve calling the provider's token endpoint

    // Create connector with tokens
    await db.insert(schema.connectors).values({
      userId,
      name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Connection`,
      type: "oauth",
      provider,
      status: "connected",
      config: JSON.stringify({ accessToken: "xxx", refreshToken: "xxx" }),
      lastSyncAt: new Date(),
    });

    // Redirect back to app
    return c.redirect(`${c.env.APP_URL}/connectors?success=true`);
  } catch (error) {
    return c.json({ error: "Invalid state" }, 400);
  }
});

// Helper functions
function encryptConfig(config: object): string {
  // In production, use proper encryption
  return JSON.stringify(config);
}

function decryptConfig(config: string | null): object {
  if (!config) return {};
  try {
    return JSON.parse(config);
  } catch {
    return {};
  }
}

async function testConnection(provider: string | null, config: object): Promise<{ success: boolean; message: string }> {
  // TODO: Implement actual connection testing for each provider
  // For now, return success
  return { success: true, message: "Connection successful" };
}

export { connectors as connectorsRoutes };
