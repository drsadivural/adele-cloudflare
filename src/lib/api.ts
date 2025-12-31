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
