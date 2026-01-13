import { sqliteTable, text, integer, real, blob } from "drizzle-orm/sqlite-core";

// ============================================
// USERS & AUTHENTICATION
// ============================================

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  // Column is named "password" in the actual database (stores bcrypt hash)
  passwordHash: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["user", "admin", "owner"] }).default("user"),
  phone: text("phone"),
  company: text("company"),
  position: text("position"),
  faceEmbedding: text("face_embedding"),
  voiceEmbedding: text("voice_embedding"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  deviceInfo: text("device_info"), // JSON with device details
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  lastActiveAt: integer("last_active_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// TEAMS & ORGANIZATIONS
// ============================================

export const organizations = sqliteTable("organizations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  logoUrl: text("logo_url"),
  settings: text("settings"), // JSON
  dataRetentionDays: integer("data_retention_days").default(365),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const teamMembers = sqliteTable("team_members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["owner", "admin", "member", "viewer"] }).default("member").notNull(),
  invitedBy: integer("invited_by").references(() => users.id),
  invitedAt: integer("invited_at", { mode: "timestamp" }),
  joinedAt: integer("joined_at", { mode: "timestamp" }),
  status: text("status", { enum: ["pending", "active", "suspended"] }).default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const teamInvitations = sqliteTable("team_invitations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role", { enum: ["admin", "member", "viewer"] }).default("member").notNull(),
  token: text("token").notNull().unique(),
  invitedBy: integer("invited_by").notNull().references(() => users.id),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// PROJECTS
// ============================================

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  organizationId: integer("organization_id").references(() => organizations.id, { onDelete: "set null" }),
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
  organizationId: integer("organization_id").references(() => organizations.id),
  plan: text("plan", { enum: ["free", "pro", "enterprise"] }).default("free").notNull(),
  status: text("status", { enum: ["active", "canceled", "past_due", "trialing"] }).default("active"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  currentPeriodStart: integer("current_period_start", { mode: "timestamp" }),
  currentPeriodEnd: integer("current_period_end", { mode: "timestamp" }),
  cancelAtPeriodEnd: integer("cancel_at_period_end", { mode: "boolean" }).default(false),
  creditsLimit: integer("credits_limit").default(1000),
  creditsUsed: integer("credits_used").default(0),
  concurrencyLimit: integer("concurrency_limit").default(1),
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
  invoiceUrl: text("invoice_url"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// USAGE TRACKING
// ============================================

export const usageRecords = sqliteTable("usage_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  organizationId: integer("organization_id").references(() => organizations.id),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
  type: text("type", { enum: ["credits", "tokens", "tool_calls", "storage", "runs"] }).notNull(),
  amount: integer("amount").notNull(),
  metadata: text("metadata"), // JSON with details
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
  ttsProvider: text("tts_provider").default("browser"),
  ttsVoice: text("tts_voice"),
  sttProvider: text("stt_provider").default("browser"),
  defaultModel: text("default_model").default("gpt-4"),
  defaultProvider: text("default_provider").default("openai"),
  proactiveVoice: integer("proactive_voice", { mode: "boolean" }).default(false),
  wakeWordEnabled: integer("wake_word_enabled", { mode: "boolean" }).default(false),
  wakeWord: text("wake_word").default("hey adele"),
  editorFontSize: integer("editor_font_size").default(14),
  editorTabSize: integer("editor_tab_size").default(2),
  autoSave: integer("auto_save", { mode: "boolean" }).default(true),
  notifications: text("notifications"), // JSON string
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// API KEYS
// ============================================

export const apiKeys = sqliteTable("api_keys", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  keyHash: text("key_hash").notNull(), // Hashed API key
  keyPrefix: text("key_prefix").notNull(), // First 8 chars for identification
  scopes: text("scopes"), // JSON array of permissions
  lastUsedAt: integer("last_used_at", { mode: "timestamp" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  revokedAt: integer("revoked_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// TOOL CONNECTIONS
// ============================================

export const toolConnections = sqliteTable("tool_connections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  organizationId: integer("organization_id").references(() => organizations.id),
  provider: text("provider").notNull(), // github, slack, openai, aws, azure, oracle, etc.
  name: text("name").notNull(),
  config: text("config"), // Encrypted JSON
  status: text("status", { enum: ["connected", "disconnected", "error"] }).default("disconnected"),
  lastSyncAt: integer("last_sync_at", { mode: "timestamp" }),
  lastUsedAt: integer("last_used_at", { mode: "timestamp" }),
  errorMessage: text("error_message"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// EMAIL CONNECTIONS (Mail ADELE)
// ============================================

export const emailConnections = sqliteTable("email_connections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider", { enum: ["imap", "gmail", "outlook", "yahoo"] }).notNull(),
  email: text("email").notNull(),
  config: text("config"), // Encrypted JSON (IMAP/SMTP settings or OAuth tokens)
  status: text("status", { enum: ["connected", "disconnected", "error"] }).default("disconnected"),
  lastSyncAt: integer("last_sync_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const emails = sqliteTable("emails", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  connectionId: integer("connection_id").notNull().references(() => emailConnections.id, { onDelete: "cascade" }),
  messageId: text("message_id").notNull(),
  threadId: text("thread_id"),
  subject: text("subject"),
  fromAddress: text("from_address"),
  toAddresses: text("to_addresses"), // JSON array
  ccAddresses: text("cc_addresses"), // JSON array
  bodyText: text("body_text"),
  bodyHtml: text("body_html"),
  attachments: text("attachments"), // JSON array
  isRead: integer("is_read", { mode: "boolean" }).default(false),
  isStarred: integer("is_starred", { mode: "boolean" }).default(false),
  folder: text("folder").default("inbox"),
  receivedAt: integer("received_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const emailDrafts = sqliteTable("email_drafts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  connectionId: integer("connection_id").notNull().references(() => emailConnections.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  toAddresses: text("to_addresses"), // JSON array
  ccAddresses: text("cc_addresses"), // JSON array
  subject: text("subject"),
  bodyText: text("body_text"),
  bodyHtml: text("body_html"),
  attachments: text("attachments"), // JSON array
  scheduledAt: integer("scheduled_at", { mode: "timestamp" }),
  status: text("status", { enum: ["draft", "scheduled", "sent", "failed"] }).default("draft"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// SCHEDULED WORKS
// ============================================

export const scheduledWorks = sqliteTable("scheduled_works", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  organizationId: integer("organization_id").references(() => organizations.id),
  name: text("name").notNull(),
  description: text("description"),
  cronExpression: text("cron_expression").notNull(),
  timezone: text("timezone").default("UTC"),
  agentPrompt: text("agent_prompt").notNull(),
  retryPolicy: text("retry_policy"), // JSON { maxRetries, backoffMs }
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  lastRunAt: integer("last_run_at", { mode: "timestamp" }),
  nextRunAt: integer("next_run_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const scheduledWorkRuns = sqliteTable("scheduled_work_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  scheduledWorkId: integer("scheduled_work_id").notNull().references(() => scheduledWorks.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["pending", "running", "completed", "failed", "cancelled"] }).default("pending"),
  output: text("output"),
  artifacts: text("artifacts"), // JSON array of file paths
  logs: text("logs"),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),
  startedAt: integer("started_at", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// DATA CONTROLS
// ============================================

export const dataRetentionPolicies = sqliteTable("data_retention_policies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }),
  retentionDays: integer("retention_days").notNull(),
  dataTypes: text("data_types"), // JSON array of data types to retain
  autoDelete: integer("auto_delete", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const userUploads = sqliteTable("user_uploads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type"),
  storagePath: text("storage_path").notNull(),
  isDeleted: integer("is_deleted", { mode: "boolean" }).default(false),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const ragDataSources = sqliteTable("rag_data_sources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  organizationId: integer("organization_id").references(() => organizations.id),
  name: text("name").notNull(),
  type: text("type", { enum: ["file", "url", "database", "api"] }).notNull(),
  config: text("config"), // JSON with source configuration
  indexStatus: text("index_status", { enum: ["pending", "indexing", "indexed", "failed"] }).default("pending"),
  vectorCount: integer("vector_count").default(0),
  lastIndexedAt: integer("last_indexed_at", { mode: "timestamp" }),
  errorMessage: text("error_message"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// CLOUD BROWSER (Storage Explorer)
// ============================================

export const cloudStorageConnections = sqliteTable("cloud_storage_connections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  organizationId: integer("organization_id").references(() => organizations.id),
  provider: text("provider", { enum: ["s3", "azure_blob", "oracle_object", "gcs", "r2"] }).notNull(),
  name: text("name").notNull(),
  config: text("config"), // Encrypted JSON with credentials
  status: text("status", { enum: ["connected", "disconnected", "error"] }).default("disconnected"),
  lastAccessedAt: integer("last_accessed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const cloudStorageAccessLogs = sqliteTable("cloud_storage_access_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  connectionId: integer("connection_id").notNull().references(() => cloudStorageConnections.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id),
  action: text("action", { enum: ["list", "upload", "download", "delete", "copy", "move", "share"] }).notNull(),
  path: text("path"),
  details: text("details"), // JSON with action details
  ipAddress: text("ip_address"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// CONNECTORS MARKETPLACE
// ============================================

export const connectorDefinitions = sqliteTable("connector_definitions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  icon: text("icon"),
  configSchema: text("config_schema"), // JSON Schema for configuration
  scopes: text("scopes"), // JSON array of available scopes
  authType: text("auth_type", { enum: ["oauth2", "api_key", "basic", "custom"] }).notNull(),
  oauthConfig: text("oauth_config"), // JSON with OAuth settings
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const userConnectors = sqliteTable("user_connectors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  connectorId: integer("connector_id").notNull().references(() => connectorDefinitions.id),
  config: text("config"), // Encrypted JSON
  enabledScopes: text("enabled_scopes"), // JSON array
  status: text("status", { enum: ["connected", "disconnected", "error"] }).default("disconnected"),
  lastSyncAt: integer("last_sync_at", { mode: "timestamp" }),
  errorMessage: text("error_message"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// INTEGRATIONS (Webhooks & Events)
// ============================================

export const webhooks = sqliteTable("webhooks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  organizationId: integer("organization_id").references(() => organizations.id),
  name: text("name").notNull(),
  url: text("url").notNull(),
  secret: text("secret"), // For signature verification
  events: text("events"), // JSON array of subscribed events
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  lastTriggeredAt: integer("last_triggered_at", { mode: "timestamp" }),
  failureCount: integer("failure_count").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const webhookDeliveries = sqliteTable("webhook_deliveries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  webhookId: integer("webhook_id").notNull().references(() => webhooks.id, { onDelete: "cascade" }),
  event: text("event").notNull(),
  payload: text("payload"), // JSON
  responseStatus: integer("response_status"),
  responseBody: text("response_body"),
  deliveredAt: integer("delivered_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const slackIntegrations = sqliteTable("slack_integrations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  organizationId: integer("organization_id").references(() => organizations.id),
  teamId: text("team_id").notNull(),
  teamName: text("team_name"),
  accessToken: text("access_token"), // Encrypted
  botUserId: text("bot_user_id"),
  channelId: text("channel_id"),
  events: text("events"), // JSON array of subscribed events
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const teamsIntegrations = sqliteTable("teams_integrations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  organizationId: integer("organization_id").references(() => organizations.id),
  tenantId: text("tenant_id").notNull(),
  teamId: text("team_id"),
  accessToken: text("access_token"), // Encrypted
  refreshToken: text("refresh_token"), // Encrypted
  channelId: text("channel_id"),
  events: text("events"), // JSON array
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// WORK ORDERS
// ============================================

export const workOrders = sqliteTable("work_orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  organizationId: integer("organization_id").references(() => organizations.id),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  specification: text("specification"), // JSON with detailed spec
  constraints: text("constraints"), // JSON array
  acceptanceTests: text("acceptance_tests"), // JSON array
  status: text("status", { 
    enum: ["draft", "pending_approval", "approved", "in_progress", "review", "completed", "failed", "cancelled"] 
  }).default("draft"),
  priority: text("priority", { enum: ["low", "medium", "high", "urgent"] }).default("medium"),
  estimatedCredits: integer("estimated_credits"),
  actualCredits: integer("actual_credits"),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: integer("approved_at", { mode: "timestamp" }),
  startedAt: integer("started_at", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const workOrderSteps = sqliteTable("work_order_steps", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workOrderId: integer("work_order_id").notNull().references(() => workOrders.id, { onDelete: "cascade" }),
  stepNumber: integer("step_number").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["pending", "running", "completed", "failed", "skipped"] }).default("pending"),
  output: text("output"),
  artifacts: text("artifacts"), // JSON array of file paths
  startedAt: integer("started_at", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const workOrderArtifacts = sqliteTable("work_order_artifacts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workOrderId: integer("work_order_id").notNull().references(() => workOrders.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["repository", "build_log", "deployment", "file", "url"] }).notNull(),
  name: text("name").notNull(),
  path: text("path"),
  url: text("url"),
  metadata: text("metadata"), // JSON
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// DEPLOYMENTS
// ============================================

export const deployments = sqliteTable("deployments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workOrderId: integer("work_order_id").references(() => workOrders.id, { onDelete: "set null" }),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider", { enum: ["aws_ecs", "aws_lambda", "cloudflare", "vercel", "custom"] }).notNull(),
  status: text("status", { 
    enum: ["pending", "provisioning", "deploying", "active", "failed", "terminated"] 
  }).default("pending"),
  liveUrl: text("live_url"),
  adminCredentials: text("admin_credentials"), // Encrypted JSON
  repositoryUrl: text("repository_url"),
  infrastructureOutputs: text("infrastructure_outputs"), // JSON with Terraform outputs
  terraformState: text("terraform_state"), // Encrypted state
  rollbackInfo: text("rollback_info"), // JSON with rollback instructions
  logs: text("logs"),
  errorMessage: text("error_message"),
  deployedAt: integer("deployed_at", { mode: "timestamp" }),
  terminatedAt: integer("terminated_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// AUDIT LOGS
// ============================================

export const auditLogs = sqliteTable("audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  organizationId: integer("organization_id").references(() => organizations.id),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id"),
  details: text("details"), // JSON with action details
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
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

// ============================================
// RATE LIMITING
// ============================================

export const rateLimitRecords = sqliteTable("rate_limit_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull(), // IP or user ID based key
  endpoint: text("endpoint").notNull(),
  count: integer("count").default(1),
  windowStart: integer("window_start", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type GeneratedFile = typeof generatedFiles.$inferSelect;
export type AgentTask = typeof agentTasks.$inferSelect;
export type AppTemplate = typeof appTemplates.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type ToolConnection = typeof toolConnections.$inferSelect;
export type EmailConnection = typeof emailConnections.$inferSelect;
export type Email = typeof emails.$inferSelect;
export type ScheduledWork = typeof scheduledWorks.$inferSelect;
export type WorkOrder = typeof workOrders.$inferSelect;
export type Deployment = typeof deployments.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type Webhook = typeof webhooks.$inferSelect;
export type CloudStorageConnection = typeof cloudStorageConnections.$inferSelect;
export type UsageRecord = typeof usageRecords.$inferSelect;


// ============================================
// ADDITIONAL TABLES FOR NEW FEATURES
// ============================================

// User Sessions (for session management)
export const userSessions = sqliteTable("user_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull(),
  deviceInfo: text("device_info"),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  location: text("location"),
  lastActiveAt: integer("last_active_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Team Members (extended for account routes)
export const teamMembersExtended = sqliteTable("team_members_extended", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerId: integer("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  email: text("email"),
  role: text("role").default("member"),
  status: text("status").default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Team Invitations (extended)
export const teamInvitationsExtended = sqliteTable("team_invitations_extended", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerId: integer("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role").default("member"),
  token: text("token").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Usage Records (extended)
export const usageRecordsExtended = sqliteTable("usage_records_extended", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  credits: integer("credits").default(0),
  apiCalls: integer("api_calls").default(0),
  storageBytes: integer("storage_bytes").default(0),
  category: text("category"),
  recordedAt: integer("recorded_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Work Order Activities
export const workOrderActivities = sqliteTable("work_order_activities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull().references(() => workOrders.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  content: text("content"),
  userId: integer("user_id").references(() => users.id),
  userName: text("user_name"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Deployed Apps
export const deployedApps = sqliteTable("deployed_apps", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  repositoryUrl: text("repository_url"),
  provider: text("provider").default("aws"),
  region: text("region").default("us-east-1"),
  status: text("status").default("pending"),
  url: text("url"),
  replicas: integer("replicas").default(1),
  currentVersion: text("current_version"),
  config: text("config"),
  lastDeployedAt: integer("last_deployed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Deployments (extended for deploy routes)
export const deploymentsExtended = sqliteTable("deployments_extended", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  appId: integer("app_id").notNull().references(() => deployedApps.id, { onDelete: "cascade" }),
  version: text("version").notNull(),
  versionNumber: integer("version_number").default(1),
  status: text("status").default("pending"),
  branch: text("branch"),
  commit: text("commit"),
  deployedBy: integer("deployed_by").references(() => users.id),
  isRollback: integer("is_rollback", { mode: "boolean" }).default(false),
  rollbackFrom: text("rollback_from"),
  startedAt: integer("started_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Scheduled Works (extended)
export const scheduledWorksExtended = sqliteTable("scheduled_works_extended", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  schedule: text("schedule"),
  scheduleType: text("schedule_type").default("cron"),
  taskType: text("task_type"),
  taskConfig: text("task_config"),
  status: text("status").default("active"),
  nextRunAt: integer("next_run_at", { mode: "timestamp" }),
  lastRunAt: integer("last_run_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Work Executions
export const workExecutions = sqliteTable("work_executions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workId: integer("work_id").notNull().references(() => scheduledWorksExtended.id, { onDelete: "cascade" }),
  status: text("status").default("pending"),
  triggeredBy: text("triggered_by").default("schedule"),
  result: text("result"),
  error: text("error"),
  startedAt: integer("started_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  completedAt: integer("completed_at", { mode: "timestamp" }),
});

// Connectors
export const connectors = sqliteTable("connectors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type"),
  provider: text("provider"),
  status: text("status").default("pending"),
  config: text("config"),
  lastSyncAt: integer("last_sync_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Cloud Accounts
export const cloudAccounts = sqliteTable("cloud_accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  name: text("name").notNull(),
  accountId: text("account_id"),
  region: text("region"),
  status: text("status").default("pending"),
  credentials: text("credentials"),
  lastSyncAt: integer("last_sync_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Cloud Resources
export const cloudResources = sqliteTable("cloud_resources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull().references(() => cloudAccounts.id, { onDelete: "cascade" }),
  resourceId: text("resource_id").notNull(),
  type: text("type"),
  name: text("name"),
  status: text("status"),
  region: text("region"),
  details: text("details"),
  cost: real("cost"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Voice Sessions
export const voiceSessions = sqliteTable("voice_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionId: text("session_id").notNull().unique(),
  status: text("status").default("active"),
  summary: text("summary"),
  endedAt: integer("ended_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Voice Messages
export const voiceMessages = sqliteTable("voice_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id").notNull().references(() => voiceSessions.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content"),
  audioUrl: text("audio_url"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Voice Settings
export const voiceSettings = sqliteTable("voice_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  language: text("language").default("en-US"),
  voiceId: text("voice_id").default("alloy"),
  speed: real("speed").default(1.0),
  pitch: real("pitch").default(1.0),
  volume: real("volume").default(1.0),
  autoDetectLanguage: integer("auto_detect_language", { mode: "boolean" }).default(true),
  noiseReduction: integer("noise_reduction", { mode: "boolean" }).default(true),
  echoCancellation: integer("echo_cancellation", { mode: "boolean" }).default(true),
  wakeWord: integer("wake_word", { mode: "boolean" }).default(false),
  wakeWordPhrase: text("wake_word_phrase").default("Hey ADELE"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Data Exports
export const dataExports = sqliteTable("data_exports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  format: text("format").default("json"),
  status: text("status").default("pending"),
  url: text("url"),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Deletion Requests
export const deletionRequests = sqliteTable("deletion_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").default("pending"),
  reason: text("reason"),
  scheduledAt: integer("scheduled_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Retention Settings
export const retentionSettings = sqliteTable("retention_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  chatHistory: integer("chat_history").default(90),
  projectFiles: integer("project_files").default(365),
  auditLogs: integer("audit_logs").default(30),
  autoDelete: integer("auto_delete", { mode: "boolean" }).default(false),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Installed Integrations
export const installedIntegrations = sqliteTable("installed_integrations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  integrationId: text("integration_id").notNull(),
  status: text("status").default("active"),
  config: text("config"),
  installedAt: integer("installed_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Additional type exports
export type UserSession = typeof userSessions.$inferSelect;
export type TeamMemberExtended = typeof teamMembersExtended.$inferSelect;
export type WorkOrderActivity = typeof workOrderActivities.$inferSelect;
export type DeployedApp = typeof deployedApps.$inferSelect;
export type DeploymentExtended = typeof deploymentsExtended.$inferSelect;
export type ScheduledWorkExtended = typeof scheduledWorksExtended.$inferSelect;
export type WorkExecution = typeof workExecutions.$inferSelect;
export type Connector = typeof connectors.$inferSelect;
export type CloudAccount = typeof cloudAccounts.$inferSelect;
export type CloudResource = typeof cloudResources.$inferSelect;
export type VoiceSession = typeof voiceSessions.$inferSelect;
export type VoiceMessage = typeof voiceMessages.$inferSelect;
export type VoiceSetting = typeof voiceSettings.$inferSelect;
export type DataExport = typeof dataExports.$inferSelect;
export type DeletionRequest = typeof deletionRequests.$inferSelect;
export type RetentionSetting = typeof retentionSettings.$inferSelect;
export type InstalledIntegration = typeof installedIntegrations.$inferSelect;


// ============================================
// MAIL ADELE (Email Agent)
// ============================================

export const emailAgentSettings = sqliteTable("email_agent_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  enabled: integer("enabled", { mode: "boolean" }).default(false),
  autoReply: integer("auto_reply", { mode: "boolean" }).default(false),
  autoReplyDelay: integer("auto_reply_delay").default(5), // minutes
  summarize: integer("summarize", { mode: "boolean" }).default(true),
  categorize: integer("categorize", { mode: "boolean" }).default(true),
  prioritize: integer("prioritize", { mode: "boolean" }).default(true),
  workingHours: text("working_hours"), // JSON { start: "09:00", end: "17:00", timezone: "UTC", days: [1,2,3,4,5] }
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const emailAgentRules = sqliteTable("email_agent_rules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  trigger: text("trigger").notNull(), // "new_email", "reply_received", "schedule"
  conditions: text("conditions"), // JSON { from: "...", subject_contains: "...", etc }
  action: text("action").notNull(), // "auto_reply", "forward", "label", "archive", "draft"
  actionConfig: text("action_config"), // JSON with action-specific config
  enabled: integer("enabled", { mode: "boolean" }).default(true),
  priority: integer("priority").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const emailAccounts = sqliteTable("email_accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  provider: text("provider").notNull(), // "google", "microsoft", "imap"
  status: text("status").default("pending"), // "pending", "connected", "error"
  accessToken: text("access_token"), // Encrypted
  refreshToken: text("refresh_token"), // Encrypted
  tokenExpiresAt: integer("token_expires_at", { mode: "timestamp" }),
  lastSyncAt: integer("last_sync_at", { mode: "timestamp" }),
  syncCursor: text("sync_cursor"), // For incremental sync
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const emailsExtended = sqliteTable("emails_extended", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accountId: integer("account_id").references(() => emailAccounts.id, { onDelete: "cascade" }),
  messageId: text("message_id"),
  threadId: text("thread_id"),
  fromAddress: text("from_address"),
  toAddresses: text("to_addresses"), // JSON array
  ccAddresses: text("cc_addresses"), // JSON array
  subject: text("subject"),
  body: text("body"),
  htmlBody: text("html_body"),
  folder: text("folder").default("inbox"),
  isRead: integer("is_read", { mode: "boolean" }).default(false),
  isStarred: integer("is_starred", { mode: "boolean" }).default(false),
  hasAttachments: integer("has_attachments", { mode: "boolean" }).default(false),
  receivedAt: integer("received_at", { mode: "timestamp" }),
  agentProcessed: integer("agent_processed", { mode: "boolean" }).default(false),
  agentSummary: text("agent_summary"),
  agentDraft: text("agent_draft"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// CLOUD BROWSER (Browser Sessions)
// ============================================

export const browserSessions = sqliteTable("browser_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name"),
  status: text("status").default("active"), // "active", "paused", "terminated"
  resolution: text("resolution").default("1920x1080"),
  currentUrl: text("current_url"),
  profileId: integer("profile_id").references(() => browserProfiles.id),
  screenshotUrl: text("screenshot_url"),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const browserProfiles = sqliteTable("browser_profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  userAgent: text("user_agent"),
  viewport: text("viewport").default("1920x1080"),
  locale: text("locale").default("en-US"),
  timezone: text("timezone").default("UTC"),
  isDefault: integer("is_default", { mode: "boolean" }).default(false),
  cookies: text("cookies"), // Encrypted JSON
  localStorage: text("local_storage"), // Encrypted JSON
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const browserHistory = sqliteTable("browser_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id").notNull().references(() => browserSessions.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  title: text("title"),
  visitedAt: integer("visited_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Additional type exports for new tables
export type EmailAgentSetting = typeof emailAgentSettings.$inferSelect;
export type EmailAgentRule = typeof emailAgentRules.$inferSelect;
export type EmailAccount = typeof emailAccounts.$inferSelect;
export type EmailExtended = typeof emailsExtended.$inferSelect;
export type BrowserSession = typeof browserSessions.$inferSelect;
export type BrowserProfile = typeof browserProfiles.$inferSelect;
export type BrowserHistoryEntry = typeof browserHistory.$inferSelect;
