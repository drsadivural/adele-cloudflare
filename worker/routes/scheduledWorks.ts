import { Hono } from "hono";
import { eq, and, desc } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { authMiddleware } from "../middleware/auth";
import { Env, Variables } from "../index";

const scheduledWorks = new Hono<{ Bindings: Env; Variables: Variables }>();

// Apply auth middleware to all routes
scheduledWorks.use("*", authMiddleware);

// List scheduled works
scheduledWorks.get("/", async (c) => {
  const user = c.get("user");
  const db = c.get("db");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const works = await db.query.scheduledWorks.findMany({
    where: eq(schema.scheduledWorks.userId, user.id),
    orderBy: desc(schema.scheduledWorks.createdAt),
  });

  return c.json({ works });
});

// Get single scheduled work with executions
scheduledWorks.get("/:id", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const work = await db.query.scheduledWorks.findFirst({
    where: and(
      eq(schema.scheduledWorks.id, id),
      eq(schema.scheduledWorks.userId, user.id)
    ),
  });

  if (!work) {
    return c.json({ error: "Scheduled work not found" }, 404);
  }

  const executions = await db.query.workExecutions.findMany({
    where: eq(schema.workExecutions.workId, id),
    orderBy: desc(schema.workExecutions.startedAt),
    limit: 50,
  });

  return c.json({ work, executions });
});

// Create scheduled work
scheduledWorks.post("/", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const body = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Calculate next run time based on schedule
  const nextRunAt = calculateNextRun(body.schedule, body.scheduleType);

  const [work] = await db
    .insert(schema.scheduledWorks)
    .values({
      userId: user.id,
      name: body.name,
      description: body.description,
      schedule: body.schedule,
      scheduleType: body.scheduleType || "cron",
      taskType: body.taskType,
      taskConfig: body.taskConfig ? JSON.stringify(body.taskConfig) : null,
      status: "active",
      nextRunAt,
    })
    .returning();

  return c.json({ work });
});

// Update scheduled work
scheduledWorks.patch("/:id", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const existing = await db.query.scheduledWorks.findFirst({
    where: and(
      eq(schema.scheduledWorks.id, id),
      eq(schema.scheduledWorks.userId, user.id)
    ),
  });

  if (!existing) {
    return c.json({ error: "Scheduled work not found" }, 404);
  }

  const schedule = body.schedule ?? existing.schedule;
  const scheduleType = body.scheduleType ?? existing.scheduleType;
  const nextRunAt = calculateNextRun(schedule, scheduleType);

  const [work] = await db
    .update(schema.scheduledWorks)
    .set({
      name: body.name ?? existing.name,
      description: body.description ?? existing.description,
      schedule,
      scheduleType,
      taskType: body.taskType ?? existing.taskType,
      taskConfig: body.taskConfig ? JSON.stringify(body.taskConfig) : existing.taskConfig,
      nextRunAt,
      updatedAt: new Date(),
    })
    .where(eq(schema.scheduledWorks.id, id))
    .returning();

  return c.json({ work });
});

// Delete scheduled work
scheduledWorks.delete("/:id", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await db
    .delete(schema.scheduledWorks)
    .where(
      and(
        eq(schema.scheduledWorks.id, id),
        eq(schema.scheduledWorks.userId, user.id)
      )
    );

  return c.json({ success: true });
});

// Trigger scheduled work manually
scheduledWorks.post("/:id/trigger", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const work = await db.query.scheduledWorks.findFirst({
    where: and(
      eq(schema.scheduledWorks.id, id),
      eq(schema.scheduledWorks.userId, user.id)
    ),
  });

  if (!work) {
    return c.json({ error: "Scheduled work not found" }, 404);
  }

  // Create execution record
  const [execution] = await db
    .insert(schema.workExecutions)
    .values({
      workId: id,
      status: "running",
      startedAt: new Date(),
      triggeredBy: "manual",
    })
    .returning();

  // TODO: Actually execute the task
  // This would involve calling the appropriate service based on taskType

  // Simulate execution completion
  setTimeout(async () => {
    await db
      .update(schema.workExecutions)
      .set({
        status: "success",
        completedAt: new Date(),
        result: JSON.stringify({ message: "Task completed successfully" }),
      })
      .where(eq(schema.workExecutions.id, execution.id));

    // Update last run time
    await db
      .update(schema.scheduledWorks)
      .set({
        lastRunAt: new Date(),
        nextRunAt: calculateNextRun(work.schedule, work.scheduleType),
      })
      .where(eq(schema.scheduledWorks.id, id));
  }, 2000);

  return c.json({ execution });
});

// Pause scheduled work
scheduledWorks.post("/:id/pause", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await db
    .update(schema.scheduledWorks)
    .set({ status: "paused", updatedAt: new Date() })
    .where(
      and(
        eq(schema.scheduledWorks.id, id),
        eq(schema.scheduledWorks.userId, user.id)
      )
    );

  return c.json({ success: true });
});

// Resume scheduled work
scheduledWorks.post("/:id/resume", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const work = await db.query.scheduledWorks.findFirst({
    where: and(
      eq(schema.scheduledWorks.id, id),
      eq(schema.scheduledWorks.userId, user.id)
    ),
  });

  if (!work) {
    return c.json({ error: "Scheduled work not found" }, 404);
  }

  const nextRunAt = calculateNextRun(work.schedule, work.scheduleType);

  await db
    .update(schema.scheduledWorks)
    .set({ status: "active", nextRunAt, updatedAt: new Date() })
    .where(eq(schema.scheduledWorks.id, id));

  return c.json({ success: true });
});

// Helper function to calculate next run time
function calculateNextRun(schedule: string | null, scheduleType: string | null): Date {
  const now = new Date();
  
  if (scheduleType === "interval" && schedule) {
    // Schedule is in seconds
    const intervalSeconds = parseInt(schedule);
    return new Date(now.getTime() + intervalSeconds * 1000);
  }
  
  if (scheduleType === "once" && schedule) {
    // Schedule is ISO date string
    return new Date(schedule);
  }
  
  if (scheduleType === "cron" && schedule) {
    // Parse cron expression and calculate next run
    // For simplicity, we'll just add 1 hour for now
    // In production, use a proper cron parser library
    return new Date(now.getTime() + 60 * 60 * 1000);
  }
  
  // Default: 1 hour from now
  return new Date(now.getTime() + 60 * 60 * 1000);
}

export { scheduledWorks as scheduledWorksRoutes };
