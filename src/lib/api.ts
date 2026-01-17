const API_BASE = import.meta.env.VITE_API_URL || "/api";

// Token management
let authToken: string | null = localStorage.getItem("adele_token");

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem("adele_token", token);
  } else {
    localStorage.removeItem("adele_token");
  }
}

export function getAuthToken() {
  return authToken;
}

// API request helper
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (authToken) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }

  return response.json();
}

// Auth API
export const auth = {
  register: (data: { email: string; password: string; name: string }) =>
    request<{ success: boolean; user: User; token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<{ success: boolean; user: User; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  me: () =>
    request<{ user: User | null; subscription?: Subscription }>("/auth/me"),

  logout: () =>
    request<{ success: boolean }>("/auth/logout", { method: "POST" }),

  forgotPassword: (email: string) =>
    request<{ success: boolean; message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    request<{ success: boolean; message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ success: boolean; message: string }>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  revokeSession: (sessionId: string) =>
    request<{ success: boolean }>(`/auth/sessions/${sessionId}`, {
      method: "DELETE",
    }),

  revokeAllSessions: () =>
    request<{ success: boolean }>("/auth/sessions/all", {
      method: "DELETE",
    }),

  setup2FA: () =>
    request<{ secret: string; qrCode: string }>("/auth/2fa/setup", {
      method: "POST",
    }),

  verify2FA: (code: string) =>
    request<{ success: boolean; backupCodes: string[]; recoveryCodes: string[] }>("/auth/2fa/verify", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),

  disable2FA: (code?: string) =>
    request<{ success: boolean }>("/auth/2fa/disable", {
      method: "POST",
      body: code ? JSON.stringify({ code }) : undefined,
    }),
};

// Projects API
export const projects = {
  list: () => request<{ projects: Project[] }>("/projects"),

  get: (id: number) =>
    request<{ project: Project; files: GeneratedFile[]; tasks: AgentTask[] }>(
      `/projects/${id}`
    ),

  create: (data: { name: string; description?: string; type?: string; techStack?: string[] }) =>
    request<{ project: Project }>("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<Project>) =>
    request<{ project: Project }>(`/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    request<{ success: boolean }>(`/projects/${id}`, { method: "DELETE" }),

  getFiles: (id: number) =>
    request<{ files: GeneratedFile[] }>(`/projects/${id}/files`),

  saveFile: (id: number, data: { path: string; content: string; language?: string }) =>
    request<{ file: GeneratedFile }>(`/projects/${id}/files`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getVersions: (id: number) =>
    request<{ versions: ProjectVersion[] }>(`/projects/${id}/versions`),

  createVersion: (id: number, commitMessage?: string) =>
    request<{ version: ProjectVersion }>(`/projects/${id}/versions`, {
      method: "POST",
      body: JSON.stringify({ commitMessage }),
    }),

  rollback: (projectId: number, versionId: number) =>
    request<{ success: boolean; message: string }>(
      `/projects/${projectId}/versions/${versionId}/rollback`,
      { method: "POST" }
    ),

  download: (id: number) =>
    request<{ project: { name: string }; files: { path: string; content: string }[] }>(
      `/projects/${id}/download`
    ),
};

// Chat API
export const chat = {
  getMessages: (projectId: number) =>
    request<{ messages: ChatMessage[] }>(`/chat/${projectId}/messages`),

  sendMessage: (projectId: number, content: string) =>
    request<{ userMessage: ChatMessage; assistantMessage: ChatMessage }>(
      `/chat/${projectId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ content }),
      }
    ),

  deleteMessage: (projectId: number, messageId: number) =>
    request<{ success: boolean }>(`/chat/${projectId}/messages/${messageId}`, {
      method: "DELETE",
    }),

  clearMessages: (projectId: number) =>
    request<{ success: boolean }>(`/chat/${projectId}/messages`, {
      method: "DELETE",
    }),
};

// Templates API
export const templates = {
  list: () => request<{ templates: AppTemplate[] }>("/templates"),

  get: (id: number) => request<{ template: AppTemplate }>(`/templates/${id}`),

  getByCategory: (category: string) =>
    request<{ templates: AppTemplate[] }>(`/templates/category/${category}`),
};

// Users API
export const users = {
  getProfile: () =>
    request<{
      user: User;
      settings: UserSettings | null;
      subscription: Subscription | null;
      biometrics: BiometricInfo | null;
      onboarding: OnboardingProgress | null;
    }>("/users/profile"),

  updateProfile: (data: { name?: string; avatarUrl?: string }) =>
    request<{ user: User }>("/users/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  updateSettings: (data: Partial<UserSettings>) =>
    request<{ success: boolean }>("/users/settings", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  getConnections: () =>
    request<{ connections: ToolConnection[] }>("/users/connections"),

  addConnection: (data: { provider: string; name: string; config?: object }) =>
    request<{ connection: ToolConnection }>("/users/connections", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deleteConnection: (id: number) =>
    request<{ success: boolean }>(`/users/connections/${id}`, {
      method: "DELETE",
    }),

  updateOnboarding: (data: {
    currentStep?: number;
    completedSteps?: number[];
    isCompleted?: boolean;
    skipped?: boolean;
  }) =>
    request<{ success: boolean }>("/users/onboarding", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  updateBiometrics: (data: Partial<BiometricInfo>) =>
    request<{ success: boolean }>("/users/biometrics", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  update: (data: { name?: string; avatarUrl?: string; email?: string }) =>
    request<{ user: User }>("/users/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// Stripe API
export const stripe = {
  getPlans: () => request<{ plans: Record<string, PricingPlan> }>("/stripe/plans"),

  createCheckout: (plan: string, billingPeriod: "monthly" | "yearly" = "monthly") =>
    request<{ url: string }>("/stripe/checkout", {
      method: "POST",
      body: JSON.stringify({ plan, billingPeriod }),
    }),

  createPortalSession: () =>
    request<{ url: string }>("/stripe/portal", { method: "POST" }),

  getSubscription: () =>
    request<{ subscription: Subscription }>("/stripe/subscription"),

  testConnection: () =>
    request<{ success: boolean; message?: string }>("/stripe/test"),
};

// Admin API
export const admin = {
  getStats: () =>
    request<{
      totalUsers: number;
      totalProjects: number;
      activeSubscriptions: number;
      monthlyRevenue: number;
    }>("/admin/stats"),

  getUsers: () =>
    request<{ users: User[] }>("/admin/users"),

  getStripeConfig: () =>
    request<{ config: { publishableKey: string; secretKey: string; webhookSecret: string } | null }>(
      "/admin/stripe-config"
    ),

  updateStripeConfig: (config: { publishableKey: string; secretKey: string; webhookSecret: string }) =>
    request<{ success: boolean }>("/admin/stripe-config", {
      method: "POST",
      body: JSON.stringify(config),
    }),

  exportData: (type: "users" | "projects" | "analytics") =>
    request<{ data: any[] }>(`/admin/export/${type}`),

  // Original admin methods below
  getDetailedStats: () =>
    request<{
      users: { total: number; activeWeekly: number };
      projects: { total: number; completed: number };
      subscriptions: { free: number; pro: number; enterprise: number };
      topTemplates: { name: string; usageCount: number }[];
    }>("/admin/detailed-stats"),

  getUsersPaginated: (limit?: number, offset?: number) =>
    request<{ users: User[]; total: number }>(
      `/admin/users-paginated?limit=${limit || 50}&offset=${offset || 0}`
    ),

  updateUserRole: (userId: number, role: string) =>
    request<{ success: boolean }>(`/admin/users/${userId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),

  getConfig: () =>
    request<{
      configs: { key: string; hasValue: boolean; isEncrypted: boolean; updatedAt: string }[];
    }>("/admin/config"),

  setConfig: (key: string, value: string, isEncrypted?: boolean) =>
    request<{ success: boolean }>("/admin/config", {
      method: "POST",
      body: JSON.stringify({ key, value, isEncrypted }),
    }),

  deleteConfig: (key: string) =>
    request<{ success: boolean }>(`/admin/config/${key}`, { method: "DELETE" }),

  getAnalytics: (days?: number) =>
    request<{
      eventsByType: { eventType: string; count: number }[];
      dailyUsers: { date: string; uniqueUsers: number }[];
      period: string;
    }>(`/admin/analytics?days=${days || 30}`),

  createTemplate: (data: Partial<AppTemplate>) =>
    request<{ template: AppTemplate }>("/admin/templates", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateTemplate: (id: number, data: Partial<AppTemplate>) =>
    request<{ template: AppTemplate }>(`/admin/templates/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteTemplate: (id: number) =>
    request<{ success: boolean }>(`/admin/templates/${id}`, { method: "DELETE" }),

  // API Configuration
  getApiConfigs: () =>
    request<Record<string, Record<string, string>>>("/admin/api-configs"),

  saveApiConfig: (apiId: string, config: Record<string, string>) =>
    request<{ success: boolean }>("/admin/api-configs", {
      method: "POST",
      body: JSON.stringify({ apiId, config }),
    }),

  testApiConnection: (provider: string, config: Record<string, string>) =>
    request<{ success: boolean; message: string }>(`/admin/test-api/${provider}`, {
      method: "POST",
      body: JSON.stringify({ config }),
    }),
};

// Types
export interface User {
  id: number;
  email: string;
  name: string;
  role: "user" | "admin";
  emailVerified: boolean;
  avatarUrl?: string;
  createdAt: string;
  lastSignedIn?: string;
}

export interface Project {
  id: number;
  userId: number;
  name: string;
  description?: string;
  type: string;
  status: string;
  techStack?: string;
  deploymentUrl?: string;
  repositoryUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedFile {
  id: number;
  projectId: number;
  path: string;
  content: string;
  language?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface AgentTask {
  id: number;
  projectId: number;
  agentType: string;
  status: string;
  input?: string;
  output?: string;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: number;
  projectId: number;
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: string;
  createdAt: string;
}

export interface AppTemplate {
  id: number;
  name: string;
  description?: string;
  category: string;
  icon?: string;
  techStack: string[];
  features: string[];
  previewImage?: string;
  basePrompt?: string;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface ProjectVersion {
  id: number;
  projectId: number;
  versionNumber: number;
  commitMessage?: string;
  snapshot?: string;
  createdBy?: number;
  createdAt: string;
}

export interface Subscription {
  plan: "free" | "pro" | "enterprise";
  status: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

export interface UserSettings {
  theme: string;
  language: string;
  timezone: string;
  voiceEnabled: boolean;
  voiceLanguage: string;
  ttsEnabled: boolean;
  ttsProvider?: string;
  editorFontSize: number;
  editorTabSize: number;
  autoSave: boolean;
  notifications?: object;
}

export interface ToolConnection {
  id: number;
  provider: string;
  name: string;
  status: string;
  lastUsed?: string;
  createdAt: string;
}

export interface BiometricInfo {
  hasVoiceSample: boolean;
  hasFacePhoto: boolean;
  biometricLoginEnabled: boolean;
}

export interface OnboardingProgress {
  currentStep: number;
  completedSteps: number[];
  isCompleted: boolean;
}

export interface PricingPlan {
  name: string;
  price: number;
  priceId?: string;
  features: string[];
}


// ============================================
// NEW API ENDPOINTS FOR ENTERPRISE FEATURES
// ============================================

// Account API
export const account = {
  getProfile: () =>
    request<{ profile: UserProfile }>("/account/profile"),

  updateProfile: (data: Partial<UserProfile>) =>
    request<{ profile: UserProfile }>("/account/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return fetch(`${API_BASE}/account/avatar`, {
      method: "POST",
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      body: formData,
    }).then((r) => r.json());
  },

  getSessions: () =>
    request<{ sessions: Session[] }>("/account/sessions"),

  revokeSession: (sessionId: string) =>
    request<{ success: boolean }>(`/account/sessions/${sessionId}`, {
      method: "DELETE",
    }),

  enable2FA: () =>
    request<{ secret: string; qrCode: string }>("/account/2fa/enable", {
      method: "POST",
    }),

  verify2FA: (code: string) =>
    request<{ success: boolean; backupCodes: string[]; recoveryCodes: string[] }>("/account/2fa/verify", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),

  disable2FA: (code?: string) =>
    request<{ success: boolean }>("/account/2fa/disable", {
      method: "POST",
      body: code ? JSON.stringify({ code }) : undefined,
    }),

  getTeamMembers: () =>
    request<{ members: TeamMember[] }>("/account/team"),

  inviteTeamMember: (data: { email: string; role: string }) =>
    request<{ invitation: TeamInvitation }>("/account/team/invite", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  removeTeamMember: (memberId: number) =>
    request<{ success: boolean }>(`/account/team/${memberId}`, {
      method: "DELETE",
    }),

  updateTeamMemberRole: (memberId: number, role?: string) =>
    request<{ success: boolean }>(`/account/team/${memberId}/role`, {
      method: "PATCH",
      body: role ? JSON.stringify({ role }) : undefined,
    }),

  update: (data: Partial<UserProfile>) =>
    request<{ profile: UserProfile }>("/account/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  revokeAllSessions: () =>
    request<{ success: boolean }>("/account/sessions/all", {
      method: "DELETE",
    }),

  setup2FA: () =>
    request<{ secret: string; qrCode: string }>("/account/2fa/setup", {
      method: "POST",
    }),
};

// Usage API
export const usage = {
  getSummary: () =>
    request<{ usage: UsageSummary }>("/usage/summary"),

  getHistory: (startDate?: string, endDate?: string) =>
    request<{ history: UsageRecord[] }>(
      `/usage/history?start=${startDate || ""}&end=${endDate || ""}`
    ),

  getBreakdown: (period: "day" | "week" | "month") =>
    request<{ breakdown: UsageBreakdown[] }>(`/usage/breakdown?period=${period}`),

  getLimits: () =>
    request<{ limits: UsageLimits }>("/usage/limits"),
};

// Billing API (Stripe integration)
export const billing = {
  getSubscription: () =>
    request<{ subscription: SubscriptionDetails }>("/billing/subscription"),

  getInvoices: () =>
    request<{ invoices: Invoice[] }>("/billing/invoices"),

  getPaymentMethods: () =>
    request<{ paymentMethods: PaymentMethod[] }>("/billing/payment-methods"),

  addPaymentMethod: (paymentMethodId: string) =>
    request<{ success: boolean }>("/billing/payment-methods", {
      method: "POST",
      body: JSON.stringify({ paymentMethodId }),
    }),

  removePaymentMethod: (paymentMethodId: string) =>
    request<{ success: boolean }>(`/billing/payment-methods/${paymentMethodId}`, {
      method: "DELETE",
    }),

  setDefaultPaymentMethod: (paymentMethodId: string) =>
    request<{ success: boolean }>("/billing/payment-methods/default", {
      method: "POST",
      body: JSON.stringify({ paymentMethodId }),
    }),

  changePlan: (planId: string, billingPeriod: "monthly" | "yearly") =>
    request<{ success: boolean; subscription: SubscriptionDetails }>(
      "/billing/change-plan",
      {
        method: "POST",
        body: JSON.stringify({ planId, billingPeriod }),
      }
    ),

  cancelSubscription: (immediately?: boolean) =>
    request<{ success: boolean }>("/billing/cancel", {
      method: "POST",
      body: JSON.stringify({ immediately }),
    }),

  reactivateSubscription: () =>
    request<{ success: boolean }>("/billing/reactivate", { method: "POST" }),

  downloadInvoice: (invoiceId: string) =>
    request<{ url: string }>(`/billing/invoices/${invoiceId}/download`),

  createCheckoutSession: (planId: string | { planId: string; interval: "month" | "year" }, billingPeriod?: "monthly" | "yearly") =>
    request<{ url: string }>("/billing/checkout", {
      method: "POST",
      body: JSON.stringify(
        typeof planId === 'string' 
          ? { planId, billingPeriod: billingPeriod || 'monthly' }
          : { planId: planId.planId, billingPeriod: planId.interval === 'year' ? 'yearly' : 'monthly' }
      ),
    }),

  createPortalSession: () =>
    request<{ url: string }>("/billing/portal", { method: "POST" }),
};

// Mail ADELE API
export const mail = {
  getEmails: (folder?: string) =>
    request<{ emails: Email[] }>(`/mail/emails?folder=${folder || "inbox"}`),

  getEmail: (id: number) =>
    request<{ email: Email }>(`/mail/emails/${id}`),

  sendEmail: (data: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    attachments?: string[];
  }) =>
    request<{ email: Email }>("/mail/send", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  replyEmail: (id: number, body: string) =>
    request<{ email: Email }>(`/mail/emails/${id}/reply`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),

  deleteEmail: (id: number) =>
    request<{ success: boolean }>(`/mail/emails/${id}`, { method: "DELETE" }),

  moveEmail: (id: number, folder: string) =>
    request<{ success: boolean }>(`/mail/emails/${id}/move`, {
      method: "POST",
      body: JSON.stringify({ folder }),
    }),

  getAgentRules: () =>
    request<{ rules: EmailAgentRule[] }>("/mail/agent/rules"),

  createAgentRule: (rule: Partial<EmailAgentRule>) =>
    request<{ rule: EmailAgentRule }>("/mail/agent/rules", {
      method: "POST",
      body: JSON.stringify(rule),
    }),

  updateAgentRule: (id: number, rule: Partial<EmailAgentRule>) =>
    request<{ rule: EmailAgentRule }>(`/mail/agent/rules/${id}`, {
      method: "PATCH",
      body: JSON.stringify(rule),
    }),

  deleteAgentRule: (id: number) =>
    request<{ success: boolean }>(`/mail/agent/rules/${id}`, { method: "DELETE" }),

  getAgentSettings: () =>
    request<{ settings: EmailAgentSettings }>("/mail/agent/settings"),

  updateAgentSettings: (settings: Partial<EmailAgentSettings>) =>
    request<{ success: boolean }>("/mail/agent/settings", {
      method: "PATCH",
      body: JSON.stringify(settings),
    }),

  initiateOAuth: (provider: string) =>
    request<{ url: string; authUrl: string }>(`/mail/oauth/${provider}`),

  connect: (provider: string | { provider: string; email: string; config: object }, code?: string) =>
    request<{ success: boolean }>("/mail/connect", {
      method: "POST",
      body: JSON.stringify(
        typeof provider === 'string'
          ? { provider, code }
          : provider
      ),
    }),

  send: (data: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    attachments?: string[];
    connectionId?: number;
  }) =>
    request<{ email: Email }>("/mail/send", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  schedule: (data: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    scheduledAt: string | Date;
    connectionId?: number;
  }) =>
    request<{ email: Email }>("/mail/schedule", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  generateReply: (emailId: number | { emailId: number; connectionId: number }, tone?: string) =>
    request<{ reply: string; draft: string }>(
      typeof emailId === 'number' 
        ? `/mail/emails/${emailId}/generate-reply`
        : `/mail/emails/${emailId.emailId}/generate-reply`,
      {
        method: "POST",
        body: JSON.stringify({ tone, ...(typeof emailId === 'object' ? { connectionId: emailId.connectionId } : {}) }),
      }
    ),
};

// Scheduled Works API
export const scheduledWorks = {
  list: () =>
    request<{ works: ScheduledWork[] }>("/scheduled-works"),

  get: (id: number) =>
    request<{ work: ScheduledWork; executions: WorkExecution[] }>(
      `/scheduled-works/${id}`
    ),

  create: (data: Partial<ScheduledWork>) =>
    request<{ work: ScheduledWork }>("/scheduled-works", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<ScheduledWork>) =>
    request<{ work: ScheduledWork }>(`/scheduled-works/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    request<{ success: boolean }>(`/scheduled-works/${id}`, { method: "DELETE" }),

  trigger: (id: number) =>
    request<{ execution: WorkExecution }>(`/scheduled-works/${id}/trigger`, {
      method: "POST",
    }),

  pause: (id: number) =>
    request<{ success: boolean }>(`/scheduled-works/${id}/pause`, {
      method: "POST",
    }),

  resume: (id: number) =>
    request<{ success: boolean }>(`/scheduled-works/${id}/resume`, {
      method: "POST",
    }),

  updateStatus: (id: number, status: string) =>
    request<{ success: boolean }>(`/scheduled-works/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  runNow: (id: number) =>
    request<{ execution: WorkExecution }>(`/scheduled-works/${id}/run`, {
      method: "POST",
    }),
};

// Data Controls API
export const dataControls = {
  exportData: (format: "json" | "csv" | "zip") =>
    request<{ url: string; expiresAt: string }>("/data/export", {
      method: "POST",
      body: JSON.stringify({ format }),
    }),

  importData: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return fetch(`${API_BASE}/data/import`, {
      method: "POST",
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      body: formData,
    }).then((r) => r.json());
  },

  getExportHistory: () =>
    request<{ exports: DataExport[] }>("/data/exports"),

  requestDeletion: (reason?: string) =>
    request<{ request: DeletionRequest }>("/data/delete-request", {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  cancelDeletion: () =>
    request<{ success: boolean }>("/data/delete-request", { method: "DELETE" }),

  getRetentionSettings: () =>
    request<{ settings: RetentionSettings }>("/data/retention"),

  updateRetentionSettings: (settings: Partial<RetentionSettings>) =>
    request<{ success: boolean }>("/data/retention", {
      method: "PATCH",
      body: JSON.stringify(settings),
    }),

  deleteAccount: (reason?: string) =>
    request<{ success: boolean }>("/data/delete-account", {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  purge: (dataType: string) =>
    request<{ success: boolean }>(`/data/purge/${dataType}`, {
      method: "POST",
    }),

  updateRetention: (settings: Partial<RetentionSettings>) =>
    request<{ success: boolean }>("/data/retention", {
      method: "PATCH",
      body: JSON.stringify(settings),
    }),

  export: (format: "json" | "csv" | "zip" | { categories: string[]; format: string }) =>
    request<{ url: string; expiresAt: string }>("/data/export", {
      method: "POST",
      body: JSON.stringify(typeof format === 'string' ? { format } : format),
    }),
};

// Cloud Browser API
export const cloudBrowser = {
  getSessions: () =>
    request<{ sessions: BrowserSession[] }>("/cloud-browser/sessions"),

  createSession: (config?: { resolution?: string; proxy?: string; name?: string; viewport?: string; profileId?: number; url?: string }) =>
    request<{ session: BrowserSession; connectUrl: string }>(
      "/cloud-browser/sessions",
      {
        method: "POST",
        body: JSON.stringify(config || {}),
      }
    ),

  deleteSession: (id: number) =>
    request<{ success: boolean }>(`/cloud-browser/sessions/${id}`, {
      method: "DELETE",
    }),

  updateSession: (id: number, data: { status?: string }) =>
    request<{ success: boolean }>(`/cloud-browser/sessions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  navigate: (id: number, url: string) =>
    request<{ success: boolean }>(`/cloud-browser/sessions/${id}/navigate`, {
      method: "POST",
      body: JSON.stringify({ url }),
    }),

  goBack: (id: number) =>
    request<{ success: boolean }>(`/cloud-browser/sessions/${id}/back`, {
      method: "POST",
    }),

  goForward: (id: number) =>
    request<{ success: boolean }>(`/cloud-browser/sessions/${id}/forward`, {
      method: "POST",
    }),

  refresh: (id: number) =>
    request<{ success: boolean }>(`/cloud-browser/sessions/${id}/refresh`, {
      method: "POST",
    }),

  screenshot: (id: number) =>
    request<{ url: string }>(`/cloud-browser/sessions/${id}/screenshot`),

  startRecording: (id: number) =>
    request<{ success: boolean }>(`/cloud-browser/sessions/${id}/recording/start`, {
      method: "POST",
    }),

  stopRecording: (id: number) =>
    request<{ url: string }>(`/cloud-browser/sessions/${id}/recording/stop`, {
      method: "POST",
    }),

  createProfile: (data: { name: string; userAgent: string; proxy?: string; viewport?: string | { width: number; height: number } }) =>
    request<{ profile: any }>("/cloud-browser/profiles", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getProfiles: () =>
    request<{ profiles: any[] }>("/cloud-browser/profiles"),

  deleteProfile: (id: number) =>
    request<{ success: boolean }>(`/cloud-browser/profiles/${id}`, {
      method: "DELETE",
    }),
};

// Browser API (alias for cloudBrowser)
export const browser = cloudBrowser;

// Connectors API
export const connectors = {
  list: () =>
    request<{ connectors: Connector[] }>("/connectors"),

  get: (id: number) =>
    request<{ connector: Connector }>(`/connectors/${id}`),

  create: (data: Partial<Connector>) =>
    request<{ connector: Connector; testResult?: { success: boolean; message?: string } }>("/connectors", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<Connector>) =>
    request<{ connector: Connector }>(`/connectors/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    request<{ success: boolean }>(`/connectors/${id}`, { method: "DELETE" }),

  test: (id: number) =>
    request<{ success: boolean; message: string }>(`/connectors/${id}/test`, {
      method: "POST",
    }),

  sync: (id: number | string) =>
    request<{ success: boolean }>(`/connectors/${id}/sync`, { method: "POST" }),

  getOAuthUrl: (provider: string) =>
    request<{ url?: string; demo?: boolean; connector?: Connector; message?: string; authType?: string; fields?: Array<{ name: string; label: string; type: string; required?: boolean; placeholder?: string; options?: string[] }>; name?: string }>(`/connectors/oauth/${provider}`),

  connect: (id: number | string, code?: string | Record<string, string>) =>
    request<{ success: boolean }>(`/connectors/${id}/connect`, {
      method: "POST",
      body: code ? JSON.stringify(typeof code === 'string' ? { code } : code) : undefined,
    }),

  disconnect: (id: number | string) =>
    request<{ success: boolean }>(`/connectors/${id}/disconnect`, {
      method: "POST",
    }),

  initiateOAuth: (provider: string) =>
    request<{ url: string; authUrl: string }>(`/connectors/oauth/${provider}/initiate`),

  connectOAuth: (id: number | string, code: string) =>
    request<{ success: boolean }>(`/connectors/${id}/oauth/callback`, {
      method: "POST",
      body: JSON.stringify({ code }),
    }),
};

// Integrations API
export const integrations = {
  getAvailable: () =>
    request<{ integrations: Integration[] }>("/integrations/available"),

  getInstalled: () =>
    request<{ integrations: InstalledIntegration[] }>("/integrations/installed"),

  getDetails: (integrationId: string) =>
    request<{ integration: Integration & { configFields?: Array<{ name: string; label: string; type: string; required?: boolean; placeholder?: string; description?: string }> } }>(`/integrations/${integrationId}`),

  install: (integrationId: string, config?: object) =>
    request<{ installation: InstalledIntegration; message?: string }>("/integrations/install", {
      method: "POST",
      body: JSON.stringify({ integrationId, config }),
    }),

  uninstall: (installationId: number | string) =>
    request<{ success: boolean }>(`/integrations/${installationId}`, {
      method: "DELETE",
    }),

  configure: (installationId: number | string, config: object) =>
    request<{ success: boolean }>(`/integrations/${installationId}/config`, {
      method: "PATCH",
      body: JSON.stringify(config),
    }),

  toggle: (installationId: number | string, enabled: boolean) =>
    request<{ success: boolean }>(`/integrations/${installationId}/toggle`, {
      method: "POST",
      body: JSON.stringify({ enabled }),
    }),
};

// Work Orders API
export const workOrders = {
  list: (status?: string) =>
    request<{ orders: WorkOrder[] }>(`/work-orders?status=${status || ""}`),

  get: (id: number) =>
    request<{ order: WorkOrder; activities: WorkOrderActivity[] }>(
      `/work-orders/${id}`
    ),

  create: (data: Partial<WorkOrder>) =>
    request<{ order: WorkOrder }>("/work-orders", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<WorkOrder> | { status: boolean | string }) =>
    request<{ order: WorkOrder }>(`/work-orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    request<{ success: boolean }>(`/work-orders/${id}`, { method: "DELETE" }),

  approve: (id: number, comment?: string | boolean) =>
    request<{ success: boolean }>(`/work-orders/${id}/approve`, {
      method: "POST",
      body: JSON.stringify(
        typeof comment === 'boolean'
          ? { approved: comment }
          : { comment }
      ),
    }),

  reject: (id: number, reason: string) =>
    request<{ success: boolean }>(`/work-orders/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  start: (id: number) =>
    request<{ success: boolean }>(`/work-orders/${id}/start`, { method: "POST" }),

  complete: (id: number, result?: string) =>
    request<{ success: boolean }>(`/work-orders/${id}/complete`, {
      method: "POST",
      body: JSON.stringify({ result }),
    }),

  addComment: (id: number, comment: string) =>
    request<{ activity: WorkOrderActivity }>(`/work-orders/${id}/comments`, {
      method: "POST",
      body: JSON.stringify({ comment }),
    }),

  cancel: (id: number, reason?: string) =>
    request<{ success: boolean }>(`/work-orders/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
};

// App Deploy API
export const appDeploy = {
  getApps: () =>
    request<{ apps: DeployedApp[] }>("/deploy/apps"),

  getApp: (id: number) =>
    request<{ app: DeployedApp; deployments: Deployment[] }>(`/deploy/apps/${id}`),

  createApp: (data: {
    name: string;
    projectId?: number;
    repositoryUrl?: string;
    provider: string;
    region: string;
    config?: object;
  }) =>
    request<{ app: DeployedApp }>("/deploy/apps", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateApp: (id: number, data: Partial<DeployedApp>) =>
    request<{ app: DeployedApp }>(`/deploy/apps/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteApp: (id: number) =>
    request<{ success: boolean }>(`/deploy/apps/${id}`, { method: "DELETE" }),

  deploy: (id: number, options?: { branch?: string; commit?: string }) =>
    request<{ deployment: Deployment }>(`/deploy/apps/${id}/deploy`, {
      method: "POST",
      body: JSON.stringify(options || {}),
    }),

  rollback: (id: number, deploymentId: number) =>
    request<{ deployment: Deployment }>(`/deploy/apps/${id}/rollback`, {
      method: "POST",
      body: JSON.stringify({ deploymentId }),
    }),

  getLogs: (id: number, deploymentId?: number) =>
    request<{ logs: DeploymentLog[] }>(
      `/deploy/apps/${id}/logs?deploymentId=${deploymentId || ""}`
    ),

  getMetrics: (id: number) =>
    request<{ metrics: AppMetrics }>(`/deploy/apps/${id}/metrics`),

  scale: (id: number, replicas: number) =>
    request<{ success: boolean }>(`/deploy/apps/${id}/scale`, {
      method: "POST",
      body: JSON.stringify({ replicas }),
    }),

  setEnvironment: (id: number, env: Record<string, string>) =>
    request<{ success: boolean }>(`/deploy/apps/${id}/environment`, {
      method: "POST",
      body: JSON.stringify(env),
    }),

  delete: (id: number) =>
    request<{ success: boolean }>(`/deploy/apps/${id}`, { method: "DELETE" }),

  cancelDeployment: (appId: number, deploymentId?: number) =>
    request<{ success: boolean }>(
      deploymentId 
        ? `/deploy/apps/${appId}/deployments/${deploymentId}/cancel`
        : `/deploy/apps/${appId}/cancel`,
      {
        method: "POST",
      }
    ),

  create: (data: {
    name: string;
    description?: string;
    projectId?: number;
    repositoryUrl?: string;
    repository?: string;
    branch?: string;
    framework?: string;
    environment?: string;
    provider: string;
    region?: string;
    config?: object;
  }) =>
    request<{ app: DeployedApp }>("/deploy/apps", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  stop: (id: number) =>
    request<{ success: boolean }>(`/deploy/apps/${id}/stop`, {
      method: "POST",
    }),
};

// Voice Communication API
export const voice = {
  startSession: () =>
    request<{ sessionId: string; wsUrl: string }>("/voice/session", {
      method: "POST",
    }),

  endSession: (sessionId: string) =>
    request<{ success: boolean }>(`/voice/session/${sessionId}`, {
      method: "DELETE",
    }),

  getSettings: () =>
    request<{ settings: VoiceSettings }>("/voice/settings"),

  updateSettings: (settings: Partial<VoiceSettings>) =>
    request<{ success: boolean }>("/voice/settings", {
      method: "PATCH",
      body: JSON.stringify(settings),
    }),

  getVoices: () =>
    request<{ voices: VoiceProfile[] }>("/voice/voices"),

  transcribe: (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append("audio", audioBlob);
    return fetch(`${API_BASE}/voice/transcribe`, {
      method: "POST",
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      body: formData,
    }).then((r) => r.json());
  },

  synthesize: (text: string, voiceId?: string) =>
    request<{ audioUrl: string }>("/voice/synthesize", {
      method: "POST",
      body: JSON.stringify({ text, voiceId }),
    }),

  getConversationHistory: () =>
    request<{ conversations: VoiceConversation[] }>("/voice/history"),
};

// Cloud Tools API
export const cloud = {
  getAccounts: () =>
    request<{ accounts: CloudAccount[] }>("/cloud/accounts"),

  connect: (data: {
    provider: string;
    name: string;
    credentials: object;
    region: string;
  }) =>
    request<{ account: CloudAccount }>("/cloud/accounts", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  disconnect: (id: number) =>
    request<{ success: boolean }>(`/cloud/accounts/${id}`, { method: "DELETE" }),

  sync: (id: number) =>
    request<{ success: boolean }>(`/cloud/accounts/${id}/sync`, {
      method: "POST",
    }),

  initiateOAuth: (provider: string) =>
    request<{ authUrl: string }>(`/cloud/oauth/${provider}`),

  getResources: (accountId: number, type?: string) =>
    request<{ resources: CloudResource[] }>(
      `/cloud/accounts/${accountId}/resources?type=${type || ""}`
    ),

  resourceAction: (resourceId: string, action: "start" | "stop" | "restart") =>
    request<{ success: boolean }>(`/cloud/resources/${resourceId}/${action}`, {
      method: "POST",
    }),

  getCosts: (accountId: number, period?: string) =>
    request<{ costs: CloudCost[] }>(
      `/cloud/accounts/${accountId}/costs?period=${period || "month"}`
    ),
};

// Audit & Telemetry API
export const audit = {
  getLogs: (filters?: { action?: string; resource?: string; userId?: number }) =>
    request<{ logs: AuditLog[] }>(
      `/audit/logs?${new URLSearchParams(filters as any).toString()}`
    ),

  exportLogs: (format: "json" | "csv", filters?: object) =>
    request<{ url: string }>("/audit/export", {
      method: "POST",
      body: JSON.stringify({ format, filters }),
    }),
};

// Additional Type Definitions
export interface UserProfile extends User {
  phone?: string;
  company?: string;
  jobTitle?: string;
  timezone?: string;
  language?: string;
}

export interface Session {
  id: string;
  device: string;
  browser: string;
  ip: string;
  location?: string;
  lastActive: string;
  current: boolean;
}

export interface TeamMember {
  id: number;
  userId: number;
  email: string;
  name: string;
  role: string;
  status: string;
  joinedAt: string;
}

export interface TeamInvitation {
  id: number;
  email: string;
  role: string;
  expiresAt: string;
}

export interface UsageSummary {
  creditsUsed: number;
  creditsLimit: number;
  apiCalls: number;
  storageUsed: number;
  storageLimit: number;
  projectsCount: number;
  projectsLimit: number;
}

export interface UsageRecord {
  date: string;
  credits: number;
  apiCalls: number;
  storage: number;
}

export interface UsageBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

export interface UsageLimits {
  credits: number;
  apiCalls: number;
  storage: number;
  projects: number;
}

export interface SubscriptionDetails {
  id: string;
  status: string;
  plan: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  interval: "month" | "year";
  trialEnd?: string;
}

export interface Invoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: string;
  paidAt?: string;
  dueDate: string;
  pdfUrl?: string;
}

export interface PaymentMethod {
  id: string;
  type: string;
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  isDefault: boolean;
}

export interface Email {
  id: number;
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
  htmlBody?: string;
  folder: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  receivedAt: string;
  agentProcessed?: boolean;
  agentSummary?: string;
  agentDraft?: string;
}

export interface EmailAgentRule {
  id: number;
  name: string;
  trigger: string;
  conditions: object;
  action: string;
  actionConfig: object;
  enabled: boolean;
  priority: number;
}

export interface EmailAgentSettings {
  enabled: boolean;
  autoReply: boolean;
  autoReplyDelay: number;
  summarize: boolean;
  categorize: boolean;
  prioritize: boolean;
  workingHours?: { start: string; end: string };
}

export interface ScheduledWork {
  id: number;
  name: string;
  description?: string;
  schedule: string;
  scheduleType: "cron" | "interval" | "once";
  type?: string;
  prompt?: string;
  enabled?: boolean;
  taskType: string;
  taskConfig: object;
  status: "active" | "paused" | "completed";
  nextRunAt?: string;
  lastRunAt?: string;
  createdAt: string;
}

export interface WorkExecution {
  id: number;
  workId: number;
  status: string;
  startedAt: string;
  completedAt?: string;
  result?: string;
  error?: string;
}

export interface DataExport {
  id: number;
  format: string;
  status: string;
  url?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface DeletionRequest {
  id: number;
  status: string;
  reason?: string;
  scheduledAt: string;
  createdAt: string;
}

export interface RetentionSettings {
  chatHistory: number;
  projectFiles: number;
  auditLogs: number;
  autoDelete: boolean;
}

export interface BrowserSession {
  id: string;
  status: string;
  resolution: string;
  currentUrl?: string;
  createdAt: string;
  expiresAt: string;
}

export interface Connector {
  id: number;
  name: string;
  type: string;
  provider: string;
  status: string;
  config: object;
  lastSyncAt?: string;
  createdAt: string;
}

export interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  features: string[];
  pricing?: string;
  popular?: boolean;
}

export interface InstalledIntegration {
  id: number;
  integrationId: string;
  name: string;
  status: string;
  config: object;
  installedAt: string;
}

export interface WorkOrder {
  id: number;
  title: string;
  description: string;
  type: string;
  priority: "low" | "medium" | "high" | "urgent" | string;
  status: "draft" | "pending" | "approved" | "in_progress" | "completed" | "rejected";
  assignedTo?: number;
  dueDate?: string | Date;
  estimatedHours?: number;
  actualHours?: number;
  result?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkOrderActivity {
  id: number;
  orderId: number;
  type: string;
  content: string;
  userId: number;
  userName: string;
  createdAt: string;
}

export interface DeployedApp {
  id: number;
  name: string;
  projectId?: number;
  provider: string;
  region: string;
  status: string;
  url?: string;
  replicas: number;
  config: object;
  createdAt: string;
  updatedAt: string;
}

export interface Deployment {
  id: number;
  appId: number;
  version: string;
  status: string;
  commit?: string;
  branch?: string;
  startedAt: string;
  completedAt?: string;
  deployedBy: number;
}

export interface DeploymentLog {
  timestamp: string;
  level: string;
  message: string;
}

export interface AppMetrics {
  cpu: number;
  memory: number;
  requests: number;
  errors: number;
  latency: number;
}

export interface VoiceSettings {
  language: string;
  voiceId: string;
  speed: number;
  pitch: number;
  volume: number;
  autoDetectLanguage: boolean;
  noiseReduction: boolean;
  echoCancellation: boolean;
  wakeWord: boolean;
  wakeWordPhrase: string;
}

export interface VoiceProfile {
  id: string;
  name: string;
  language: string;
  gender: string;
  style: string;
  preview?: string;
}

export interface VoiceConversation {
  id: number;
  startedAt: string;
  endedAt?: string;
  messageCount: number;
  summary?: string;
}

export interface CloudAccount {
  id: number;
  provider: string;
  name: string;
  accountId: string;
  region: string;
  status: string;
  lastSyncAt?: string;
  resources: {
    compute: number;
    storage: number;
    databases: number;
    functions: number;
  };
}

export interface CloudResource {
  id: string;
  accountId: number;
  type: string;
  name: string;
  status: string;
  region: string;
  details: object;
  cost?: number;
  createdAt: string;
}

export interface CloudCost {
  date: string;
  service: string;
  amount: number;
  currency: string;
}

export interface AuditLog {
  id: number;
  userId: number;
  userName: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: string;
  ipAddress: string;
  userAgent?: string;
  timestamp: string;
}

// Settings API
export const settings = {
  get: () =>
    request<{ settings: any; notifications?: any }>("/users/settings"),

  update: (data: any) =>
    request<{ success: boolean }>("/users/settings", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// API Keys API
export const apiKeys = {
  list: () =>
    request<{ keys: any[] }>("/users/api-keys"),

  create: (data: { name: string; scopes?: string[]; expiresIn?: number }) =>
    request<{ key: any; secret: string }>("/users/api-keys", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    request<{ success: boolean }>(`/users/api-keys/${id}`, {
      method: "DELETE",
    }),

  revoke: (id: number) =>
    request<{ success: boolean }>(`/users/api-keys/${id}/revoke`, {
      method: "POST",
    }),
};

// Data API (alias for dataControls)
export const data = dataControls;

// Team API
export const team = {
  getMembers: () =>
    request<{ members: TeamMember[] }>("/team/members"),

  invite: (emailOrData: string | { email: string; role: string }, role?: string) =>
    request<{ invitation: TeamInvitation }>("/team/invite", {
      method: "POST",
      body: JSON.stringify(
        typeof emailOrData === 'string'
          ? { email: emailOrData, role: role || 'member' }
          : emailOrData
      ),
    }),

  removeMember: (memberId: number) =>
    request<{ success: boolean }>(`/team/members/${memberId}`, {
      method: "DELETE",
    }),

  remove: (memberId: number) =>
    request<{ success: boolean }>(`/team/members/${memberId}`, {
      method: "DELETE",
    }),

  updateRole: (memberId: number, role: string) =>
    request<{ success: boolean }>(`/team/members/${memberId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),
};

// Export the api object with all namespaces
export const api = {
  auth,
  projects,
  chat,
  templates,
  users,
  stripe,
  admin,
  account,
  usage,
  billing,
  mail,
  email: mail, // alias
  scheduledWorks,
  dataControls,
  data: dataControls, // alias
  cloudBrowser,
  browser: cloudBrowser, // alias
  connectors,
  integrations,
  workOrders,
  appDeploy,
  apps: appDeploy, // alias
  voice,
  cloud,
  audit,
  settings,
  apiKeys,
  team,
};
