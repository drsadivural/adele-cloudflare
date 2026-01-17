import { Hono } from "hono";
import { eq, and, desc } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { authMiddleware } from "../middleware/auth";
import { Env, Variables } from "../index";

const integrations = new Hono<{ Bindings: Env; Variables: Variables }>();

// Apply auth middleware to all routes
integrations.use("*", authMiddleware);

// Available integrations catalog - comprehensive list
const AVAILABLE_INTEGRATIONS = [
  // Payment & E-commerce
  {
    id: "stripe",
    name: "Stripe",
    description: "Payment processing, subscriptions, and billing",
    category: "Payment",
    icon: "stripe",
    features: ["Payment processing", "Subscriptions", "Invoicing", "Connect"],
    pricing: "Pay as you go",
    popular: true,
    configFields: [
      { name: "apiKey", label: "API Key", type: "password", required: true, placeholder: "sk_live_..." },
      { name: "webhookSecret", label: "Webhook Secret", type: "password", required: false, placeholder: "whsec_..." },
    ],
  },
  {
    id: "paypal",
    name: "PayPal",
    description: "PayPal payment integration",
    category: "Payment",
    icon: "paypal",
    features: ["Payments", "Subscriptions", "Payouts", "Invoicing"],
    pricing: "Pay as you go",
    configFields: [
      { name: "clientId", label: "Client ID", type: "text", required: true },
      { name: "clientSecret", label: "Client Secret", type: "password", required: true },
      { name: "sandbox", label: "Sandbox Mode", type: "boolean", required: false },
    ],
  },
  // Email & Communication
  {
    id: "sendgrid",
    name: "SendGrid",
    description: "Email delivery and marketing automation",
    category: "Communication",
    icon: "sendgrid",
    features: ["Transactional email", "Marketing campaigns", "Email analytics", "Templates"],
    pricing: "Free tier available",
    popular: true,
    configFields: [
      { name: "apiKey", label: "API Key", type: "password", required: true, placeholder: "SG...." },
      { name: "fromEmail", label: "From Email", type: "email", required: true },
      { name: "fromName", label: "From Name", type: "text", required: false },
    ],
  },
  {
    id: "mailgun",
    name: "Mailgun",
    description: "Email API for developers",
    category: "Communication",
    icon: "mailgun",
    features: ["Email sending", "Email validation", "Tracking", "Routing"],
    pricing: "Free tier available",
    configFields: [
      { name: "apiKey", label: "API Key", type: "password", required: true },
      { name: "domain", label: "Domain", type: "text", required: true },
    ],
  },
  {
    id: "twilio",
    name: "Twilio",
    description: "SMS, voice, and messaging APIs",
    category: "Communication",
    icon: "twilio",
    features: ["SMS", "Voice calls", "WhatsApp", "Video"],
    pricing: "Pay as you go",
    configFields: [
      { name: "accountSid", label: "Account SID", type: "text", required: true },
      { name: "authToken", label: "Auth Token", type: "password", required: true },
      { name: "phoneNumber", label: "Phone Number", type: "text", required: false },
    ],
  },
  // CRM & Sales
  {
    id: "salesforce",
    name: "Salesforce",
    description: "CRM and sales automation platform",
    category: "CRM",
    icon: "salesforce",
    features: ["Contact management", "Lead tracking", "Opportunity management", "Reports"],
    pricing: "Subscription",
    popular: true,
    configFields: [
      { name: "instanceUrl", label: "Instance URL", type: "url", required: true, placeholder: "https://yourorg.salesforce.com" },
      { name: "clientId", label: "Consumer Key", type: "text", required: true },
      { name: "clientSecret", label: "Consumer Secret", type: "password", required: true },
      { name: "refreshToken", label: "Refresh Token", type: "password", required: true },
    ],
  },
  {
    id: "hubspot",
    name: "HubSpot",
    description: "Marketing, sales, and CRM platform",
    category: "CRM",
    icon: "hubspot",
    features: ["CRM", "Marketing automation", "Sales tools", "Service hub"],
    pricing: "Free tier available",
    configFields: [
      { name: "apiKey", label: "API Key", type: "password", required: true },
    ],
  },
  // Database & Backend
  {
    id: "supabase",
    name: "Supabase",
    description: "Open source Firebase alternative with PostgreSQL",
    category: "Database",
    icon: "supabase",
    features: ["PostgreSQL database", "Authentication", "Storage", "Edge functions"],
    pricing: "Free tier available",
    popular: true,
    configFields: [
      { name: "url", label: "Project URL", type: "url", required: true, placeholder: "https://xxx.supabase.co" },
      { name: "anonKey", label: "Anon Key", type: "password", required: true },
      { name: "serviceKey", label: "Service Role Key", type: "password", required: false },
    ],
  },
  {
    id: "firebase",
    name: "Firebase",
    description: "Google's app development platform",
    category: "Database",
    icon: "firebase",
    features: ["Realtime database", "Firestore", "Authentication", "Cloud functions"],
    pricing: "Free tier available",
    configFields: [
      { name: "projectId", label: "Project ID", type: "text", required: true },
      { name: "apiKey", label: "API Key", type: "password", required: true },
      { name: "serviceAccount", label: "Service Account JSON", type: "textarea", required: false },
    ],
  },
  {
    id: "redis",
    name: "Redis",
    description: "In-memory data store for caching and real-time data",
    category: "Database",
    icon: "redis",
    features: ["Caching", "Session storage", "Pub/Sub", "Real-time analytics"],
    pricing: "Free tier available",
    popular: true,
    configFields: [
      { name: "url", label: "Redis URL", type: "url", required: true, placeholder: "redis://..." },
      { name: "password", label: "Password", type: "password", required: false },
      { name: "tls", label: "Use TLS", type: "boolean", required: false },
    ],
  },
  {
    id: "mongodb",
    name: "MongoDB",
    description: "Document database for modern applications",
    category: "Database",
    icon: "mongodb",
    features: ["Document storage", "Atlas cloud", "Aggregation", "Full-text search"],
    pricing: "Free tier available",
    configFields: [
      { name: "connectionString", label: "Connection String", type: "password", required: true },
      { name: "database", label: "Database Name", type: "text", required: true },
    ],
  },
  // Automation & Integration
  {
    id: "zapier",
    name: "Zapier",
    description: "Connect apps and automate workflows",
    category: "Automation",
    icon: "zapier",
    features: ["5000+ app integrations", "Automated workflows", "Multi-step Zaps", "Filters"],
    pricing: "Free tier available",
    popular: true,
    configFields: [
      { name: "webhookUrl", label: "Webhook URL", type: "url", required: true, placeholder: "https://hooks.zapier.com/..." },
      { name: "apiKey", label: "API Key (optional)", type: "password", required: false },
    ],
  },
  {
    id: "make",
    name: "Make (Integromat)",
    description: "Visual automation platform",
    category: "Automation",
    icon: "make",
    features: ["Visual workflow builder", "1000+ apps", "Data transformation", "Error handling"],
    pricing: "Free tier available",
    popular: true,
    configFields: [
      { name: "webhookUrl", label: "Webhook URL", type: "url", required: true, placeholder: "https://hook.make.com/..." },
      { name: "apiKey", label: "API Key", type: "password", required: false },
    ],
  },
  {
    id: "n8n",
    name: "n8n",
    description: "Open-source workflow automation",
    category: "Automation",
    icon: "n8n",
    features: ["Self-hosted option", "200+ integrations", "Custom code nodes", "Webhooks"],
    pricing: "Free (self-hosted)",
    configFields: [
      { name: "baseUrl", label: "n8n Instance URL", type: "url", required: true },
      { name: "apiKey", label: "API Key", type: "password", required: true },
    ],
  },
  // Development
  {
    id: "github",
    name: "GitHub",
    description: "Code hosting and version control",
    category: "Development",
    icon: "github",
    features: ["Repository sync", "Pull requests", "Actions", "Issues"],
    pricing: "Free",
    popular: true,
    configFields: [
      { name: "accessToken", label: "Personal Access Token", type: "password", required: true },
    ],
  },
  {
    id: "gitlab",
    name: "GitLab",
    description: "DevOps platform",
    category: "Development",
    icon: "gitlab",
    features: ["Repository sync", "CI/CD", "Issue tracking", "Merge requests"],
    pricing: "Free",
    configFields: [
      { name: "accessToken", label: "Personal Access Token", type: "password", required: true },
      { name: "baseUrl", label: "GitLab URL (for self-hosted)", type: "url", required: false },
    ],
  },
  {
    id: "vercel",
    name: "Vercel",
    description: "Frontend deployment platform",
    category: "Development",
    icon: "vercel",
    features: ["Automatic deployments", "Preview URLs", "Edge functions", "Analytics"],
    pricing: "Free tier available",
    popular: true,
    configFields: [
      { name: "token", label: "API Token", type: "password", required: true },
      { name: "teamId", label: "Team ID (optional)", type: "text", required: false },
    ],
  },
  {
    id: "netlify",
    name: "Netlify",
    description: "Web deployment and hosting",
    category: "Development",
    icon: "netlify",
    features: ["Continuous deployment", "Forms", "Functions", "Split testing"],
    pricing: "Free tier available",
    configFields: [
      { name: "token", label: "Personal Access Token", type: "password", required: true },
      { name: "siteId", label: "Site ID", type: "text", required: false },
    ],
  },
  // Productivity
  {
    id: "slack",
    name: "Slack",
    description: "Team communication and notifications",
    category: "Productivity",
    icon: "slack",
    features: ["Notifications", "Slash commands", "Interactive messages", "Workflows"],
    pricing: "Free",
    popular: true,
    configFields: [
      { name: "webhookUrl", label: "Webhook URL", type: "url", required: true },
      { name: "botToken", label: "Bot Token (optional)", type: "password", required: false },
    ],
  },
  {
    id: "discord",
    name: "Discord",
    description: "Community and team communication",
    category: "Productivity",
    icon: "discord",
    features: ["Bot commands", "Webhooks", "Notifications", "Voice"],
    pricing: "Free",
    configFields: [
      { name: "webhookUrl", label: "Webhook URL", type: "url", required: true },
      { name: "botToken", label: "Bot Token (optional)", type: "password", required: false },
    ],
  },
  {
    id: "notion",
    name: "Notion",
    description: "All-in-one workspace",
    category: "Productivity",
    icon: "notion",
    features: ["Pages sync", "Database integration", "Comments", "Templates"],
    pricing: "Free",
    configFields: [
      { name: "apiKey", label: "Integration Token", type: "password", required: true },
    ],
  },
  {
    id: "airtable",
    name: "Airtable",
    description: "Spreadsheet-database hybrid",
    category: "Productivity",
    icon: "airtable",
    features: ["Bases", "Views", "Automations", "Apps"],
    pricing: "Free tier available",
    configFields: [
      { name: "apiKey", label: "API Key", type: "password", required: true },
      { name: "baseId", label: "Base ID", type: "text", required: false },
    ],
  },
  // AI & ML
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT models and AI capabilities",
    category: "AI & ML",
    icon: "openai",
    features: ["GPT-4", "DALL-E", "Embeddings", "Fine-tuning"],
    pricing: "Pay as you go",
    popular: true,
    configFields: [
      { name: "apiKey", label: "API Key", type: "password", required: true, placeholder: "sk-..." },
      { name: "organization", label: "Organization ID (optional)", type: "text", required: false },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    description: "Claude AI for advanced reasoning",
    category: "AI & ML",
    icon: "anthropic",
    features: ["Claude 3", "Long context", "Constitutional AI", "Artifacts"],
    pricing: "Pay as you go",
    configFields: [
      { name: "apiKey", label: "API Key", type: "password", required: true },
    ],
  },
  {
    id: "huggingface",
    name: "Hugging Face",
    description: "ML models and datasets",
    category: "AI & ML",
    icon: "huggingface",
    features: ["Model hub", "Inference API", "Spaces", "Datasets"],
    pricing: "Free tier available",
    configFields: [
      { name: "apiKey", label: "API Token", type: "password", required: true },
    ],
  },
  // Storage
  {
    id: "google-drive",
    name: "Google Drive",
    description: "Cloud file storage",
    category: "Storage",
    icon: "google-drive",
    features: ["File sync", "Sharing", "Collaboration", "Search"],
    pricing: "Free",
    popular: true,
    configFields: [
      { name: "accessToken", label: "Access Token", type: "password", required: true },
      { name: "refreshToken", label: "Refresh Token", type: "password", required: false },
    ],
  },
  {
    id: "dropbox",
    name: "Dropbox",
    description: "File hosting service",
    category: "Storage",
    icon: "dropbox",
    features: ["File sync", "Sharing", "Version history", "Smart sync"],
    pricing: "Free tier available",
    configFields: [
      { name: "accessToken", label: "Access Token", type: "password", required: true },
    ],
  },
  {
    id: "aws-s3",
    name: "AWS S3",
    description: "Object storage service",
    category: "Storage",
    icon: "aws",
    features: ["Object storage", "Static hosting", "Versioning", "Lifecycle policies"],
    pricing: "Pay as you go",
    configFields: [
      { name: "accessKeyId", label: "Access Key ID", type: "text", required: true },
      { name: "secretAccessKey", label: "Secret Access Key", type: "password", required: true },
      { name: "bucket", label: "Bucket Name", type: "text", required: true },
      { name: "region", label: "Region", type: "text", required: true },
    ],
  },
  // Analytics
  {
    id: "google-analytics",
    name: "Google Analytics",
    description: "Web analytics service",
    category: "Analytics",
    icon: "google-analytics",
    features: ["Page views", "User behavior", "Conversions", "Real-time"],
    pricing: "Free",
    configFields: [
      { name: "measurementId", label: "Measurement ID", type: "text", required: true, placeholder: "G-XXXXXXX" },
      { name: "apiSecret", label: "API Secret", type: "password", required: false },
    ],
  },
  {
    id: "mixpanel",
    name: "Mixpanel",
    description: "Product analytics",
    category: "Analytics",
    icon: "mixpanel",
    features: ["Event tracking", "Funnels", "Cohorts", "A/B testing"],
    pricing: "Free tier available",
    configFields: [
      { name: "token", label: "Project Token", type: "password", required: true },
      { name: "apiSecret", label: "API Secret", type: "password", required: false },
    ],
  },
  {
    id: "sentry",
    name: "Sentry",
    description: "Error tracking and monitoring",
    category: "Analytics",
    icon: "sentry",
    features: ["Error tracking", "Performance", "Releases", "Alerts"],
    pricing: "Free tier available",
    configFields: [
      { name: "dsn", label: "DSN", type: "url", required: true },
      { name: "authToken", label: "Auth Token (optional)", type: "password", required: false },
    ],
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
      description: integration?.description || "",
      category: integration?.category || "Other",
      icon: integration?.icon || inst.integrationId,
      status: inst.status,
      config: inst.config ? JSON.parse(inst.config as string) : {},
      installedAt: inst.installedAt?.toISOString(),
    };
  });

  return c.json({ integrations: enriched });
});

// Get integration details with config fields
integrations.get("/details/:integrationId", async (c) => {
  const integrationId = c.req.param("integrationId");
  
  const integration = AVAILABLE_INTEGRATIONS.find((i) => i.id === integrationId);
  if (!integration) {
    return c.json({ error: "Integration not found" }, 404);
  }

  return c.json({ integration });
});

// Install integration
integrations.post("/install", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const { integrationId, config } = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Check if integration exists in catalog
  const integration = AVAILABLE_INTEGRATIONS.find((i) => i.id === integrationId);
  if (!integration) {
    return c.json({ error: "Integration not found" }, 404);
  }

  // Validate required config fields
  if (integration.configFields) {
    for (const field of integration.configFields) {
      if (field.required && (!config || !config[field.name])) {
        return c.json({ error: `Missing required field: ${field.label}` }, 400);
      }
    }
  }

  // Check if already installed
  const existing = await db.query.installedIntegrations.findFirst({
    where: and(
      eq(schema.installedIntegrations.userId, user.id),
      eq(schema.installedIntegrations.integrationId, integrationId)
    ),
  });

  if (existing) {
    // Update existing installation
    const [updated] = await db
      .update(schema.installedIntegrations)
      .set({
        config: config ? JSON.stringify(config) : null,
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(schema.installedIntegrations.id, existing.id))
      .returning();

    return c.json({
      installation: {
        id: updated.id,
        integrationId: updated.integrationId,
        name: integration.name,
        status: updated.status,
        config: config || {},
        installedAt: updated.installedAt?.toISOString(),
      },
      message: "Integration updated successfully",
    });
  }

  // Test connection before installing (for certain integrations)
  const testResult = await testIntegrationConnection(integrationId, config);
  if (!testResult.success) {
    return c.json({ 
      error: testResult.message,
      details: "Connection test failed. Please check your credentials."
    }, 400);
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
    message: "Integration installed successfully",
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

  return c.json({ success: true, message: "Integration uninstalled" });
});

// Uninstall by integration ID
integrations.delete("/by-id/:integrationId", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const integrationId = c.req.param("integrationId");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await db
    .delete(schema.installedIntegrations)
    .where(
      and(
        eq(schema.installedIntegrations.integrationId, integrationId),
        eq(schema.installedIntegrations.userId, user.id)
      )
    );

  return c.json({ success: true, message: "Integration uninstalled" });
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

  // Get the installation to find the integration type
  const installation = await db.query.installedIntegrations.findFirst({
    where: and(
      eq(schema.installedIntegrations.id, installationId),
      eq(schema.installedIntegrations.userId, user.id)
    ),
  });

  if (!installation) {
    return c.json({ error: "Installation not found" }, 404);
  }

  // Test connection with new config
  const testResult = await testIntegrationConnection(installation.integrationId, config);
  if (!testResult.success) {
    return c.json({ 
      error: testResult.message,
      details: "Connection test failed with new configuration."
    }, 400);
  }

  await db
    .update(schema.installedIntegrations)
    .set({
      config: JSON.stringify(config),
      updatedAt: new Date(),
    })
    .where(eq(schema.installedIntegrations.id, installationId));

  return c.json({ success: true, message: "Configuration updated" });
});

// Test integration connection
integrations.post("/:installationId/test", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const installationId = parseInt(c.req.param("installationId"));

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const installation = await db.query.installedIntegrations.findFirst({
    where: and(
      eq(schema.installedIntegrations.id, installationId),
      eq(schema.installedIntegrations.userId, user.id)
    ),
  });

  if (!installation) {
    return c.json({ error: "Installation not found" }, 404);
  }

  const config = installation.config ? JSON.parse(installation.config as string) : {};
  const result = await testIntegrationConnection(installation.integrationId, config);

  return c.json(result);
});

// Helper function to test integration connections
async function testIntegrationConnection(integrationId: string, config: any): Promise<{ success: boolean; message: string }> {
  if (!config) {
    return { success: false, message: "No configuration provided" };
  }

  try {
    switch (integrationId) {
      case "stripe": {
        if (!config.apiKey) {
          return { success: false, message: "API key is required" };
        }
        const response = await fetch("https://api.stripe.com/v1/balance", {
          headers: { Authorization: `Bearer ${config.apiKey}` },
        });
        if (response.ok) {
          return { success: true, message: "Stripe connection verified" };
        }
        const error = await response.json() as any;
        return { success: false, message: error.error?.message || "Invalid API key" };
      }

      case "sendgrid": {
        if (!config.apiKey) {
          return { success: false, message: "API key is required" };
        }
        const response = await fetch("https://api.sendgrid.com/v3/user/profile", {
          headers: { Authorization: `Bearer ${config.apiKey}` },
        });
        if (response.ok) {
          return { success: true, message: "SendGrid connection verified" };
        }
        return { success: false, message: "Invalid API key" };
      }

      case "openai": {
        if (!config.apiKey) {
          return { success: false, message: "API key is required" };
        }
        const response = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${config.apiKey}` },
        });
        if (response.ok) {
          return { success: true, message: "OpenAI connection verified" };
        }
        return { success: false, message: "Invalid API key" };
      }

      case "supabase": {
        if (!config.url || !config.anonKey) {
          return { success: false, message: "URL and Anon Key are required" };
        }
        const response = await fetch(`${config.url}/rest/v1/`, {
          headers: { 
            apikey: config.anonKey,
            Authorization: `Bearer ${config.anonKey}`,
          },
        });
        if (response.ok || response.status === 404) {
          return { success: true, message: "Supabase connection verified" };
        }
        return { success: false, message: "Invalid credentials" };
      }

      case "redis": {
        if (!config.url) {
          return { success: false, message: "Redis URL is required" };
        }
        // For Redis, we can't easily test without a Redis client
        // Just validate URL format
        try {
          new URL(config.url);
          return { success: true, message: "Redis URL format valid" };
        } catch {
          return { success: false, message: "Invalid Redis URL format" };
        }
      }

      case "zapier":
      case "make": {
        if (!config.webhookUrl) {
          return { success: false, message: "Webhook URL is required" };
        }
        try {
          new URL(config.webhookUrl);
          return { success: true, message: "Webhook URL format valid" };
        } catch {
          return { success: false, message: "Invalid webhook URL format" };
        }
      }

      case "slack": {
        if (!config.webhookUrl) {
          return { success: false, message: "Webhook URL is required" };
        }
        // Test by sending a test message
        const response = await fetch(config.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: "ADELE integration test - connection successful!" }),
        });
        if (response.ok) {
          return { success: true, message: "Slack webhook verified" };
        }
        return { success: false, message: "Invalid webhook URL" };
      }

      case "discord": {
        if (!config.webhookUrl) {
          return { success: false, message: "Webhook URL is required" };
        }
        const response = await fetch(config.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "ADELE integration test - connection successful!" }),
        });
        if (response.ok || response.status === 204) {
          return { success: true, message: "Discord webhook verified" };
        }
        return { success: false, message: "Invalid webhook URL" };
      }

      case "github": {
        if (!config.accessToken) {
          return { success: false, message: "Access token is required" };
        }
        const response = await fetch("https://api.github.com/user", {
          headers: { Authorization: `Bearer ${config.accessToken}` },
        });
        if (response.ok) {
          return { success: true, message: "GitHub connection verified" };
        }
        return { success: false, message: "Invalid access token" };
      }

      case "vercel": {
        if (!config.token) {
          return { success: false, message: "API token is required" };
        }
        const response = await fetch("https://api.vercel.com/v2/user", {
          headers: { Authorization: `Bearer ${config.token}` },
        });
        if (response.ok) {
          return { success: true, message: "Vercel connection verified" };
        }
        return { success: false, message: "Invalid API token" };
      }

      default:
        // For integrations without specific tests, accept the config
        return { success: true, message: "Configuration saved" };
    }
  } catch (error) {
    return { success: false, message: `Connection test failed: ${error}` };
  }
}

export { integrations as integrationsRoutes };
