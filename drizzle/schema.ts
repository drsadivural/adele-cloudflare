import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ============================================
// USERS & AUTHENTICATION
// ============================================

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false),
  verificationToken: text("verification_token"),
  resetToken: text("reset_token"),
  resetTokenExpiry: integer("reset_token_expiry"),
  avatarUrl: text("avatar_url"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  lastSignedIn: integer("last_signed_in", { mode: "timestamp" }),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// PROJECTS
// ============================================

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type", { 
    enum: ["web", "mobile", "desktop", "api", "saas", "enterprise"] 
  }).default("web"),
  status: text("status", { 
    enum: ["draft", "generating", "completed", "deployed", "failed"] 
  }).default("draft"),
  techStack: text("tech_stack"), // JSON string
  deploymentUrl: text("deployment_url"),
  repositoryUrl: text("repository_url"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// CHAT MESSAGES
// ============================================

export const chatMessages = sqliteTable("chat_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
  content: text("content").notNull(),
  metadata: text("metadata"), // JSON string for agent info, etc.
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// GENERATED FILES
// ============================================

export const generatedFiles = sqliteTable("generated_files", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  path: text("path").notNull(),
  content: text("content").notNull(),
  language: text("language"),
  version: integer("version").default(1),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// AGENT TASKS
// ============================================

export const agentTasks = sqliteTable("agent_tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  agentType: text("agent_type", { 
    enum: ["coordinator", "research", "coder", "database", "security", "reporter", "browser"] 
  }).notNull(),
  status: text("status", { 
    enum: ["pending", "running", "completed", "failed"] 
  }).default("pending"),
  input: text("input"),
  output: text("output"),
  errorMessage: text("error_message"),
  startedAt: integer("started_at", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// TEMPLATES
// ============================================

export const appTemplates = sqliteTable("app_templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  icon: text("icon"),
  techStack: text("tech_stack"), // JSON string
  features: text("features"), // JSON string array
  previewImage: text("preview_image"),
  basePrompt: text("base_prompt"),
  usageCount: integer("usage_count").default(0),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// PROJECT VERSIONS (Version Control)
// ============================================

export const projectVersions = sqliteTable("project_versions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  commitMessage: text("commit_message"),
  snapshot: text("snapshot"), // JSON string of all files
  createdBy: integer("created_by").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// SUBSCRIPTIONS & PAYMENTS
// ============================================

export const subscriptions = sqliteTable("subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  plan: text("plan", { enum: ["free", "pro", "enterprise"] }).default("free").notNull(),
  status: text("status", { enum: ["active", "canceled", "past_due", "trialing"] }).default("active"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  currentPeriodStart: integer("current_period_start", { mode: "timestamp" }),
  currentPeriodEnd: integer("current_period_end", { mode: "timestamp" }),
  cancelAtPeriodEnd: integer("cancel_at_period_end", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  amount: integer("amount").notNull(), // in cents
  currency: text("currency").default("usd"),
  status: text("status", { enum: ["pending", "succeeded", "failed", "refunded"] }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// USER SETTINGS
// ============================================

export const userSettings = sqliteTable("user_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  theme: text("theme", { enum: ["light", "dark", "system"] }).default("system"),
  language: text("language").default("en"),
  timezone: text("timezone").default("UTC"),
  voiceEnabled: integer("voice_enabled", { mode: "boolean" }).default(true),
  voiceLanguage: text("voice_language").default("en-US"),
  ttsEnabled: integer("tts_enabled", { mode: "boolean" }).default(false),
  ttsProvider: text("tts_provider"),
  editorFontSize: integer("editor_font_size").default(14),
  editorTabSize: integer("editor_tab_size").default(2),
  autoSave: integer("auto_save", { mode: "boolean" }).default(true),
  notifications: text("notifications"), // JSON string
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// TOOL CONNECTIONS
// ============================================

export const toolConnections = sqliteTable("tool_connections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // github, slack, openai, etc.
  name: text("name").notNull(),
  config: text("config"), // Encrypted JSON
  status: text("status", { enum: ["connected", "disconnected", "error"] }).default("disconnected"),
  lastUsed: integer("last_used", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// BIOMETRICS
// ============================================

export const userBiometrics = sqliteTable("user_biometrics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  voiceSampleUrl: text("voice_sample_url"),
  voiceEmbedding: text("voice_embedding"), // JSON array
  voiceQualityScore: real("voice_quality_score"),
  facePhotoUrl: text("face_photo_url"),
  faceEmbedding: text("face_embedding"), // JSON array
  biometricLoginEnabled: integer("biometric_login_enabled", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// ONBOARDING
// ============================================

export const onboardingProgress = sqliteTable("onboarding_progress", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  currentStep: integer("current_step").default(0),
  completedSteps: text("completed_steps"), // JSON array
  isCompleted: integer("is_completed", { mode: "boolean" }).default(false),
  skippedAt: integer("skipped_at", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// ANALYTICS
// ============================================

export const analyticsEvents = sqliteTable("analytics_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  eventType: text("event_type").notNull(),
  eventData: text("event_data"), // JSON string
  sessionId: text("session_id"),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// ADMIN CONFIGURATION
// ============================================

export const adminConfig = sqliteTable("admin_config", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value"),
  isEncrypted: integer("is_encrypted", { mode: "boolean" }).default(false),
  updatedBy: integer("updated_by").references(() => users.id),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type GeneratedFile = typeof generatedFiles.$inferSelect;
export type AgentTask = typeof agentTasks.$inferSelect;
export type AppTemplate = typeof appTemplates.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
