import { Hono } from "hono";
import { eq, and, desc, like } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { authMiddleware } from "../middleware/auth";
import { Env, Variables } from "../index";

const workOrders = new Hono<{ Bindings: Env; Variables: Variables }>();

// Apply auth middleware to all routes
workOrders.use("*", authMiddleware);

// List work orders
workOrders.get("/", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const status = c.req.query("status");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  let whereClause = eq(schema.workOrders.userId, user.id);
  if (status) {
    whereClause = and(whereClause, eq(schema.workOrders.status, status)) as any;
  }

  const orders = await db.query.workOrders.findMany({
    where: whereClause,
    orderBy: desc(schema.workOrders.createdAt),
  });

  return c.json({ orders });
});

// Get single work order with activities
workOrders.get("/:id", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const order = await db.query.workOrders.findFirst({
    where: and(
      eq(schema.workOrders.id, id),
      eq(schema.workOrders.userId, user.id)
    ),
  });

  if (!order) {
    return c.json({ error: "Work order not found" }, 404);
  }

  const activities = await db.query.workOrderActivities.findMany({
    where: eq(schema.workOrderActivities.orderId, id),
    orderBy: desc(schema.workOrderActivities.createdAt),
  });

  return c.json({ order, activities });
});

// Create work order
workOrders.post("/", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const body = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const [order] = await db
    .insert(schema.workOrders)
    .values({
      userId: user.id,
      title: body.title,
      description: body.description,
      type: body.type || "general",
      priority: body.priority || "medium",
      status: "draft",
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      estimatedHours: body.estimatedHours,
      metadata: body.metadata ? JSON.stringify(body.metadata) : null,
    })
    .returning();

  // Create initial activity
  await db.insert(schema.workOrderActivities).values({
    orderId: order.id,
    type: "created",
    content: "Work order created",
    userId: user.id,
    userName: user.name || user.email,
  });

  return c.json({ order });
});

// Update work order
workOrders.patch("/:id", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const existing = await db.query.workOrders.findFirst({
    where: and(
      eq(schema.workOrders.id, id),
      eq(schema.workOrders.userId, user.id)
    ),
  });

  if (!existing) {
    return c.json({ error: "Work order not found" }, 404);
  }

  const [order] = await db
    .update(schema.workOrders)
    .set({
      title: body.title ?? existing.title,
      description: body.description ?? existing.description,
      type: body.type ?? existing.type,
      priority: body.priority ?? existing.priority,
      dueDate: body.dueDate ? new Date(body.dueDate) : existing.dueDate,
      estimatedHours: body.estimatedHours ?? existing.estimatedHours,
      metadata: body.metadata ? JSON.stringify(body.metadata) : existing.metadata,
      updatedAt: new Date(),
    })
    .where(eq(schema.workOrders.id, id))
    .returning();

  // Create activity for update
  await db.insert(schema.workOrderActivities).values({
    orderId: id,
    type: "updated",
    content: "Work order updated",
    userId: user.id,
    userName: user.name || user.email,
  });

  return c.json({ order });
});

// Delete work order
workOrders.delete("/:id", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await db
    .delete(schema.workOrders)
    .where(
      and(
        eq(schema.workOrders.id, id),
        eq(schema.workOrders.userId, user.id)
      )
    );

  return c.json({ success: true });
});

// Approve work order
workOrders.post("/:id/approve", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));
  const { comment } = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Check if user has approval permission (admin or manager)
  if (user.role !== "admin") {
    return c.json({ error: "Not authorized to approve" }, 403);
  }

  const [order] = await db
    .update(schema.workOrders)
    .set({
      status: "approved",
      approvedBy: user.id,
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.workOrders.id, id))
    .returning();

  // Create activity
  await db.insert(schema.workOrderActivities).values({
    orderId: id,
    type: "approved",
    content: comment || "Work order approved",
    userId: user.id,
    userName: user.name || user.email,
  });

  return c.json({ success: true });
});

// Reject work order
workOrders.post("/:id/reject", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));
  const { reason } = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (user.role !== "admin") {
    return c.json({ error: "Not authorized to reject" }, 403);
  }

  const [order] = await db
    .update(schema.workOrders)
    .set({
      status: "rejected",
      rejectionReason: reason,
      updatedAt: new Date(),
    })
    .where(eq(schema.workOrders.id, id))
    .returning();

  // Create activity
  await db.insert(schema.workOrderActivities).values({
    orderId: id,
    type: "rejected",
    content: `Work order rejected: ${reason}`,
    userId: user.id,
    userName: user.name || user.email,
  });

  return c.json({ success: true });
});

// Start work order
workOrders.post("/:id/start", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const existing = await db.query.workOrders.findFirst({
    where: eq(schema.workOrders.id, id),
  });

  if (!existing || existing.status !== "approved") {
    return c.json({ error: "Work order must be approved before starting" }, 400);
  }

  const [order] = await db
    .update(schema.workOrders)
    .set({
      status: "in_progress",
      startedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.workOrders.id, id))
    .returning();

  // Create activity
  await db.insert(schema.workOrderActivities).values({
    orderId: id,
    type: "started",
    content: "Work started",
    userId: user.id,
    userName: user.name || user.email,
  });

  return c.json({ success: true });
});

// Complete work order
workOrders.post("/:id/complete", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));
  const { result } = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const existing = await db.query.workOrders.findFirst({
    where: eq(schema.workOrders.id, id),
  });

  if (!existing || existing.status !== "in_progress") {
    return c.json({ error: "Work order must be in progress to complete" }, 400);
  }

  // Calculate actual hours
  const startedAt = existing.startedAt ? new Date(existing.startedAt) : new Date();
  const actualHours = (Date.now() - startedAt.getTime()) / (1000 * 60 * 60);

  const [order] = await db
    .update(schema.workOrders)
    .set({
      status: "completed",
      completedAt: new Date(),
      actualHours: Math.round(actualHours * 10) / 10,
      result,
      updatedAt: new Date(),
    })
    .where(eq(schema.workOrders.id, id))
    .returning();

  // Create activity
  await db.insert(schema.workOrderActivities).values({
    orderId: id,
    type: "completed",
    content: result || "Work completed",
    userId: user.id,
    userName: user.name || user.email,
  });

  return c.json({ success: true });
});

// Add comment to work order
workOrders.post("/:id/comments", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));
  const { comment } = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const [activity] = await db
    .insert(schema.workOrderActivities)
    .values({
      orderId: id,
      type: "comment",
      content: comment,
      userId: user.id,
      userName: user.name || user.email,
    })
    .returning();

  return c.json({ activity });
});

export { workOrders as workOrderRoutes };
