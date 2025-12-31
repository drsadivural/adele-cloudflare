import { Hono } from "hono";
import { eq } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import type { Env, Variables } from "../index";

export const userRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// Get user profile
userRoutes.get("/profile", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  
  const db = c.get("db");
  
  // Get settings
  const settings = await db.select()
    .from(schema.userSettings)
    .where(eq(schema.userSettings.userId, user.id))
    .get();
  
  // Get subscription
  const subscription = await db.select()
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.userId, user.id))
    .get();
  
  // Get biometrics
  const biometrics = await db.select()
    .from(schema.userBiometrics)
    .where(eq(schema.userBiometrics.userId, user.id))
    .get();
  
  // Get onboarding progress
  const onboarding = await db.select()
    .from(schema.onboardingProgress)
    .where(eq(schema.onboardingProgress.userId, user.id))
    .get();
  
  return c.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    },
    settings: settings ? {
      theme: settings.theme,
      language: settings.language,
      timezone: settings.timezone,
      voiceEnabled: settings.voiceEnabled,
      voiceLanguage: settings.voiceLanguage,
      ttsEnabled: settings.ttsEnabled,
      ttsProvider: settings.ttsProvider,
      editorFontSize: settings.editorFontSize,
      editorTabSize: settings.editorTabSize,
      autoSave: settings.autoSave,
      notifications: settings.notifications ? JSON.parse(settings.notifications) : null,
    } : null,
    subscription: subscription ? {
      plan: subscription.plan,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    } : null,
    biometrics: biometrics ? {
      hasVoiceSample: !!biometrics.voiceSampleUrl,
      hasFacePhoto: !!biometrics.facePhotoUrl,
      biometricLoginEnabled: biometrics.biometricLoginEnabled,
    } : null,
    onboarding: onboarding ? {
      currentStep: onboarding.currentStep,
      completedSteps: onboarding.completedSteps ? JSON.parse(onboarding.completedSteps) : [],
      isCompleted: onboarding.isCompleted,
    } : null,
  });
});

// Update user profile
userRoutes.patch("/profile", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  
  const db = c.get("db");
  const body = await c.req.json();
  
  const { name, avatarUrl } = body;
  
  const updateData: Partial<schema.InsertUser> = {
    updatedAt: new Date(),
  };
  
  if (name !== undefined) updateData.name = name;
  if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
  
  const result = await db.update(schema.users)
    .set(updateData)
    .where(eq(schema.users.id, user.id))
    .returning();
  
  return c.json({ 
    user: {
      id: result[0].id,
      email: result[0].email,
      name: result[0].name,
      avatarUrl: result[0].avatarUrl,
    }
  });
});

// Update user settings
userRoutes.patch("/settings", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  
  const db = c.get("db");
  const body = await c.req.json();
  
  const {
    theme,
    language,
    timezone,
    voiceEnabled,
    voiceLanguage,
    ttsEnabled,
    ttsProvider,
    editorFontSize,
    editorTabSize,
    autoSave,
    notifications,
  } = body;
  
  // Check if settings exist
  const existing = await db.select()
    .from(schema.userSettings)
    .where(eq(schema.userSettings.userId, user.id))
    .get();
  
  const settingsData: any = {
    updatedAt: new Date(),
  };
  
  if (theme !== undefined) settingsData.theme = theme;
  if (language !== undefined) settingsData.language = language;
  if (timezone !== undefined) settingsData.timezone = timezone;
  if (voiceEnabled !== undefined) settingsData.voiceEnabled = voiceEnabled;
  if (voiceLanguage !== undefined) settingsData.voiceLanguage = voiceLanguage;
  if (ttsEnabled !== undefined) settingsData.ttsEnabled = ttsEnabled;
  if (ttsProvider !== undefined) settingsData.ttsProvider = ttsProvider;
  if (editorFontSize !== undefined) settingsData.editorFontSize = editorFontSize;
  if (editorTabSize !== undefined) settingsData.editorTabSize = editorTabSize;
  if (autoSave !== undefined) settingsData.autoSave = autoSave;
  if (notifications !== undefined) settingsData.notifications = JSON.stringify(notifications);
  
  if (existing) {
    await db.update(schema.userSettings)
      .set(settingsData)
      .where(eq(schema.userSettings.userId, user.id));
  } else {
    await db.insert(schema.userSettings).values({
      userId: user.id,
      ...settingsData,
    });
  }
  
  return c.json({ success: true });
});

// Get tool connections
userRoutes.get("/connections", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  
  const db = c.get("db");
  
  const connections = await db.select()
    .from(schema.toolConnections)
    .where(eq(schema.toolConnections.userId, user.id));
  
  return c.json({ 
    connections: connections.map(conn => ({
      id: conn.id,
      provider: conn.provider,
      name: conn.name,
      status: conn.status,
      lastUsed: conn.lastUsed,
      createdAt: conn.createdAt,
      // Don't expose config (contains secrets)
    }))
  });
});

// Add tool connection
userRoutes.post("/connections", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  
  const db = c.get("db");
  const body = await c.req.json();
  
  const { provider, name, config } = body;
  
  if (!provider || !name) {
    return c.json({ error: "Provider and name are required" }, 400);
  }
  
  const result = await db.insert(schema.toolConnections).values({
    userId: user.id,
    provider,
    name,
    config: config ? JSON.stringify(config) : null,
    status: "connected",
  }).returning();
  
  return c.json({ 
    connection: {
      id: result[0].id,
      provider: result[0].provider,
      name: result[0].name,
      status: result[0].status,
    }
  });
});

// Delete tool connection
userRoutes.delete("/connections/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  
  const db = c.get("db");
  const connectionId = parseInt(c.req.param("id"));
  
  await db.delete(schema.toolConnections)
    .where(eq(schema.toolConnections.id, connectionId));
  
  return c.json({ success: true });
});

// Update onboarding progress
userRoutes.patch("/onboarding", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  
  const db = c.get("db");
  const body = await c.req.json();
  
  const { currentStep, completedSteps, isCompleted, skipped } = body;
  
  const existing = await db.select()
    .from(schema.onboardingProgress)
    .where(eq(schema.onboardingProgress.userId, user.id))
    .get();
  
  const updateData: any = {};
  
  if (currentStep !== undefined) updateData.currentStep = currentStep;
  if (completedSteps !== undefined) updateData.completedSteps = JSON.stringify(completedSteps);
  if (isCompleted !== undefined) {
    updateData.isCompleted = isCompleted;
    if (isCompleted) updateData.completedAt = new Date();
  }
  if (skipped) updateData.skippedAt = new Date();
  
  if (existing) {
    await db.update(schema.onboardingProgress)
      .set(updateData)
      .where(eq(schema.onboardingProgress.userId, user.id));
  } else {
    await db.insert(schema.onboardingProgress).values({
      userId: user.id,
      ...updateData,
    });
  }
  
  return c.json({ success: true });
});

// Update biometrics
userRoutes.patch("/biometrics", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  
  const db = c.get("db");
  const body = await c.req.json();
  
  const { 
    voiceSampleUrl, 
    voiceEmbedding, 
    voiceQualityScore,
    facePhotoUrl,
    faceEmbedding,
    biometricLoginEnabled,
  } = body;
  
  const existing = await db.select()
    .from(schema.userBiometrics)
    .where(eq(schema.userBiometrics.userId, user.id))
    .get();
  
  const updateData: any = {
    updatedAt: new Date(),
  };
  
  if (voiceSampleUrl !== undefined) updateData.voiceSampleUrl = voiceSampleUrl;
  if (voiceEmbedding !== undefined) updateData.voiceEmbedding = JSON.stringify(voiceEmbedding);
  if (voiceQualityScore !== undefined) updateData.voiceQualityScore = voiceQualityScore;
  if (facePhotoUrl !== undefined) updateData.facePhotoUrl = facePhotoUrl;
  if (faceEmbedding !== undefined) updateData.faceEmbedding = JSON.stringify(faceEmbedding);
  if (biometricLoginEnabled !== undefined) updateData.biometricLoginEnabled = biometricLoginEnabled;
  
  if (existing) {
    await db.update(schema.userBiometrics)
      .set(updateData)
      .where(eq(schema.userBiometrics.userId, user.id));
  } else {
    await db.insert(schema.userBiometrics).values({
      userId: user.id,
      ...updateData,
    });
  }
  
  return c.json({ success: true });
});
