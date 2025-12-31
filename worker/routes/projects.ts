import { Hono } from "hono";
import { eq, desc, and } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import type { Env, Variables } from "../index";

export const projectRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// List user's projects
projectRoutes.get("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  
  const db = c.get("db");
  
  const projects = await db.select()
    .from(schema.projects)
    .where(eq(schema.projects.userId, user.id))
    .orderBy(desc(schema.projects.updatedAt));
  
  return c.json({ projects });
});

// Get single project
projectRoutes.get("/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  
  const db = c.get("db");
  const projectId = parseInt(c.req.param("id"));
  
  const project = await db.select()
    .from(schema.projects)
    .where(and(
      eq(schema.projects.id, projectId),
      eq(schema.projects.userId, user.id)
    ))
    .get();
  
  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }
  
  // Get files
  const files = await db.select()
    .from(schema.generatedFiles)
    .where(eq(schema.generatedFiles.projectId, projectId));
  
  // Get agent tasks
  const tasks = await db.select()
    .from(schema.agentTasks)
    .where(eq(schema.agentTasks.projectId, projectId))
    .orderBy(desc(schema.agentTasks.createdAt));
  
  return c.json({ 
    project,
    files,
    tasks,
  });
});

// Create project
projectRoutes.post("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  
  const db = c.get("db");
  const body = await c.req.json();
  
  const { name, description, type, techStack } = body;
  
  if (!name) {
    return c.json({ error: "Project name is required" }, 400);
  }
  
  // Check project limits based on subscription
  const subscription = await db.select()
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.userId, user.id))
    .get();
  
  const projectCount = await db.select()
    .from(schema.projects)
    .where(eq(schema.projects.userId, user.id));
  
  const limits: Record<string, number> = {
    free: 3,
    pro: 100,
    enterprise: 1000,
  };
  
  const plan = subscription?.plan || "free";
  const limit = limits[plan] || 3;
  
  if (projectCount.length >= limit) {
    return c.json({ 
      error: `Project limit reached. ${plan === "free" ? "Upgrade to Pro for unlimited projects." : "Contact support to increase your limit."}` 
    }, 403);
  }
  
  const result = await db.insert(schema.projects).values({
    userId: user.id,
    name,
    description,
    type: type || "web",
    techStack: techStack ? JSON.stringify(techStack) : null,
    status: "draft",
  }).returning();
  
  return c.json({ project: result[0] });
});

// Update project
projectRoutes.patch("/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  
  const db = c.get("db");
  const projectId = parseInt(c.req.param("id"));
  const body = await c.req.json();
  
  // Verify ownership
  const existing = await db.select()
    .from(schema.projects)
    .where(and(
      eq(schema.projects.id, projectId),
      eq(schema.projects.userId, user.id)
    ))
    .get();
  
  if (!existing) {
    return c.json({ error: "Project not found" }, 404);
  }
  
  const { name, description, type, status, techStack, deploymentUrl, repositoryUrl } = body;
  
  const updateData: Partial<schema.InsertProject> = {
    updatedAt: new Date(),
  };
  
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (type !== undefined) updateData.type = type;
  if (status !== undefined) updateData.status = status;
  if (techStack !== undefined) updateData.techStack = JSON.stringify(techStack);
  if (deploymentUrl !== undefined) updateData.deploymentUrl = deploymentUrl;
  if (repositoryUrl !== undefined) updateData.repositoryUrl = repositoryUrl;
  
  const result = await db.update(schema.projects)
    .set(updateData)
    .where(eq(schema.projects.id, projectId))
    .returning();
  
  return c.json({ project: result[0] });
});

// Delete project
projectRoutes.delete("/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  
  const db = c.get("db");
  const projectId = parseInt(c.req.param("id"));
  
  // Verify ownership
  const existing = await db.select()
    .from(schema.projects)
    .where(and(
      eq(schema.projects.id, projectId),
      eq(schema.projects.userId, user.id)
    ))
    .get();
  
  if (!existing) {
    return c.json({ error: "Project not found" }, 404);
  }
  
  await db.delete(schema.projects).where(eq(schema.projects.id, projectId));
  
  return c.json({ success: true });
});

// Get project files
projectRoutes.get("/:id/files", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  
  const db = c.get("db");
  const projectId = parseInt(c.req.param("id"));
  
  // Verify ownership
  const project = await db.select()
    .from(schema.projects)
    .where(and(
      eq(schema.projects.id, projectId),
      eq(schema.projects.userId, user.id)
    ))
    .get();
  
  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }
  
  const files = await db.select()
    .from(schema.generatedFiles)
    .where(eq(schema.generatedFiles.projectId, projectId))
    .orderBy(schema.generatedFiles.path);
  
  return c.json({ files });
});

// Create/update file
projectRoutes.post("/:id/files", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  
  const db = c.get("db");
  const projectId = parseInt(c.req.param("id"));
  const body = await c.req.json();
  
  // Verify ownership
  const project = await db.select()
    .from(schema.projects)
    .where(and(
      eq(schema.projects.id, projectId),
      eq(schema.projects.userId, user.id)
    ))
    .get();
  
  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }
  
  const { path, content, language } = body;
  
  if (!path || content === undefined) {
    return c.json({ error: "Path and content are required" }, 400);
  }
  
  // Check if file exists
  const existing = await db.select()
    .from(schema.generatedFiles)
    .where(and(
      eq(schema.generatedFiles.projectId, projectId),
      eq(schema.generatedFiles.path, path)
    ))
    .get();
  
  if (existing) {
    // Update existing file
    const result = await db.update(schema.generatedFiles)
      .set({ 
        content, 
        language,
        version: (existing.version || 1) + 1,
        updatedAt: new Date() 
      })
      .where(eq(schema.generatedFiles.id, existing.id))
      .returning();
    
    return c.json({ file: result[0] });
  } else {
    // Create new file
    const result = await db.insert(schema.generatedFiles).values({
      projectId,
      path,
      content,
      language,
      version: 1,
    }).returning();
    
    return c.json({ file: result[0] });
  }
});

// Get project versions
projectRoutes.get("/:id/versions", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  
  const db = c.get("db");
  const projectId = parseInt(c.req.param("id"));
  
  // Verify ownership
  const project = await db.select()
    .from(schema.projects)
    .where(and(
      eq(schema.projects.id, projectId),
      eq(schema.projects.userId, user.id)
    ))
    .get();
  
  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }
  
  const versions = await db.select()
    .from(schema.projectVersions)
    .where(eq(schema.projectVersions.projectId, projectId))
    .orderBy(desc(schema.projectVersions.versionNumber));
  
  return c.json({ versions });
});

// Create version (commit)
projectRoutes.post("/:id/versions", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  
  const db = c.get("db");
  const projectId = parseInt(c.req.param("id"));
  const body = await c.req.json();
  
  // Verify ownership
  const project = await db.select()
    .from(schema.projects)
    .where(and(
      eq(schema.projects.id, projectId),
      eq(schema.projects.userId, user.id)
    ))
    .get();
  
  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }
  
  const { commitMessage } = body;
  
  // Get current files
  const files = await db.select()
    .from(schema.generatedFiles)
    .where(eq(schema.generatedFiles.projectId, projectId));
  
  // Get latest version number
  const latestVersion = await db.select()
    .from(schema.projectVersions)
    .where(eq(schema.projectVersions.projectId, projectId))
    .orderBy(desc(schema.projectVersions.versionNumber))
    .limit(1)
    .get();
  
  const newVersionNumber = (latestVersion?.versionNumber || 0) + 1;
  
  const result = await db.insert(schema.projectVersions).values({
    projectId,
    versionNumber: newVersionNumber,
    commitMessage: commitMessage || `Version ${newVersionNumber}`,
    snapshot: JSON.stringify(files),
    createdBy: user.id,
  }).returning();
  
  return c.json({ version: result[0] });
});

// Rollback to version
projectRoutes.post("/:id/versions/:versionId/rollback", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  
  const db = c.get("db");
  const projectId = parseInt(c.req.param("id"));
  const versionId = parseInt(c.req.param("versionId"));
  
  // Verify ownership
  const project = await db.select()
    .from(schema.projects)
    .where(and(
      eq(schema.projects.id, projectId),
      eq(schema.projects.userId, user.id)
    ))
    .get();
  
  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }
  
  // Get version
  const version = await db.select()
    .from(schema.projectVersions)
    .where(and(
      eq(schema.projectVersions.id, versionId),
      eq(schema.projectVersions.projectId, projectId)
    ))
    .get();
  
  if (!version) {
    return c.json({ error: "Version not found" }, 404);
  }
  
  // Delete current files
  await db.delete(schema.generatedFiles).where(eq(schema.generatedFiles.projectId, projectId));
  
  // Restore files from snapshot
  const snapshot = JSON.parse(version.snapshot || "[]");
  for (const file of snapshot) {
    await db.insert(schema.generatedFiles).values({
      projectId,
      path: file.path,
      content: file.content,
      language: file.language,
      version: 1,
    });
  }
  
  // Update project
  await db.update(schema.projects)
    .set({ updatedAt: new Date() })
    .where(eq(schema.projects.id, projectId));
  
  return c.json({ success: true, message: `Rolled back to version ${version.versionNumber}` });
});

// Download project as ZIP (returns file list for client-side ZIP creation)
projectRoutes.get("/:id/download", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  
  const db = c.get("db");
  const projectId = parseInt(c.req.param("id"));
  
  // Verify ownership
  const project = await db.select()
    .from(schema.projects)
    .where(and(
      eq(schema.projects.id, projectId),
      eq(schema.projects.userId, user.id)
    ))
    .get();
  
  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }
  
  const files = await db.select()
    .from(schema.generatedFiles)
    .where(eq(schema.generatedFiles.projectId, projectId));
  
  return c.json({ 
    project: {
      name: project.name,
      description: project.description,
    },
    files: files.map(f => ({
      path: f.path,
      content: f.content,
    }))
  });
});
