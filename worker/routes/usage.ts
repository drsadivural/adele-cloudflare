import { Hono } from "hono";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { authMiddleware } from "../middleware/auth";
import { Env, Variables } from "../index";

const usage = new Hono<{ Bindings: Env; Variables: Variables }>();

// Apply auth middleware to all routes
usage.use("*", authMiddleware);

// Get usage summary
usage.get("/summary", async (c) => {
  const user = c.get("user");
  const db = c.get("db");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Get current month usage
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const usageRecords = await db.query.usageRecords.findMany({
    where: and(
      eq(schema.usageRecords.userId, user.id),
      gte(schema.usageRecords.recordedAt, startOfMonth)
    ),
  });

  // Calculate totals
  const creditsUsed = usageRecords.reduce((sum, r) => sum + (r.credits || 0), 0);
  const apiCalls = usageRecords.reduce((sum, r) => sum + (r.apiCalls || 0), 0);

  // Get storage usage
  const files = await db.query.generatedFiles.findMany({
    where: eq(schema.generatedFiles.projectId, sql`(SELECT id FROM projects WHERE user_id = ${user.id})`),
  });
  const storageUsed = files.reduce((sum, f) => sum + (f.content?.length || 0), 0);

  // Get project count
  const projects = await db.query.projects.findMany({
    where: eq(schema.projects.userId, user.id),
  });

  // Get limits based on subscription
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.userId, user.id),
  });

  const plan = subscription?.plan || "free";
  const limits = getPlanLimits(plan);

  return c.json({
    usage: {
      creditsUsed,
      creditsLimit: limits.credits,
      apiCalls,
      storageUsed,
      storageLimit: limits.storage,
      projectsCount: projects.length,
      projectsLimit: limits.projects,
    },
  });
});

// Get usage history
usage.get("/history", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const start = c.req.query("start");
  const end = c.req.query("end");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const startDate = start ? new Date(start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = end ? new Date(end) : new Date();

  const records = await db.query.usageRecords.findMany({
    where: and(
      eq(schema.usageRecords.userId, user.id),
      gte(schema.usageRecords.recordedAt, startDate),
      lte(schema.usageRecords.recordedAt, endDate)
    ),
    orderBy: desc(schema.usageRecords.recordedAt),
  });

  // Group by date
  const groupedByDate = records.reduce((acc, record) => {
    const date = record.recordedAt?.toISOString().split("T")[0] || "";
    if (!acc[date]) {
      acc[date] = { credits: 0, apiCalls: 0, storage: 0 };
    }
    acc[date].credits += record.credits || 0;
    acc[date].apiCalls += record.apiCalls || 0;
    acc[date].storage += record.storageBytes || 0;
    return acc;
  }, {} as Record<string, { credits: number; apiCalls: number; storage: number }>);

  return c.json({
    history: Object.entries(groupedByDate).map(([date, data]) => ({
      date,
      ...data,
    })),
  });
});

// Get usage breakdown
usage.get("/breakdown", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const period = c.req.query("period") || "month";

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  let startDate = new Date();
  if (period === "day") {
    startDate.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    startDate.setDate(startDate.getDate() - 7);
  } else {
    startDate.setMonth(startDate.getMonth() - 1);
  }

  const records = await db.query.usageRecords.findMany({
    where: and(
      eq(schema.usageRecords.userId, user.id),
      gte(schema.usageRecords.recordedAt, startDate)
    ),
  });

  // Group by category
  const byCategory = records.reduce((acc, record) => {
    const category = record.category || "other";
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += record.credits || 0;
    return acc;
  }, {} as Record<string, number>);

  const total = Object.values(byCategory).reduce((sum, v) => sum + v, 0);

  return c.json({
    breakdown: Object.entries(byCategory).map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
    })),
  });
});

// Get usage limits
usage.get("/limits", async (c) => {
  const user = c.get("user");
  const db = c.get("db");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.userId, user.id),
  });

  const plan = subscription?.plan || "free";
  const limits = getPlanLimits(plan);

  return c.json({ limits });
});

// Helper function to get plan limits
function getPlanLimits(plan: string) {
  const plans: Record<string, { credits: number; apiCalls: number; storage: number; projects: number }> = {
    free: {
      credits: 1000,
      apiCalls: 100,
      storage: 100 * 1024 * 1024, // 100 MB
      projects: 3,
    },
    pro: {
      credits: 10000,
      apiCalls: 1000,
      storage: 1024 * 1024 * 1024, // 1 GB
      projects: 20,
    },
    enterprise: {
      credits: 100000,
      apiCalls: 10000,
      storage: 10 * 1024 * 1024 * 1024, // 10 GB
      projects: -1, // Unlimited
    },
  };

  return plans[plan] || plans.free;
}

export { usage as usageRoutes };
