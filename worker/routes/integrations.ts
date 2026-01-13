import { Hono } from "hono";
import { eq, and, desc } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { authMiddleware } from "../middleware/auth";
import { Env, Variables } from "../index";

const integrations = new Hono<{ Bindings: Env; Variables: Variables }>();

// Apply auth middleware to all routes
integrations.use("*", authMiddleware);

// Available integrations catalog
const AVAILABLE_INTEGRATIONS = [
  // Development
  {
    id: "github",
    name: "GitHub",
    description: "Connect your GitHub repositories for version control and CI/CD",
    category: "Development",
    icon: "github",
    features: ["Repository sync", "Pull request automation", "Issue tracking", "Actions integration"],
    pricing: "Free",
    popular: true,
  },
  {
    id: "gitlab",
    name: "GitLab",
    description: "GitLab integration for code management and DevOps",
    category: "Development",
    icon: "gitlab",
    features: ["Repository sync", "CI/CD pipelines", "Issue boards", "Merge requests"],
    pricing: "Free",
  },
  {
    id: "bitbucket",
    name: "Bitbucket",
    description: "Atlassian Bitbucket for team collaboration",
    category: "Development",
    icon: "bitbucket",
    features: ["Repository sync", "Pull requests", "Pipelines", "Jira integration"],
    pricing: "Free",
  },
  {
    id: "vercel",
    name: "Vercel",
    description: "Deploy frontend applications with Vercel",
    category: "Development",
    icon: "vercel",
    features: ["Automatic deployments", "Preview URLs", "Edge functions", "Analytics"],
    pricing: "Free tier available",
    popular: true,
  },
  {
    id: "netlify",
    name: "Netlify",
    description: "Build and deploy modern web projects",
    category: "Development",
    icon: "netlify",
    features: ["Continuous deployment", "Forms", "Functions", "Split testing"],
    pricing: "Free tier available",
  },
  // Productivity
  {
    id: "slack",
    name: "Slack",
    description: "Get notifications and interact with ADELE in Slack",
    category: "Productivity",
    icon: "slack",
    features: ["Notifications", "Slash commands", "Interactive messages", "Workflow triggers"],
    pricing: "Free",
    popular: true,
  },
  {
    id: "discord",
    name: "Discord",
    description: "Discord bot integration for team communication",
    category: "Productivity",
    icon: "discord",
    features: ["Bot commands", "Notifications", "Channel management", "Voice integration"],
    pricing: "Free",
  },
  {
    id: "notion",
    name: "Notion",
    description: "Sync documentation and project wikis with Notion",
    category: "Productivity",
    icon: "notion",
    features: ["Page sync", "Database integration", "Comments", "Templates"],
    pricing: "Free",
  },
  {
    id: "linear",
    name: "Linear",
    description: "Modern issue tracking and project management",
    category: "Productivity",
    icon: "linear",
    features: ["Issue sync", "Cycle tracking", "Roadmaps", "Automations"],
    pricing: "Free tier available",
  },
  {
    id: "jira",
    name: "Jira",
    description: "Atlassian Jira for project and issue tracking",
    category: "Productivity",
    icon: "jira",
    features: ["Issue management", "Sprints", "Boards", "Reporting"],
    pricing: "Free tier available",
  },
  // Cloud Storage
  {
    id: "google-drive",
    name: "Google Drive",
    description: "Access and sync files from Google Drive",
    category: "Storage",
    icon: "google-drive",
    features: ["File sync", "Folder management", "Sharing", "Real-time collaboration"],
    pricing: "Free",
    popular: true,
  },
  {
    id: "dropbox",
    name: "Dropbox",
    description: "Dropbox file storage integration",
    category: "Storage",
    icon: "dropbox",
    features: ["File sync", "Sharing", "Version history", "Smart sync"],
    pricing: "Free tier available",
  },
  {
    id: "onedrive",
    name: "OneDrive",
    description: "Microsoft OneDrive for file storage",
    category: "Storage",
    icon: "onedrive",
    features: ["File sync", "Office integration", "Sharing", "Personal vault"],
    pricing: "Free tier available",
  },
  // Communication
  {
    id: "gmail",
    name: "Gmail",
    description: "Gmail integration for email management",
    category: "Communication",
    icon: "gmail",
    features: ["Email sync", "Send emails", "Labels", "Filters"],
    pricing: "Free",
  },
  {
    id: "outlook",
    name: "Outlook",
    description: "Microsoft Outlook for email and calendar",
    category: "Communication",
    icon: "outlook",
    features: ["Email sync", "Calendar", "Contacts", "Tasks"],
    pricing: "Free",
  },
  {
    id: "twilio",
    name: "Twilio",
    description: "SMS and voice communication via Twilio",
    category: "Communication",
    icon: "twilio",
    features: ["SMS sending", "Voice calls", "WhatsApp", "Video"],
    pricing: "Pay as you go",
  },
  // AI & ML
  {
    id: "openai",
    name: "OpenAI",
    description: "Use your own OpenAI API key for AI features",
    category: "AI & ML",
    icon: "openai",
    features: ["Custom models", "Fine-tuning", "Embeddings", "GPT-4 access"],
    pricing: "Pay as you go",
    popular: true,
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    description: "Claude AI integration for advanced reasoning",
    category: "AI & ML",
    icon: "anthropic",
    features: ["Claude models", "Long context", "Constitutional AI", "Artifacts"],
    pricing: "Pay as you go",
  },
  {
    id: "huggingface",
    name: "Hugging Face",
    description: "Access thousands of ML models",
    category: "AI & ML",
    icon: "huggingface",
    features: ["Model hub", "Inference API", "Spaces", "Datasets"],
    pricing: "Free tier available",
  },
  // Analytics
  {
    id: "google-analytics",
    name: "Google Analytics",
    description: "Track website and app analytics",
    category: "Analytics",
    icon: "google-analytics",
    features: ["Page views", "User behavior", "Conversions", "Real-time data"],
    pricing: "Free",
  },
  {
    id: "mixpanel",
    name: "Mixpanel",
    description: "Product analytics and user tracking",
    category: "Analytics",
    icon: "mixpanel",
    features: ["Event tracking", "Funnels", "Cohorts", "A/B testing"],
    pricing: "Free tier available",
  },
  {
    id: "sentry",
    name: "Sentry",
    description: "Error tracking and performance monitoring",
    category: "Analytics",
    icon: "sentry",
    features: ["Error tracking", "Performance", "Releases", "Alerts"],
    pricing: "Free tier available",
  },
];

// Get available integrations
integrations.get("/available", async (c) => {
  return c.json({ integrations: AVAILABLE_INTEGRATIONS });
});

// Get installed integrations
integrations.get("/installed", async (c) => {
  const user = c.get("user");
  const db = c.get("db");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const installed = await db.query.installedIntegrations.findMany({
    where: eq(schema.installedIntegrations.userId, user.id),
    orderBy: desc(schema.installedIntegrations.installedAt),
  });

  // Enrich with integration details
  const enriched = installed.map((inst) => {
    const integration = AVAILABLE_INTEGRATIONS.find((i) => i.id === inst.integrationId);
    return {
      id: inst.id,
      integrationId: inst.integrationId,
      name: integration?.name || inst.integrationId,
      status: inst.status,
      config: inst.config ? JSON.parse(inst.config as string) : {},
      installedAt: inst.installedAt?.toISOString(),
    };
  });

  return c.json({ integrations: enriched });
});

// Install integration
integrations.post("/install", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const { integrationId, config } = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Check if integration exists
  const integration = AVAILABLE_INTEGRATIONS.find((i) => i.id === integrationId);
  if (!integration) {
    return c.json({ error: "Integration not found" }, 404);
  }

  // Check if already installed
  const existing = await db.query.installedIntegrations.findFirst({
    where: and(
      eq(schema.installedIntegrations.userId, user.id),
      eq(schema.installedIntegrations.integrationId, integrationId)
    ),
  });

  if (existing) {
    return c.json({ error: "Integration already installed" }, 400);
  }

  const [installation] = await db
    .insert(schema.installedIntegrations)
    .values({
      userId: user.id,
      integrationId,
      status: "active",
      config: config ? JSON.stringify(config) : null,
      installedAt: new Date(),
    })
    .returning();

  return c.json({
    installation: {
      id: installation.id,
      integrationId: installation.integrationId,
      name: integration.name,
      status: installation.status,
      config: config || {},
      installedAt: installation.installedAt?.toISOString(),
    },
  });
});

// Uninstall integration
integrations.delete("/:installationId", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const installationId = parseInt(c.req.param("installationId"));

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await db
    .delete(schema.installedIntegrations)
    .where(
      and(
        eq(schema.installedIntegrations.id, installationId),
        eq(schema.installedIntegrations.userId, user.id)
      )
    );

  return c.json({ success: true });
});

// Toggle integration enabled/disabled
integrations.post("/:installationId/toggle", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const installationId = parseInt(c.req.param("installationId"));
  const { enabled } = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await db
    .update(schema.installedIntegrations)
    .set({
      status: enabled ? "active" : "inactive",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.installedIntegrations.id, installationId),
        eq(schema.installedIntegrations.userId, user.id)
      )
    );

  return c.json({ success: true });
});

// Configure integration
integrations.patch("/:installationId/config", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const installationId = parseInt(c.req.param("installationId"));
  const config = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await db
    .update(schema.installedIntegrations)
    .set({
      config: JSON.stringify(config),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.installedIntegrations.id, installationId),
        eq(schema.installedIntegrations.userId, user.id)
      )
    );

  return c.json({ success: true });
});

export { integrations as integrationsRoutes };
