import { Hono } from "hono";
import { eq, and, desc } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { authMiddleware } from "../middleware/auth";
import { Env, Variables } from "../index";

const cloud = new Hono<{ Bindings: Env; Variables: Variables }>();

// Apply auth middleware to all routes
cloud.use("*", authMiddleware);

// List cloud accounts
cloud.get("/accounts", async (c) => {
  const user = c.get("user");
  const db = c.get("db");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const accounts = await db.query.cloudAccounts.findMany({
    where: eq(schema.cloudAccounts.userId, user.id),
    orderBy: desc(schema.cloudAccounts.createdAt),
  });

  // Get resource counts for each account
  const accountsWithResources = await Promise.all(
    accounts.map(async (account) => {
      const resources = await db.query.cloudResources.findMany({
        where: eq(schema.cloudResources.accountId, account.id),
      });

      const resourceCounts = {
        compute: resources.filter((r) => ["ec2", "vm", "compute"].includes(r.type || "")).length,
        storage: resources.filter((r) => ["s3", "blob", "storage"].includes(r.type || "")).length,
        databases: resources.filter((r) => ["rds", "sql", "database"].includes(r.type || "")).length,
        functions: resources.filter((r) => ["lambda", "function"].includes(r.type || "")).length,
      };

      return {
        ...account,
        resources: resourceCounts,
      };
    })
  );

  return c.json({ accounts: accountsWithResources });
});

// Connect cloud account
cloud.post("/accounts", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const body = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Validate credentials based on provider
  const validationResult = await validateCloudCredentials(body.provider, body.credentials);
  if (!validationResult.success) {
    return c.json({ error: validationResult.message }, 400);
  }

  // Encrypt credentials
  const encryptedCredentials = encryptCredentials(body.credentials);

  const [account] = await db
    .insert(schema.cloudAccounts)
    .values({
      userId: user.id,
      provider: body.provider,
      name: body.name,
      accountId: validationResult.accountId || "unknown",
      region: body.region,
      status: "connected",
      credentials: encryptedCredentials,
      lastSyncAt: new Date(),
    })
    .returning();

  // Trigger initial resource sync
  syncCloudResources(db, account.id, body.provider, body.credentials, body.region);

  return c.json({ account });
});

// Disconnect cloud account
cloud.delete("/accounts/:id", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Delete associated resources first
  await db
    .delete(schema.cloudResources)
    .where(eq(schema.cloudResources.accountId, id));

  await db
    .delete(schema.cloudAccounts)
    .where(
      and(
        eq(schema.cloudAccounts.id, id),
        eq(schema.cloudAccounts.userId, user.id)
      )
    );

  return c.json({ success: true });
});

// Sync cloud account
cloud.post("/accounts/:id/sync", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const account = await db.query.cloudAccounts.findFirst({
    where: and(
      eq(schema.cloudAccounts.id, id),
      eq(schema.cloudAccounts.userId, user.id)
    ),
  });

  if (!account) {
    return c.json({ error: "Account not found" }, 404);
  }

  // Update status to syncing
  await db
    .update(schema.cloudAccounts)
    .set({ status: "syncing" })
    .where(eq(schema.cloudAccounts.id, id));

  // Decrypt credentials and sync
  const credentials = decryptCredentials(account.credentials);
  syncCloudResources(db, id, account.provider, credentials, account.region);

  return c.json({ success: true });
});

// Initiate OAuth for Azure
cloud.get("/oauth/:provider", async (c) => {
  const user = c.get("user");
  const provider = c.req.param("provider");
  const env = c.env;

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (provider !== "azure") {
    return c.json({ error: "OAuth only supported for Azure" }, 400);
  }

  const clientId = env.MICROSOFT_CLIENT_ID;
  const tenantId = env.MICROSOFT_TENANT_ID || "common";

  if (!clientId) {
    return c.json({ error: "Azure not configured" }, 500);
  }

  const state = Buffer.from(JSON.stringify({
    userId: user.id,
    provider: "azure",
    timestamp: Date.now(),
  })).toString("base64");

  const redirectUri = `${env.APP_URL}/api/cloud/oauth/callback`;
  const scope = "https://management.azure.com/.default offline_access";

  const authUrl = new URL(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("state", state);

  return c.json({ authUrl: authUrl.toString() });
});

// Get resources for an account
cloud.get("/accounts/:id/resources", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));
  const type = c.req.query("type");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const account = await db.query.cloudAccounts.findFirst({
    where: and(
      eq(schema.cloudAccounts.id, id),
      eq(schema.cloudAccounts.userId, user.id)
    ),
  });

  if (!account) {
    return c.json({ error: "Account not found" }, 404);
  }

  let whereClause = eq(schema.cloudResources.accountId, id);
  if (type) {
    whereClause = and(whereClause, eq(schema.cloudResources.type, type)) as any;
  }

  const resources = await db.query.cloudResources.findMany({
    where: whereClause,
    orderBy: desc(schema.cloudResources.createdAt),
  });

  return c.json({ resources });
});

// Resource action (start/stop/restart)
cloud.post("/resources/:resourceId/:action", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const resourceId = c.req.param("resourceId");
  const action = c.req.param("action");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (!["start", "stop", "restart"].includes(action)) {
    return c.json({ error: "Invalid action" }, 400);
  }

  const resource = await db.query.cloudResources.findFirst({
    where: eq(schema.cloudResources.resourceId, resourceId),
  });

  if (!resource) {
    return c.json({ error: "Resource not found" }, 404);
  }

  // Verify user owns the account
  const account = await db.query.cloudAccounts.findFirst({
    where: and(
      eq(schema.cloudAccounts.id, resource.accountId),
      eq(schema.cloudAccounts.userId, user.id)
    ),
  });

  if (!account) {
    return c.json({ error: "Not authorized" }, 403);
  }

  // TODO: Implement actual cloud provider API calls
  // For now, simulate the action
  const newStatus = action === "stop" ? "stopped" : "running";

  await db
    .update(schema.cloudResources)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(schema.cloudResources.resourceId, resourceId));

  return c.json({ success: true });
});

// Get costs for an account
cloud.get("/accounts/:id/costs", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));
  const period = c.req.query("period") || "month";

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const account = await db.query.cloudAccounts.findFirst({
    where: and(
      eq(schema.cloudAccounts.id, id),
      eq(schema.cloudAccounts.userId, user.id)
    ),
  });

  if (!account) {
    return c.json({ error: "Account not found" }, 404);
  }

  // TODO: Fetch actual costs from cloud provider
  // For now, return mock data
  const costs = generateMockCosts(period);

  return c.json({ costs });
});

// Helper functions
async function validateCloudCredentials(
  provider: string,
  credentials: any
): Promise<{ success: boolean; message?: string; accountId?: string }> {
  // TODO: Implement actual validation for each provider
  // AWS: Use STS GetCallerIdentity
  // Azure: Use Resource Manager API
  // GCP: Use IAM API
  // Oracle: Use Identity API

  if (provider === "aws") {
    if (!credentials.accessKeyId || !credentials.secretAccessKey) {
      return { success: false, message: "Missing AWS credentials" };
    }
    // Mock validation
    return { success: true, accountId: "123456789012" };
  }

  if (provider === "azure") {
    // Azure uses OAuth, so credentials would be tokens
    return { success: true, accountId: "subscription-id" };
  }

  if (provider === "gcp" || provider === "oracle") {
    if (!credentials.serviceAccount) {
      return { success: false, message: "Missing service account JSON" };
    }
    return { success: true, accountId: "project-id" };
  }

  return { success: false, message: "Unknown provider" };
}

function encryptCredentials(credentials: any): string {
  // In production, use proper encryption (e.g., AES-256-GCM)
  return JSON.stringify(credentials);
}

function decryptCredentials(encrypted: string | null): any {
  if (!encrypted) return {};
  try {
    return JSON.parse(encrypted);
  } catch {
    return {};
  }
}

async function syncCloudResources(
  db: any,
  accountId: number,
  provider: string | null,
  credentials: any,
  region: string | null
) {
  // TODO: Implement actual resource discovery for each provider
  // For now, insert mock resources

  const mockResources = [
    {
      accountId,
      resourceId: `${provider}-${Date.now()}-1`,
      type: provider === "aws" ? "ec2" : provider === "azure" ? "vm" : "compute",
      name: "web-server-1",
      status: "running",
      region: region || "us-east-1",
      details: JSON.stringify({ instanceType: "t3.medium" }),
      cost: 45.5,
    },
    {
      accountId,
      resourceId: `${provider}-${Date.now()}-2`,
      type: provider === "aws" ? "s3" : provider === "azure" ? "blob" : "storage",
      name: "app-storage",
      status: "available",
      region: region || "us-east-1",
      details: JSON.stringify({ size: "50GB" }),
      cost: 5.0,
    },
  ];

  // Clear existing resources
  await db
    .delete(schema.cloudResources)
    .where(eq(schema.cloudResources.accountId, accountId));

  // Insert new resources
  for (const resource of mockResources) {
    await db.insert(schema.cloudResources).values(resource);
  }

  // Update account status
  await db
    .update(schema.cloudAccounts)
    .set({ status: "connected", lastSyncAt: new Date() })
    .where(eq(schema.cloudAccounts.id, accountId));
}

function generateMockCosts(period: string) {
  const days = period === "week" ? 7 : period === "year" ? 365 : 30;
  const costs = [];

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    costs.push({
      date: date.toISOString().split("T")[0],
      service: "Compute",
      amount: Math.random() * 50 + 10,
      currency: "USD",
    });
    costs.push({
      date: date.toISOString().split("T")[0],
      service: "Storage",
      amount: Math.random() * 10 + 2,
      currency: "USD",
    });
  }

  return costs;
}

export { cloud as cloudRoutes };
