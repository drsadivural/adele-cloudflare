import { Hono } from "hono";
import { eq, and, desc, asc } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { authMiddleware } from "../middleware/auth";
import { Env, Variables } from "../index";

const mail = new Hono<{ Bindings: Env; Variables: Variables }>();

// Apply auth middleware to all routes
mail.use("*", authMiddleware);

// Get email agent settings
mail.get("/agent/settings", async (c) => {
  const user = c.get("user");
  const db = c.get("db");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const settings = await db.query.emailAgentSettings.findFirst({
    where: eq(schema.emailAgentSettings.userId, user.id),
  });

  if (!settings) {
    return c.json({
      settings: {
        enabled: false,
        autoReply: false,
        autoReplyDelay: 5,
        summarize: true,
        categorize: true,
        prioritize: true,
        workingHours: null,
      },
    });
  }

  return c.json({
    settings: {
      enabled: settings.enabled,
      autoReply: settings.autoReply,
      autoReplyDelay: settings.autoReplyDelay,
      summarize: settings.summarize,
      categorize: settings.categorize,
      prioritize: settings.prioritize,
      workingHours: settings.workingHours ? JSON.parse(settings.workingHours as string) : null,
    },
  });
});

// Update email agent settings
mail.patch("/agent/settings", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const body = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const existing = await db.query.emailAgentSettings.findFirst({
    where: eq(schema.emailAgentSettings.userId, user.id),
  });

  if (existing) {
    await db
      .update(schema.emailAgentSettings)
      .set({
        enabled: body.enabled ?? existing.enabled,
        autoReply: body.autoReply ?? existing.autoReply,
        autoReplyDelay: body.autoReplyDelay ?? existing.autoReplyDelay,
        summarize: body.summarize ?? existing.summarize,
        categorize: body.categorize ?? existing.categorize,
        prioritize: body.prioritize ?? existing.prioritize,
        workingHours: body.workingHours ? JSON.stringify(body.workingHours) : existing.workingHours,
        updatedAt: new Date(),
      })
      .where(eq(schema.emailAgentSettings.userId, user.id));
  } else {
    await db.insert(schema.emailAgentSettings).values({
      userId: user.id,
      enabled: body.enabled ?? false,
      autoReply: body.autoReply ?? false,
      autoReplyDelay: body.autoReplyDelay ?? 5,
      summarize: body.summarize ?? true,
      categorize: body.categorize ?? true,
      prioritize: body.prioritize ?? true,
      workingHours: body.workingHours ? JSON.stringify(body.workingHours) : null,
    });
  }

  return c.json({ success: true });
});

// Get email agent rules
mail.get("/agent/rules", async (c) => {
  const user = c.get("user");
  const db = c.get("db");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const rules = await db.query.emailAgentRules.findMany({
    where: eq(schema.emailAgentRules.userId, user.id),
    orderBy: asc(schema.emailAgentRules.priority),
  });

  return c.json({
    rules: rules.map((r) => ({
      id: r.id,
      name: r.name,
      trigger: r.trigger,
      conditions: r.conditions ? JSON.parse(r.conditions as string) : {},
      action: r.action,
      actionConfig: r.actionConfig ? JSON.parse(r.actionConfig as string) : {},
      enabled: r.enabled,
      priority: r.priority,
    })),
  });
});

// Create email agent rule
mail.post("/agent/rules", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const body = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const [rule] = await db
    .insert(schema.emailAgentRules)
    .values({
      userId: user.id,
      name: body.name,
      trigger: body.trigger,
      conditions: body.conditions ? JSON.stringify(body.conditions) : null,
      action: body.action,
      actionConfig: body.actionConfig ? JSON.stringify(body.actionConfig) : null,
      enabled: body.enabled ?? true,
      priority: body.priority ?? 0,
    })
    .returning();

  return c.json({
    rule: {
      id: rule.id,
      name: rule.name,
      trigger: rule.trigger,
      conditions: body.conditions || {},
      action: rule.action,
      actionConfig: body.actionConfig || {},
      enabled: rule.enabled,
      priority: rule.priority,
    },
  });
});

// Update email agent rule
mail.patch("/agent/rules/:id", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const existing = await db.query.emailAgentRules.findFirst({
    where: and(
      eq(schema.emailAgentRules.id, id),
      eq(schema.emailAgentRules.userId, user.id)
    ),
  });

  if (!existing) {
    return c.json({ error: "Rule not found" }, 404);
  }

  await db
    .update(schema.emailAgentRules)
    .set({
      name: body.name ?? existing.name,
      trigger: body.trigger ?? existing.trigger,
      conditions: body.conditions ? JSON.stringify(body.conditions) : existing.conditions,
      action: body.action ?? existing.action,
      actionConfig: body.actionConfig ? JSON.stringify(body.actionConfig) : existing.actionConfig,
      enabled: body.enabled ?? existing.enabled,
      priority: body.priority ?? existing.priority,
      updatedAt: new Date(),
    })
    .where(eq(schema.emailAgentRules.id, id));

  return c.json({ success: true });
});

// Delete email agent rule
mail.delete("/agent/rules/:id", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await db
    .delete(schema.emailAgentRules)
    .where(
      and(
        eq(schema.emailAgentRules.id, id),
        eq(schema.emailAgentRules.userId, user.id)
      )
    );

  return c.json({ success: true });
});

// Get connected email accounts
mail.get("/accounts", async (c) => {
  const user = c.get("user");
  const db = c.get("db");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const accounts = await db.query.emailAccounts.findMany({
    where: eq(schema.emailAccounts.userId, user.id),
    orderBy: desc(schema.emailAccounts.createdAt),
  });

  return c.json({
    accounts: accounts.map((a) => ({
      id: a.id,
      email: a.email,
      provider: a.provider,
      status: a.status,
      lastSyncAt: a.lastSyncAt?.toISOString(),
      createdAt: a.createdAt?.toISOString(),
    })),
  });
});

// Initiate OAuth for email provider
mail.get("/oauth/:provider", async (c) => {
  const user = c.get("user");
  const provider = c.req.param("provider");
  const env = c.env;

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const oauthConfigs: Record<string, { authUrl: string; clientId: string | undefined; scope: string }> = {
    google: {
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      clientId: env.GOOGLE_CLIENT_ID,
      scope: "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify",
    },
    microsoft: {
      authUrl: `https://login.microsoftonline.com/${env.MICROSOFT_TENANT_ID || "common"}/oauth2/v2.0/authorize`,
      clientId: env.MICROSOFT_CLIENT_ID,
      scope: "Mail.Read Mail.Send Mail.ReadWrite offline_access",
    },
  };

  const config = oauthConfigs[provider];
  if (!config || !config.clientId) {
    return c.json({ error: "Provider not configured" }, 400);
  }

  const state = Buffer.from(
    JSON.stringify({
      userId: user.id,
      provider,
      type: "email",
      timestamp: Date.now(),
    })
  ).toString("base64");

  const redirectUri = `${env.APP_URL}/api/mail/oauth/callback`;

  const url = new URL(config.authUrl);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", config.scope);
  url.searchParams.set("state", state);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");

  return c.json({ authUrl: url.toString() });
});

// OAuth callback for email
mail.get("/oauth/callback", async (c) => {
  const db = c.get("db");
  const code = c.req.query("code");
  const state = c.req.query("state");

  if (!code || !state) {
    return c.redirect(`${c.env.APP_URL}/settings?tab=mail&error=missing_params`);
  }

  try {
    const stateData = JSON.parse(Buffer.from(state, "base64").toString());
    const { userId, provider } = stateData;

    // TODO: Exchange code for tokens and get user email
    await db.insert(schema.emailAccounts).values({
      userId,
      email: `connected@${provider}.com`,
      provider,
      status: "connected",
      accessToken: "encrypted_token",
      refreshToken: "encrypted_refresh",
      lastSyncAt: new Date(),
    });

    return c.redirect(`${c.env.APP_URL}/settings?tab=mail&success=true`);
  } catch (error) {
    return c.redirect(`${c.env.APP_URL}/settings?tab=mail&error=oauth_failed`);
  }
});

// Disconnect email account
mail.delete("/accounts/:id", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await db
    .delete(schema.emailAccounts)
    .where(
      and(
        eq(schema.emailAccounts.id, id),
        eq(schema.emailAccounts.userId, user.id)
      )
    );

  return c.json({ success: true });
});

// Get emails (from connected accounts)
mail.get("/emails", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const folder = c.req.query("folder") || "inbox";
  const limit = parseInt(c.req.query("limit") || "50");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const emails = await db.query.emailsExtended.findMany({
    where: and(
      eq(schema.emailsExtended.userId, user.id),
      eq(schema.emailsExtended.folder, folder)
    ),
    orderBy: desc(schema.emailsExtended.receivedAt),
    limit,
  });

  return c.json({
    emails: emails.map((e) => ({
      id: e.id,
      from: e.fromAddress,
      to: e.toAddresses ? JSON.parse(e.toAddresses as string) : [],
      cc: e.ccAddresses ? JSON.parse(e.ccAddresses as string) : [],
      subject: e.subject,
      body: e.body,
      htmlBody: e.htmlBody,
      folder: e.folder,
      isRead: e.isRead,
      isStarred: e.isStarred,
      hasAttachments: e.hasAttachments,
      receivedAt: e.receivedAt?.toISOString(),
      agentProcessed: e.agentProcessed,
      agentSummary: e.agentSummary,
      agentDraft: e.agentDraft,
    })),
  });
});

// Get single email
mail.get("/emails/:id", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const email = await db.query.emailsExtended.findFirst({
    where: and(
      eq(schema.emailsExtended.id, id),
      eq(schema.emailsExtended.userId, user.id)
    ),
  });

  if (!email) {
    return c.json({ error: "Email not found" }, 404);
  }

  // Mark as read
  if (!email.isRead) {
    await db
      .update(schema.emailsExtended)
      .set({ isRead: true })
      .where(eq(schema.emailsExtended.id, id));
  }

  return c.json({
    email: {
      id: email.id,
      from: email.fromAddress,
      to: email.toAddresses ? JSON.parse(email.toAddresses as string) : [],
      cc: email.ccAddresses ? JSON.parse(email.ccAddresses as string) : [],
      subject: email.subject,
      body: email.body,
      htmlBody: email.htmlBody,
      folder: email.folder,
      isRead: true,
      isStarred: email.isStarred,
      hasAttachments: email.hasAttachments,
      receivedAt: email.receivedAt?.toISOString(),
      agentProcessed: email.agentProcessed,
      agentSummary: email.agentSummary,
      agentDraft: email.agentDraft,
    },
  });
});

// Update email (star, move to folder, etc.)
mail.patch("/emails/:id", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const existing = await db.query.emailsExtended.findFirst({
    where: and(
      eq(schema.emailsExtended.id, id),
      eq(schema.emailsExtended.userId, user.id)
    ),
  });

  if (!existing) {
    return c.json({ error: "Email not found" }, 404);
  }

  await db
    .update(schema.emailsExtended)
    .set({
      isRead: body.isRead ?? existing.isRead,
      isStarred: body.isStarred ?? existing.isStarred,
      folder: body.folder ?? existing.folder,
      updatedAt: new Date(),
    })
    .where(eq(schema.emailsExtended.id, id));

  return c.json({ success: true });
});

// Delete email
mail.delete("/emails/:id", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Move to trash instead of hard delete
  await db
    .update(schema.emailsExtended)
    .set({ folder: "trash", updatedAt: new Date() })
    .where(
      and(
        eq(schema.emailsExtended.id, id),
        eq(schema.emailsExtended.userId, user.id)
      )
    );

  return c.json({ success: true });
});

// Send email
mail.post("/send", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const body = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // TODO: Actually send email via connected account
  const [email] = await db
    .insert(schema.emailsExtended)
    .values({
      userId: user.id,
      fromAddress: user.email,
      toAddresses: JSON.stringify(body.to),
      ccAddresses: body.cc ? JSON.stringify(body.cc) : null,
      subject: body.subject,
      body: body.body,
      htmlBody: body.htmlBody,
      folder: "sent",
      isRead: true,
      isStarred: false,
      hasAttachments: false,
      receivedAt: new Date(),
    })
    .returning();

  return c.json({
    success: true,
    email: {
      id: email.id,
      from: email.fromAddress,
      to: body.to,
      subject: email.subject,
    },
  });
});

// Process email with AI agent
mail.post("/emails/:id/process", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const email = await db.query.emailsExtended.findFirst({
    where: and(
      eq(schema.emailsExtended.id, id),
      eq(schema.emailsExtended.userId, user.id)
    ),
  });

  if (!email) {
    return c.json({ error: "Email not found" }, 404);
  }

  // TODO: Call AI service to process email
  const summary = `Summary of email from ${email.fromAddress}: ${email.subject}`;
  const draft = `Thank you for your email regarding "${email.subject}". I will review and respond shortly.`;

  await db
    .update(schema.emailsExtended)
    .set({
      agentProcessed: true,
      agentSummary: summary,
      agentDraft: draft,
      updatedAt: new Date(),
    })
    .where(eq(schema.emailsExtended.id, id));

  return c.json({
    success: true,
    summary,
    draft,
  });
});

export { mail as mailRoutes };
