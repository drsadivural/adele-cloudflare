import { Hono } from "hono";
import { eq, and, desc } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { authMiddleware } from "../middleware/auth";
import { Env, Variables } from "../index";

const dataControls = new Hono<{ Bindings: Env; Variables: Variables }>();

// Apply auth middleware to all routes
dataControls.use("*", authMiddleware);

// Export user data
dataControls.post("/export", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const storage = c.env.STORAGE;
  const { format } = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Gather all user data
  const userData = {
    profile: user,
    settings: await db.query.userSettings.findFirst({
      where: eq(schema.userSettings.userId, user.id),
    }),
    projects: await db.query.projects.findMany({
      where: eq(schema.projects.userId, user.id),
    }),
    // Add more data as needed
  };

  let content: string;
  let contentType: string;
  let extension: string;

  if (format === "csv") {
    // Convert to CSV format
    content = convertToCSV(userData);
    contentType = "text/csv";
    extension = "csv";
  } else {
    // Default to JSON
    content = JSON.stringify(userData, null, 2);
    contentType = "application/json";
    extension = "json";
  }

  // Store in R2
  const key = `exports/${user.id}/${Date.now()}.${extension}`;
  await storage.put(key, content, {
    httpMetadata: { contentType },
  });

  // Create export record
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

  const [exportRecord] = await db
    .insert(schema.dataExports)
    .values({
      userId: user.id,
      format,
      status: "completed",
      url: `https://storage.adele.ayonix.com/${key}`,
      expiresAt,
    })
    .returning();

  return c.json({
    url: exportRecord.url,
    expiresAt: exportRecord.expiresAt?.toISOString(),
  });
});

// Import user data
dataControls.post("/import", async (c) => {
  const user = c.get("user");
  const db = c.get("db");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const formData = await c.req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return c.json({ error: "No file provided" }, 400);
  }

  try {
    const content = await file.text();
    const data = JSON.parse(content);

    // Validate and import data
    // This is a simplified version - in production, you'd want more validation
    if (data.settings) {
      const existingSettings = await db.query.userSettings.findFirst({
        where: eq(schema.userSettings.userId, user.id),
      });

      if (existingSettings) {
        await db
          .update(schema.userSettings)
          .set({
            theme: data.settings.theme,
            language: data.settings.language,
            timezone: data.settings.timezone,
            updatedAt: new Date(),
          })
          .where(eq(schema.userSettings.userId, user.id));
      }
    }

    // Import projects
    if (data.projects && Array.isArray(data.projects)) {
      for (const project of data.projects) {
        await db.insert(schema.projects).values({
          userId: user.id,
          name: `${project.name} (Imported)`,
          description: project.description,
          type: project.type || "web",
          status: "draft",
          techStack: project.techStack,
        });
      }
    }

    return c.json({ success: true, message: "Data imported successfully" });
  } catch (error) {
    return c.json({ error: "Invalid import file" }, 400);
  }
});

// Get export history
dataControls.get("/exports", async (c) => {
  const user = c.get("user");
  const db = c.get("db");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const exports = await db.query.dataExports.findMany({
    where: eq(schema.dataExports.userId, user.id),
    orderBy: desc(schema.dataExports.createdAt),
  });

  return c.json({ exports });
});

// Request account deletion
dataControls.post("/delete-request", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const { reason } = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Check for existing pending request
  const existingRequest = await db.query.deletionRequests.findFirst({
    where: and(
      eq(schema.deletionRequests.userId, user.id),
      eq(schema.deletionRequests.status, "pending")
    ),
  });

  if (existingRequest) {
    return c.json({ error: "A deletion request is already pending" }, 400);
  }

  // Schedule deletion for 30 days from now (grace period)
  const scheduledAt = new Date();
  scheduledAt.setDate(scheduledAt.getDate() + 30);

  const [request] = await db
    .insert(schema.deletionRequests)
    .values({
      userId: user.id,
      status: "pending",
      reason,
      scheduledAt,
    })
    .returning();

  // TODO: Send confirmation email

  return c.json({
    request: {
      id: request.id,
      status: request.status,
      reason: request.reason,
      scheduledAt: request.scheduledAt?.toISOString(),
      createdAt: request.createdAt?.toISOString(),
    },
  });
});

// Cancel deletion request
dataControls.delete("/delete-request", async (c) => {
  const user = c.get("user");
  const db = c.get("db");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await db
    .update(schema.deletionRequests)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(schema.deletionRequests.userId, user.id),
        eq(schema.deletionRequests.status, "pending")
      )
    );

  return c.json({ success: true });
});

// Get retention settings
dataControls.get("/retention", async (c) => {
  const user = c.get("user");
  const db = c.get("db");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const settings = await db.query.retentionSettings.findFirst({
    where: eq(schema.retentionSettings.userId, user.id),
  });

  if (!settings) {
    // Return defaults
    return c.json({
      settings: {
        chatHistory: 90, // days
        projectFiles: 365,
        auditLogs: 30,
        autoDelete: false,
      },
    });
  }

  return c.json({ settings });
});

// Update retention settings
dataControls.patch("/retention", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const body = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const existing = await db.query.retentionSettings.findFirst({
    where: eq(schema.retentionSettings.userId, user.id),
  });

  if (existing) {
    await db
      .update(schema.retentionSettings)
      .set({
        chatHistory: body.chatHistory ?? existing.chatHistory,
        projectFiles: body.projectFiles ?? existing.projectFiles,
        auditLogs: body.auditLogs ?? existing.auditLogs,
        autoDelete: body.autoDelete ?? existing.autoDelete,
        updatedAt: new Date(),
      })
      .where(eq(schema.retentionSettings.userId, user.id));
  } else {
    await db.insert(schema.retentionSettings).values({
      userId: user.id,
      chatHistory: body.chatHistory || 90,
      projectFiles: body.projectFiles || 365,
      auditLogs: body.auditLogs || 30,
      autoDelete: body.autoDelete || false,
    });
  }

  return c.json({ success: true });
});

// Helper function to convert data to CSV
function convertToCSV(data: any): string {
  const lines: string[] = [];

  // Profile
  lines.push("# User Profile");
  lines.push("id,email,name,role,createdAt");
  lines.push(
    `${data.profile.id},"${data.profile.email}","${data.profile.name}","${data.profile.role}","${data.profile.createdAt}"`
  );
  lines.push("");

  // Projects
  if (data.projects && data.projects.length > 0) {
    lines.push("# Projects");
    lines.push("id,name,description,type,status,createdAt");
    for (const project of data.projects) {
      lines.push(
        `${project.id},"${project.name}","${project.description || ""}","${project.type}","${project.status}","${project.createdAt}"`
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}

export { dataControls as dataControlsRoutes };
