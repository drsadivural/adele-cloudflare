import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  users,
  stripe,
  auth,
  usage,
  billing,
  scheduledWorks,
  mail,
  dataControls,
  cloudBrowser,
  connectors,
  integrations,
  account,
  type ScheduledWork,
  type Email,
  type BrowserSession,
  type Connector,
  type Integration,
  type InstalledIntegration,
  type UsageSummary,
  type Invoice,
  type PaymentMethod,
  type DataExport,
  type RetentionSettings,
  type EmailAgentSettings,
} from "@/lib/api";
import { toast } from "sonner";
import {
  ArrowLeft,
  User,
  Settings2,
  BarChart3,
  CreditCard,
  Calendar,
  Mail,
  Database,
  Globe,
  Plug,
  Puzzle,
  Loader2,
  Save,
  ExternalLink,
  Eye,
  EyeOff,
  Check,
  X,
  Plus,
  Trash2,
  Play,
  Pause,
  RefreshCw,
  Download,
  Upload,
  Shield,
  Bell,
  Moon,
  Sun,
  Monitor,
  Clock,
  Zap,
  FileText,
  AlertTriangle,
  ChevronRight,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Copy,
  Link as LinkIcon,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  HelpCircle,
  Key,
  Lock,
  Smartphone,
  Laptop,
  Chrome,
  Send,
  Inbox,
  Archive,
  Star,
  Tag,
  Folder,
  Bot,
  Wand2,
  Brain,
  Sparkles,
  Cloud,
  Server,
  HardDrive,
  Wifi,
  WifiOff,
  Activity,
  TrendingUp,
  PieChart,
  DollarSign,
  Receipt,
  CreditCard as CardIcon,
  Building,
  Users,
  UserPlus,
  Settings as SettingsIcon,
  Sliders,
  ToggleLeft,
  ToggleRight,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Camera,
  Image,
  Video,
  File,
  FolderOpen,
  Trash,
  RotateCcw,
  History,
  Timer,
  CalendarDays,
  CalendarClock,
  PlayCircle,
  StopCircle,
  SkipForward,
  Repeat,
  Terminal,
  Code,
  GitBranch,
  Github,
  Gitlab,
  Slack,
  MessageSquare,
  AtSign,
  Hash,
  Bookmark,
  Heart,
  Share2,
  Maximize2,
  Minimize2,
  Move,
  Layers,
  Layout,
  Grid,
  List,
  Table,
  BarChart2,
  LineChart,
  TrendingDown,
  Percent,
  Package,
  Box,
  Boxes,
  Truck,
  MapPin,
  Navigation,
  Compass,
  Target,
  Crosshair,
  Aperture,
  Cpu,
  MemoryStick,
  CircuitBoard,
  Battery,
  BatteryCharging,
  Power,
  PowerOff,
  LogOut,
  LogIn,
  UserCheck,
  UserX,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  KeyRound,
  Fingerprint,
  ScanFace,
  QrCode,
  Scan,
  type LucideIcon,
} from "lucide-react";

// Tab type definition
type TabId =
  | "account"
  | "settings"
  | "usage"
  | "billing"
  | "scheduled"
  | "mail"
  | "data"
  | "browser"
  | "connectors"
  | "integrations";

interface TabConfig {
  id: TabId;
  label: string;
  icon: LucideIcon;
  description: string;
}

const TABS: TabConfig[] = [
  { id: "account", label: "Account", icon: User, description: "Profile & security" },
  { id: "settings", label: "Settings", icon: Settings2, description: "Preferences" },
  { id: "usage", label: "Usage", icon: BarChart3, description: "Analytics & quotas" },
  { id: "billing", label: "Billing", icon: CreditCard, description: "Subscription" },
  { id: "scheduled", label: "Scheduled Tasks", icon: Calendar, description: "Automation" },
  { id: "mail", label: "Mail ADELE", icon: Mail, description: "Email agent" },
  { id: "data", label: "Data Controls", icon: Database, description: "Privacy & export" },
  { id: "browser", label: "Cloud Browser", icon: Globe, description: "Browser sessions" },
  { id: "connectors", label: "Connectors", icon: Plug, description: "Data sources" },
  { id: "integrations", label: "Integrations", icon: Puzzle, description: "Third-party apps" },
];

// Notification settings interface
interface NotificationSettings {
  email_updates: boolean;
  marketing: boolean;
  security: boolean;
  weekly_digest: boolean;
  project_updates: boolean;
  team_mentions: boolean;
}

// App settings interface
interface AppSettings {
  theme: "light" | "dark" | "system";
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: "12h" | "24h";
  autoSave: boolean;
  compactMode: boolean;
  animations: boolean;
  soundEffects: boolean;
  desktopNotifications: boolean;
  voiceEnabled: boolean;
  voiceLanguage: string;
  ttsEnabled: boolean;
  editorFontSize: number;
  editorTabSize: number;
}

export default function Settings() {
  const [, setLocation] = useLocation();
  const { user, subscription, loading: authLoading, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("account");
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Account state
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    position: "",
    timezone: "",
    language: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);

  // Settings state
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_updates: true,
    marketing: false,
    security: true,
    weekly_digest: true,
    project_updates: true,
    team_mentions: true,
  });
  const [appSettings, setAppSettings] = useState<AppSettings>({
    theme: "system",
    language: "en",
    timezone: "UTC",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
    autoSave: true,
    compactMode: false,
    animations: true,
    soundEffects: false,
    desktopNotifications: true,
    voiceEnabled: false,
    voiceLanguage: "en-US",
    ttsEnabled: false,
    editorFontSize: 14,
    editorTabSize: 2,
  });

  // Usage state
  const [usageSummary, setUsageSummary] = useState<UsageSummary | null>(null);
  const [usageHistory, setUsageHistory] = useState<any[]>([]);

  // Billing state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);

  // Scheduled tasks state
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledWork[]>([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({
    name: "",
    description: "",
    scheduleType: "cron" as "cron" | "interval" | "once",
    schedule: "",
    taskType: "automation",
    prompt: "",
  });

  // Mail state
  const [emailConnections, setEmailConnections] = useState<any[]>([]);
  const [emailAgentSettings, setEmailAgentSettings] = useState<EmailAgentSettings>({
    enabled: false,
    autoReply: false,
    autoReplyDelay: 5,
    summarize: true,
    categorize: true,
    prioritize: true,
  });
  const [emailRules, setEmailRules] = useState<any[]>([]);

  // Data controls state
  const [dataExports, setDataExports] = useState<DataExport[]>([]);
  const [retentionSettings, setRetentionSettings] = useState<RetentionSettings>({
    chatHistory: 90,
    projectFiles: 365,
    auditLogs: 90,
    autoDelete: false,
  });
  const [deletionRequest, setDeletionRequest] = useState<any>(null);

  // Cloud browser state
  const [browserSessions, setBrowserSessions] = useState<BrowserSession[]>([]);
  const [browserProfiles, setBrowserProfiles] = useState<any[]>([]);
  const [showNewSession, setShowNewSession] = useState(false);

  // Connectors state
  const [connectorsList, setConnectorsList] = useState<Connector[]>([]);
  const [showAddConnector, setShowAddConnector] = useState(false);

  // Integrations state
  const [availableIntegrations, setAvailableIntegrations] = useState<Integration[]>([]);
  const [installedIntegrations, setInstalledIntegrations] = useState<InstalledIntegration[]>([]);

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [user, authLoading, setLocation]);

  // Load user data
  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || "",
        email: user.email || "",
        phone: (user as any).phone || "",
        company: (user as any).company || "",
        position: (user as any).position || "",
        timezone: (user as any).timezone || "UTC",
        language: (user as any).language || "en",
      });
      loadInitialData();
    }
  }, [user]);

  // Load data when tab changes
  useEffect(() => {
    if (user) {
      loadTabData(activeTab);
    }
  }, [activeTab, user]);

  const loadInitialData = async () => {
    try {
      const response = await users.getProfile();
      if (response.settings) {
        if (response.settings.notifications) {
          setNotifications(response.settings.notifications as NotificationSettings);
        }
        setAppSettings((prev) => ({
          ...prev,
          theme: (response.settings?.theme || "system") as "light" | "dark" | "system",
          language: response.settings?.language || "en",
          timezone: response.settings?.timezone || "UTC",
          voiceEnabled: response.settings?.voiceEnabled || false,
          voiceLanguage: response.settings?.voiceLanguage || "en-US",
          ttsEnabled: response.settings?.ttsEnabled || false,
          editorFontSize: response.settings?.editorFontSize || 14,
          editorTabSize: response.settings?.editorTabSize || 2,
          autoSave: response.settings?.autoSave ?? true,
        }));
      }
    } catch (error) {
      console.error("Failed to load initial data:", error);
    }
  };

  const loadTabData = async (tab: TabId) => {
    setLoading(true);
    try {
      switch (tab) {
        case "account":
          try {
            const sessionsRes = await account.getSessions();
            setSessions(sessionsRes.sessions || []);
          } catch (e) {
            setSessions([]);
          }
          break;
        case "usage":
          try {
            const usageRes = await usage.getSummary();
            setUsageSummary(usageRes.usage);
            const historyRes = await usage.getHistory();
            setUsageHistory(historyRes.history || []);
          } catch (e) {
            setUsageSummary(null);
            setUsageHistory([]);
          }
          break;
        case "billing":
          try {
            const subRes = await billing.getSubscription();
            setSubscriptionDetails(subRes.subscription);
            const invRes = await billing.getInvoices();
            setInvoices(invRes.invoices || []);
            const pmRes = await billing.getPaymentMethods();
            setPaymentMethods(pmRes.paymentMethods || []);
          } catch (e) {
            setSubscriptionDetails(null);
            setInvoices([]);
            setPaymentMethods([]);
          }
          break;
        case "scheduled":
          try {
            const tasksRes = await scheduledWorks.list();
            setScheduledTasks(tasksRes.works || []);
          } catch (e) {
            setScheduledTasks([]);
          }
          break;
        case "mail":
          try {
            const agentRes = await mail.getAgentSettings();
            setEmailAgentSettings(agentRes.settings);
            const rulesRes = await mail.getAgentRules();
            setEmailRules(rulesRes.rules || []);
          } catch (e) {
            setEmailRules([]);
          }
          break;
        case "data":
          try {
            const exportsRes = await dataControls.getExportHistory();
            setDataExports(exportsRes.exports || []);
            const retentionRes = await dataControls.getRetentionSettings();
            setRetentionSettings(retentionRes.settings);
          } catch (e) {
            setDataExports([]);
          }
          break;
        case "browser":
          try {
            const sessionsRes = await cloudBrowser.getSessions();
            setBrowserSessions(sessionsRes.sessions || []);
            const profilesRes = await cloudBrowser.getProfiles();
            setBrowserProfiles(profilesRes.profiles || []);
          } catch (e) {
            setBrowserSessions([]);
            setBrowserProfiles([]);
          }
          break;
        case "connectors":
          try {
            const connectorsRes = await connectors.list();
            setConnectorsList(connectorsRes.connectors || []);
          } catch (e) {
            setConnectorsList([]);
          }
          break;
        case "integrations":
          try {
            const availableRes = await integrations.getAvailable();
            setAvailableIntegrations(availableRes.integrations || []);
            const installedRes = await integrations.getInstalled();
            setInstalledIntegrations(installedRes.integrations || []);
          } catch (e) {
            setAvailableIntegrations([]);
            setInstalledIntegrations([]);
          }
          break;
      }
    } catch (error) {
      console.error(`Failed to load ${tab} data:`, error);
    } finally {
      setLoading(false);
    }
  };

  // Account handlers
  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await users.updateProfile({ name: profile.name });
      await refreshUser();
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await auth.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      toast.success("Password changed successfully");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      toast.error(error.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await account.revokeSession(sessionId);
      setSessions(sessions.filter((s) => s.id !== sessionId));
      toast.success("Session revoked");
    } catch (error: any) {
      toast.error(error.message || "Failed to revoke session");
    }
  };

  // Settings handlers
  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await users.updateSettings({
        ...appSettings,
        notifications,
      });
      toast.success("Settings saved successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNotification = async (key: keyof NotificationSettings) => {
    const newNotifications = { ...notifications, [key]: !notifications[key] };
    setNotifications(newNotifications);
    try {
      await users.updateSettings({ notifications: newNotifications });
      toast.success("Notification preference updated");
    } catch (error: any) {
      setNotifications(notifications);
      toast.error("Failed to update notification preference");
    }
  };

  // Billing handlers
  const handleManageBilling = async () => {
    try {
      const response = await billing.createPortalSession();
      if (response.url) {
        window.location.href = response.url;
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to open billing portal");
    }
  };

  const handleUpgradePlan = async () => {
    setLocation("/pricing");
  };

  // Scheduled tasks handlers
  const handleCreateTask = async () => {
    if (!newTask.name || !newTask.schedule) {
      toast.error("Please fill in all required fields");
      return;
    }
    setLoading(true);
    try {
      const response = await scheduledWorks.create({
        name: newTask.name,
        description: newTask.description,
        scheduleType: newTask.scheduleType,
        schedule: newTask.schedule,
        taskType: newTask.taskType,
        taskConfig: { prompt: newTask.prompt },
        status: "active",
      });
      setScheduledTasks([...scheduledTasks, response.work]);
      setShowAddTask(false);
      setNewTask({
        name: "",
        description: "",
        scheduleType: "cron",
        schedule: "",
        taskType: "automation",
        prompt: "",
      });
      toast.success("Task created successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (task: ScheduledWork) => {
    try {
      if (task.status === "active") {
        await scheduledWorks.pause(task.id);
        setScheduledTasks(
          scheduledTasks.map((t) => (t.id === task.id ? { ...t, status: "paused" as const } : t))
        );
        toast.success("Task paused");
      } else {
        await scheduledWorks.resume(task.id);
        setScheduledTasks(
          scheduledTasks.map((t) => (t.id === task.id ? { ...t, status: "active" as const } : t))
        );
        toast.success("Task resumed");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await scheduledWorks.delete(taskId);
      setScheduledTasks(scheduledTasks.filter((t) => t.id !== taskId));
      toast.success("Task deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete task");
    }
  };

  const handleRunTask = async (taskId: number) => {
    try {
      await scheduledWorks.trigger(taskId);
      toast.success("Task triggered successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to trigger task");
    }
  };

  // Mail handlers
  const handleSaveEmailSettings = async () => {
    setLoading(true);
    try {
      await mail.updateAgentSettings(emailAgentSettings);
      toast.success("Email agent settings saved");
    } catch (error: any) {
      toast.error(error.message || "Failed to save email settings");
    } finally {
      setLoading(false);
    }
  };

  const handleConnectEmail = async (provider: string) => {
    try {
      const response = await mail.initiateOAuth(provider);
      if (response.authUrl) {
        window.location.href = response.authUrl;
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to connect email");
    }
  };

  // Data controls handlers
  const handleExportData = async (format: "json" | "csv" | "zip") => {
    setLoading(true);
    try {
      const response = await dataControls.exportData(format);
      if (response.url) {
        window.open(response.url, "_blank");
        toast.success("Export started. Download will begin shortly.");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to export data");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRetention = async () => {
    setLoading(true);
    try {
      await dataControls.updateRetentionSettings(retentionSettings);
      toast.success("Retention settings saved");
    } catch (error: any) {
      toast.error(error.message || "Failed to save retention settings");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDeletion = async () => {
    if (!confirm("Are you sure you want to request account deletion? This action cannot be undone.")) {
      return;
    }
    try {
      const response = await dataControls.requestDeletion("User requested deletion");
      setDeletionRequest(response.request);
      toast.success("Deletion request submitted. Your account will be deleted in 30 days.");
    } catch (error: any) {
      toast.error(error.message || "Failed to request deletion");
    }
  };

  // Cloud browser handlers
  const handleCreateBrowserSession = async () => {
    setLoading(true);
    try {
      const response = await cloudBrowser.createSession({
        resolution: "1920x1080",
        name: `Session ${browserSessions.length + 1}`,
      });
      setBrowserSessions([...browserSessions, response.session]);
      setShowNewSession(false);
      toast.success("Browser session created");
      if (response.connectUrl) {
        window.open(response.connectUrl, "_blank");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create browser session");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBrowserSession = async (sessionId: number) => {
    try {
      await cloudBrowser.deleteSession(sessionId);
      setBrowserSessions(browserSessions.filter((s) => s.id !== sessionId.toString()));
      toast.success("Session deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete session");
    }
  };

  // Connectors handlers
  const handleConnectConnector = async (connectorId: number | string) => {
    try {
      await connectors.connect(connectorId);
      await loadTabData("connectors");
      toast.success("Connector connected");
    } catch (error: any) {
      toast.error(error.message || "Failed to connect");
    }
  };

  const handleDisconnectConnector = async (connectorId: number | string) => {
    try {
      await connectors.disconnect(connectorId);
      await loadTabData("connectors");
      toast.success("Connector disconnected");
    } catch (error: any) {
      toast.error(error.message || "Failed to disconnect");
    }
  };

  const handleSyncConnector = async (connectorId: number | string) => {
    try {
      await connectors.sync(connectorId);
      toast.success("Sync started");
    } catch (error: any) {
      toast.error(error.message || "Failed to sync");
    }
  };

  // Integrations handlers
  const handleInstallIntegration = async (integrationId: string) => {
    try {
      const response = await integrations.install(integrationId);
      setInstalledIntegrations([...installedIntegrations, response.installation]);
      toast.success("Integration installed");
    } catch (error: any) {
      toast.error(error.message || "Failed to install integration");
    }
  };

  const handleUninstallIntegration = async (installationId: number | string) => {
    try {
      await integrations.uninstall(installationId);
      setInstalledIntegrations(
        installedIntegrations.filter((i) => i.id !== installationId)
      );
      toast.success("Integration uninstalled");
    } catch (error: any) {
      toast.error(error.message || "Failed to uninstall integration");
    }
  };

  const handleToggleIntegration = async (installationId: number | string, enabled: boolean) => {
    try {
      await integrations.toggle(installationId, enabled);
      setInstalledIntegrations(
        installedIntegrations.map((i) =>
          i.id === installationId ? { ...i, status: enabled ? "active" : "inactive" } : i
        )
      );
      toast.success(enabled ? "Integration enabled" : "Integration disabled");
    } catch (error: any) {
      toast.error(error.message || "Failed to toggle integration");
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "account":
        return <AccountTab />;
      case "settings":
        return <SettingsTab />;
      case "usage":
        return <UsageTab />;
      case "billing":
        return <BillingTab />;
      case "scheduled":
        return <ScheduledTab />;
      case "mail":
        return <MailTab />;
      case "data":
        return <DataTab />;
      case "browser":
        return <BrowserTab />;
      case "connectors":
        return <ConnectorsTab />;
      case "integrations":
        return <IntegrationsTab />;
      default:
        return null;
    }
  };

  // Account Tab Component
  const AccountTab = () => (
    <div className="space-y-6">
      {/* Profile Section */}
      <div className="bg-card border rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile Information
        </h2>
        <div className="space-y-4">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-2xl font-bold text-white">
              {profile.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{profile.name || "User"}</h3>
              <p className="text-muted-foreground">{profile.email}</p>
              <button className="text-sm text-primary hover:underline mt-1">
                Change avatar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-4 py-3 rounded-xl border bg-muted text-muted-foreground cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Company</label>
              <input
                type="text"
                value={profile.company}
                onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Your company"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Position</label>
              <input
                type="text"
                value={profile.position}
                onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Your role"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Timezone</label>
              <select
                value={profile.timezone}
                onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
                <option value="Asia/Shanghai">Shanghai</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 transition"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-card border rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security
        </h2>

        {/* Change Password */}
        <div className="mb-6 pb-6 border-b">
          <h3 className="font-medium mb-4">Change Password</h3>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-2">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                  className="w-full px-4 py-3 pr-12 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                  className="w-full px-4 py-3 pr-12 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Must be at least 8 characters</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Confirm New Password</label>
              <input
                type={showNewPassword ? "text" : "password"}
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              onClick={handleChangePassword}
              disabled={loading || !passwordForm.currentPassword || !passwordForm.newPassword}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Update Password
            </button>
          </div>
        </div>

        {/* Two-Factor Authentication */}
        <div className="mb-6 pb-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Two-Factor Authentication</h3>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <button
              onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
              className={`px-4 py-2 rounded-xl transition ${
                twoFactorEnabled
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              {twoFactorEnabled ? "Enabled" : "Enable 2FA"}
            </button>
          </div>
        </div>

        {/* Active Sessions */}
        <div>
          <h3 className="font-medium mb-4">Active Sessions</h3>
          <div className="space-y-3">
            {sessions.length === 0 ? (
              <p className="text-muted-foreground text-sm">No active sessions found</p>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <Laptop className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {session.device} - {session.browser}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {session.ip} • Last active: {session.lastActive}
                      </p>
                    </div>
                  </div>
                  {session.current ? (
                    <span className="text-sm text-green-600 dark:text-green-400">Current</span>
                  ) : (
                    <button
                      onClick={() => handleRevokeSession(session.id)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Settings Tab Component
  const SettingsTab = () => (
    <div className="space-y-6">
      {/* Appearance */}
      <div className="bg-card border rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          Appearance
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-3">Theme</label>
            <div className="flex gap-3">
              {[
                { value: "light", icon: Sun, label: "Light" },
                { value: "dark", icon: Moon, label: "Dark" },
                { value: "system", icon: Monitor, label: "System" },
              ].map((theme) => (
                <button
                  key={theme.value}
                  onClick={() =>
                    setAppSettings({ ...appSettings, theme: theme.value as any })
                  }
                  className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border transition ${
                    appSettings.theme === theme.value
                      ? "border-primary bg-primary/10"
                      : "hover:bg-muted"
                  }`}
                >
                  <theme.icon className="h-5 w-5" />
                  {theme.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Language</label>
              <select
                value={appSettings.language}
                onChange={(e) =>
                  setAppSettings({ ...appSettings, language: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="ja">日本語</option>
                <option value="zh">中文</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Date Format</label>
              <select
                value={appSettings.dateFormat}
                onChange={(e) =>
                  setAppSettings({ ...appSettings, dateFormat: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">Compact Mode</p>
              <p className="text-sm text-muted-foreground">Reduce spacing and padding</p>
            </div>
            <button
              onClick={() =>
                setAppSettings({ ...appSettings, compactMode: !appSettings.compactMode })
              }
              className={`w-12 h-6 rounded-full relative transition-colors ${
                appSettings.compactMode ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                  appSettings.compactMode ? "right-1" : "left-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">Animations</p>
              <p className="text-sm text-muted-foreground">Enable UI animations</p>
            </div>
            <button
              onClick={() =>
                setAppSettings({ ...appSettings, animations: !appSettings.animations })
              }
              className={`w-12 h-6 rounded-full relative transition-colors ${
                appSettings.animations ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                  appSettings.animations ? "right-1" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-card border rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
        </h2>
        <div className="space-y-4">
          {[
            {
              key: "email_updates" as keyof NotificationSettings,
              label: "Email Updates",
              description: "Receive updates about your projects via email",
            },
            {
              key: "project_updates" as keyof NotificationSettings,
              label: "Project Updates",
              description: "Get notified when projects are updated",
            },
            {
              key: "team_mentions" as keyof NotificationSettings,
              label: "Team Mentions",
              description: "Notify when someone mentions you",
            },
            {
              key: "weekly_digest" as keyof NotificationSettings,
              label: "Weekly Digest",
              description: "Receive a weekly summary of activity",
            },
            {
              key: "security" as keyof NotificationSettings,
              label: "Security Alerts",
              description: "Get notified about security-related events",
            },
            {
              key: "marketing" as keyof NotificationSettings,
              label: "Marketing Emails",
              description: "Receive news, tips, and special offers",
            },
          ].map((pref) => (
            <div key={pref.key} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">{pref.label}</p>
                <p className="text-sm text-muted-foreground">{pref.description}</p>
              </div>
              <button
                onClick={() => handleToggleNotification(pref.key)}
                className={`w-12 h-6 rounded-full relative transition-colors ${
                  notifications[pref.key] ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                    notifications[pref.key] ? "right-1" : "left-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Editor Settings */}
      <div className="bg-card border rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Code className="h-5 w-5" />
          Editor Settings
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Font Size</label>
              <select
                value={appSettings.editorFontSize}
                onChange={(e) =>
                  setAppSettings({ ...appSettings, editorFontSize: parseInt(e.target.value) })
                }
                className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {[12, 13, 14, 15, 16, 18, 20].map((size) => (
                  <option key={size} value={size}>
                    {size}px
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tab Size</label>
              <select
                value={appSettings.editorTabSize}
                onChange={(e) =>
                  setAppSettings({ ...appSettings, editorTabSize: parseInt(e.target.value) })
                }
                className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {[2, 4, 8].map((size) => (
                  <option key={size} value={size}>
                    {size} spaces
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">Auto Save</p>
              <p className="text-sm text-muted-foreground">Automatically save changes</p>
            </div>
            <button
              onClick={() =>
                setAppSettings({ ...appSettings, autoSave: !appSettings.autoSave })
              }
              className={`w-12 h-6 rounded-full relative transition-colors ${
                appSettings.autoSave ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                  appSettings.autoSave ? "right-1" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Voice Settings */}
      <div className="bg-card border rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Voice & Audio
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">Voice Input</p>
              <p className="text-sm text-muted-foreground">Enable voice commands</p>
            </div>
            <button
              onClick={() =>
                setAppSettings({ ...appSettings, voiceEnabled: !appSettings.voiceEnabled })
              }
              className={`w-12 h-6 rounded-full relative transition-colors ${
                appSettings.voiceEnabled ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                  appSettings.voiceEnabled ? "right-1" : "left-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">Text-to-Speech</p>
              <p className="text-sm text-muted-foreground">Read responses aloud</p>
            </div>
            <button
              onClick={() =>
                setAppSettings({ ...appSettings, ttsEnabled: !appSettings.ttsEnabled })
              }
              className={`w-12 h-6 rounded-full relative transition-colors ${
                appSettings.ttsEnabled ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                  appSettings.ttsEnabled ? "right-1" : "left-1"
                }`}
              />
            </button>
          </div>

          {appSettings.voiceEnabled && (
            <div>
              <label className="block text-sm font-medium mb-2">Voice Language</label>
              <select
                value={appSettings.voiceLanguage}
                onChange={(e) =>
                  setAppSettings({ ...appSettings, voiceLanguage: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="es-ES">Spanish</option>
                <option value="fr-FR">French</option>
                <option value="de-DE">German</option>
                <option value="ja-JP">Japanese</option>
                <option value="zh-CN">Chinese</option>
              </select>
            </div>
          )}

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">Sound Effects</p>
              <p className="text-sm text-muted-foreground">Play sounds for notifications</p>
            </div>
            <button
              onClick={() =>
                setAppSettings({ ...appSettings, soundEffects: !appSettings.soundEffects })
              }
              className={`w-12 h-6 rounded-full relative transition-colors ${
                appSettings.soundEffects ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                  appSettings.soundEffects ? "right-1" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={handleSaveSettings}
        disabled={loading}
        className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 transition"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save All Settings
      </button>
    </div>
  );

  // Usage Tab Component
  const UsageTab = () => (
    <div className="space-y-6">
      {/* Usage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Credits Used",
            value: usageSummary?.creditsUsed || 0,
            limit: usageSummary?.creditsLimit || 1000,
            icon: Zap,
            color: "text-yellow-500",
          },
          {
            label: "API Calls",
            value: usageSummary?.apiCalls || 0,
            limit: 10000,
            icon: Activity,
            color: "text-blue-500",
          },
          {
            label: "Storage",
            value: `${((usageSummary?.storageUsed || 0) / 1024 / 1024 / 1024).toFixed(2)} GB`,
            limit: `${((usageSummary?.storageLimit || 5368709120) / 1024 / 1024 / 1024).toFixed(0)} GB`,
            icon: HardDrive,
            color: "text-green-500",
            isStorage: true,
          },
          {
            label: "Projects",
            value: usageSummary?.projectsCount || 0,
            limit: usageSummary?.projectsLimit || 10,
            icon: Folder,
            color: "text-purple-500",
          },
        ].map((stat, i) => (
          <div key={i} className="bg-card border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-xl bg-muted ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold mb-2">
              {stat.isStorage ? stat.value : stat.value.toLocaleString()}
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    ((typeof stat.value === "number" ? stat.value : parseFloat(stat.value)) /
                      (typeof stat.limit === "number" ? stat.limit : parseFloat(stat.limit))) *
                      100,
                    100
                  )}%`,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              of {stat.isStorage ? stat.limit : stat.limit.toLocaleString()} limit
            </p>
          </div>
        ))}
      </div>

      {/* Usage Chart */}
      <div className="bg-card border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Usage Trends
          </h2>
          <div className="flex gap-2">
            {["7d", "30d", "90d"].map((period) => (
              <button
                key={period}
                className="px-3 py-1 text-sm rounded-lg bg-muted hover:bg-muted/80 transition"
              >
                {period}
              </button>
            ))}
          </div>
        </div>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          {usageHistory.length === 0 ? (
            <div className="text-center">
              <BarChart2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No usage data available yet</p>
              <p className="text-sm">Start using ADELE to see your usage trends</p>
            </div>
          ) : (
            <div className="w-full h-full flex items-end gap-1">
              {usageHistory.slice(-30).map((record, i) => (
                <div
                  key={i}
                  className="flex-1 bg-primary/20 hover:bg-primary/40 rounded-t transition"
                  style={{
                    height: `${Math.max((record.credits / 100) * 100, 5)}%`,
                  }}
                  title={`${record.date}: ${record.credits} credits`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Usage Breakdown */}
      <div className="bg-card border rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Usage Breakdown
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {[
              { label: "Code Generation", value: 45, color: "bg-blue-500" },
              { label: "Chat Conversations", value: 25, color: "bg-green-500" },
              { label: "File Storage", value: 15, color: "bg-yellow-500" },
              { label: "API Requests", value: 10, color: "bg-purple-500" },
              { label: "Other", value: 5, color: "bg-gray-500" },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{item.label}</span>
                  <span className="font-medium">{item.value}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full`}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 100 100" className="transform -rotate-90">
                {[
                  { value: 45, color: "#3b82f6", offset: 0 },
                  { value: 25, color: "#22c55e", offset: 45 },
                  { value: 15, color: "#eab308", offset: 70 },
                  { value: 10, color: "#a855f7", offset: 85 },
                  { value: 5, color: "#6b7280", offset: 95 },
                ].map((segment, i) => (
                  <circle
                    key={i}
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={segment.color}
                    strokeWidth="20"
                    strokeDasharray={`${segment.value * 2.51} 251`}
                    strokeDashoffset={-segment.offset * 2.51}
                  />
                ))}
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Billing Tab Component
  const BillingTab = () => (
    <div className="space-y-6">
      {/* Current Plan */}
      <div className="bg-card border rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Current Plan
        </h2>
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl mb-6">
          <div>
            <h3 className="text-2xl font-bold capitalize">
              {subscription?.plan || subscriptionDetails?.plan || "Free"} Plan
            </h3>
            <p className="text-muted-foreground">
              {subscription?.status === "active" || subscriptionDetails?.status === "active"
                ? `Renews on ${new Date(
                    subscription?.currentPeriodEnd || subscriptionDetails?.currentPeriodEnd || ""
                  ).toLocaleDateString()}`
                : "No active subscription"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">
              ${subscriptionDetails?.amount || 0}
              <span className="text-lg font-normal text-muted-foreground">
                /{subscriptionDetails?.interval || "month"}
              </span>
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleUpgradePlan}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition"
          >
            <Zap className="h-4 w-4" />
            {subscription?.plan === "free" ? "Upgrade Plan" : "Change Plan"}
          </button>
          {subscription?.plan !== "free" && (
            <button
              onClick={handleManageBilling}
              className="flex items-center gap-2 px-6 py-3 border rounded-xl hover:bg-muted transition"
            >
              <ExternalLink className="h-4 w-4" />
              Manage Billing
            </button>
          )}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-card border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CardIcon className="h-5 w-5" />
            Payment Methods
          </h2>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition">
            <Plus className="h-4 w-4" />
            Add Card
          </button>
        </div>
        <div className="space-y-3">
          {paymentMethods.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No payment methods added yet
            </p>
          ) : (
            paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded flex items-center justify-center text-white text-xs font-bold">
                    {method.brand?.toUpperCase() || "CARD"}
                  </div>
                  <div>
                    <p className="font-medium">•••• •••• •••• {method.last4}</p>
                    <p className="text-sm text-muted-foreground">
                      Expires {method.expMonth}/{method.expYear}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {method.isDefault && (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                      Default
                    </span>
                  )}
                  <button className="p-2 hover:bg-muted rounded-lg transition">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Invoices */}
      <div className="bg-card border rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Billing History
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-muted-foreground border-b">
                <th className="pb-3 font-medium">Invoice</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    No invoices yet
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b last:border-0">
                    <td className="py-4 font-medium">{invoice.number}</td>
                    <td className="py-4 text-muted-foreground">
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-4">
                      ${(invoice.amount / 100).toFixed(2)} {invoice.currency.toUpperCase()}
                    </td>
                    <td className="py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          invoice.status === "paid"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td className="py-4">
                      {invoice.pdfUrl && (
                        <a
                          href={invoice.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          <Download className="h-4 w-4" />
                          PDF
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Scheduled Tasks Tab Component
  const ScheduledTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Scheduled Tasks</h2>
          <p className="text-sm text-muted-foreground">
            Automate recurring tasks and workflows
          </p>
        </div>
        <button
          onClick={() => setShowAddTask(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition"
        >
          <Plus className="h-4 w-4" />
          New Task
        </button>
      </div>

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border rounded-2xl p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Create Scheduled Task</h3>
              <button
                onClick={() => setShowAddTask(false)}
                className="p-2 hover:bg-muted rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Task Name</label>
                <input
                  type="text"
                  value={newTask.name}
                  onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Daily report generation"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={2}
                  placeholder="What does this task do?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Schedule Type</label>
                <select
                  value={newTask.scheduleType}
                  onChange={(e) =>
                    setNewTask({ ...newTask, scheduleType: e.target.value as any })
                  }
                  className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="cron">Cron Expression</option>
                  <option value="interval">Interval</option>
                  <option value="once">One-time</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  {newTask.scheduleType === "cron"
                    ? "Cron Expression"
                    : newTask.scheduleType === "interval"
                    ? "Interval (minutes)"
                    : "Run At"}
                </label>
                <input
                  type="text"
                  value={newTask.schedule}
                  onChange={(e) => setNewTask({ ...newTask, schedule: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={
                    newTask.scheduleType === "cron"
                      ? "0 9 * * *"
                      : newTask.scheduleType === "interval"
                      ? "60"
                      : "2024-01-15T09:00:00"
                  }
                />
                {newTask.scheduleType === "cron" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Example: "0 9 * * *" runs daily at 9 AM
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Task Prompt</label>
                <textarea
                  value={newTask.prompt}
                  onChange={(e) => setNewTask({ ...newTask, prompt: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={3}
                  placeholder="Describe what ADELE should do..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddTask(false)}
                  className="flex-1 px-4 py-3 border rounded-xl hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTask}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 transition"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Create Task"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tasks List */}
      <div className="space-y-4">
        {scheduledTasks.length === 0 ? (
          <div className="bg-card border rounded-2xl p-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No scheduled tasks</h3>
            <p className="text-muted-foreground mb-4">
              Create your first automated task to get started
            </p>
            <button
              onClick={() => setShowAddTask(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition"
            >
              Create Task
            </button>
          </div>
        ) : (
          scheduledTasks.map((task) => (
            <div key={task.id} className="bg-card border rounded-2xl p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-xl ${
                      task.status === "active"
                        ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Timer className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{task.name}</h3>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {task.schedule}
                      </span>
                      {task.nextRunAt && (
                        <span className="text-muted-foreground">
                          Next: {new Date(task.nextRunAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRunTask(task.id)}
                    className="p-2 hover:bg-muted rounded-lg transition"
                    title="Run now"
                  >
                    <Play className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleToggleTask(task)}
                    className="p-2 hover:bg-muted rounded-lg transition"
                    title={task.status === "active" ? "Pause" : "Resume"}
                  >
                    {task.status === "active" ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // Mail Tab Component
  const MailTab = () => (
    <div className="space-y-6">
      {/* Email Agent Settings */}
      <div className="bg-card border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Email Agent
            </h2>
            <p className="text-sm text-muted-foreground">
              AI-powered email assistant for automated responses
            </p>
          </div>
          <button
            onClick={() =>
              setEmailAgentSettings({ ...emailAgentSettings, enabled: !emailAgentSettings.enabled })
            }
            className={`px-4 py-2 rounded-xl transition ${
              emailAgentSettings.enabled
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            {emailAgentSettings.enabled ? "Enabled" : "Enable Agent"}
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Auto Reply</p>
              <p className="text-sm text-muted-foreground">
                Automatically draft replies to incoming emails
              </p>
            </div>
            <button
              onClick={() =>
                setEmailAgentSettings({
                  ...emailAgentSettings,
                  autoReply: !emailAgentSettings.autoReply,
                })
              }
              className={`w-12 h-6 rounded-full relative transition-colors ${
                emailAgentSettings.autoReply ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                  emailAgentSettings.autoReply ? "right-1" : "left-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Summarize Emails</p>
              <p className="text-sm text-muted-foreground">
                Generate AI summaries for long emails
              </p>
            </div>
            <button
              onClick={() =>
                setEmailAgentSettings({
                  ...emailAgentSettings,
                  summarize: !emailAgentSettings.summarize,
                })
              }
              className={`w-12 h-6 rounded-full relative transition-colors ${
                emailAgentSettings.summarize ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                  emailAgentSettings.summarize ? "right-1" : "left-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Auto Categorize</p>
              <p className="text-sm text-muted-foreground">
                Automatically sort emails into categories
              </p>
            </div>
            <button
              onClick={() =>
                setEmailAgentSettings({
                  ...emailAgentSettings,
                  categorize: !emailAgentSettings.categorize,
                })
              }
              className={`w-12 h-6 rounded-full relative transition-colors ${
                emailAgentSettings.categorize ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                  emailAgentSettings.categorize ? "right-1" : "left-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">Priority Detection</p>
              <p className="text-sm text-muted-foreground">
                Highlight important emails automatically
              </p>
            </div>
            <button
              onClick={() =>
                setEmailAgentSettings({
                  ...emailAgentSettings,
                  prioritize: !emailAgentSettings.prioritize,
                })
              }
              className={`w-12 h-6 rounded-full relative transition-colors ${
                emailAgentSettings.prioritize ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                  emailAgentSettings.prioritize ? "right-1" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>

        <button
          onClick={handleSaveEmailSettings}
          disabled={loading}
          className="mt-6 flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 transition"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Settings
        </button>
      </div>

      {/* Connected Accounts */}
      <div className="bg-card border rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <LinkIcon className="h-5 w-5" />
          Connected Email Accounts
        </h2>
        <div className="space-y-4">
          {emailConnections.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No email accounts connected</p>
              <div className="flex flex-wrap justify-center gap-3">
                {[
                  { provider: "google", label: "Gmail", icon: "G" },
                  { provider: "microsoft", label: "Outlook", icon: "M" },
                  { provider: "imap", label: "IMAP", icon: "@" },
                ].map((email) => (
                  <button
                    key={email.provider}
                    onClick={() => handleConnectEmail(email.provider)}
                    className="flex items-center gap-2 px-4 py-2 border rounded-xl hover:bg-muted transition"
                  >
                    <span className="w-6 h-6 rounded bg-muted flex items-center justify-center text-xs font-bold">
                      {email.icon}
                    </span>
                    Connect {email.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            emailConnections.map((connection) => (
              <div
                key={connection.id}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5" />
                  <div>
                    <p className="font-medium">{connection.email}</p>
                    <p className="text-sm text-muted-foreground">{connection.provider}</p>
                  </div>
                </div>
                <button className="text-red-600 hover:text-red-700">Disconnect</button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Email Rules */}
      <div className="bg-card border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Automation Rules
          </h2>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition">
            <Plus className="h-4 w-4" />
            Add Rule
          </button>
        </div>
        <div className="space-y-3">
          {emailRules.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No automation rules configured yet
            </p>
          ) : (
            emailRules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
              >
                <div>
                  <p className="font-medium">{rule.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {rule.trigger} → {rule.action}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className={`w-10 h-5 rounded-full relative transition-colors ${
                      rule.enabled ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${
                        rule.enabled ? "right-0.5" : "left-0.5"
                      }`}
                    />
                  </button>
                  <button className="p-1 hover:bg-muted rounded">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  // Data Controls Tab Component
  const DataTab = () => (
    <div className="space-y-6">
      {/* Export Data */}
      <div className="bg-card border rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Your Data
        </h2>
        <p className="text-muted-foreground mb-6">
          Download a copy of your data including projects, conversations, and settings.
        </p>
        <div className="flex flex-wrap gap-3">
          {[
            { format: "json" as const, label: "JSON", icon: FileText },
            { format: "csv" as const, label: "CSV", icon: Table },
            { format: "zip" as const, label: "Full Archive (ZIP)", icon: Archive },
          ].map((option) => (
            <button
              key={option.format}
              onClick={() => handleExportData(option.format)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-3 border rounded-xl hover:bg-muted transition disabled:opacity-50"
            >
              <option.icon className="h-4 w-4" />
              Export as {option.label}
            </button>
          ))}
        </div>

        {/* Export History */}
        {dataExports.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-medium mb-4">Recent Exports</h3>
            <div className="space-y-2">
              {dataExports.slice(0, 5).map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{exp.format.toUpperCase()} Export</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(exp.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {exp.url && exp.status === "completed" && (
                    <a
                      href={exp.url}
                      className="text-primary hover:underline text-sm flex items-center gap-1"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Data Retention */}
      <div className="bg-card border rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Data Retention
        </h2>
        <p className="text-muted-foreground mb-6">
          Configure how long your data is stored before automatic deletion.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Chat History</label>
            <select
              value={retentionSettings.chatHistory}
              onChange={(e) =>
                setRetentionSettings({
                  ...retentionSettings,
                  chatHistory: parseInt(e.target.value),
                })
              }
              className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={180}>180 days</option>
              <option value={365}>1 year</option>
              <option value={-1}>Forever</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Project Files</label>
            <select
              value={retentionSettings.projectFiles}
              onChange={(e) =>
                setRetentionSettings({
                  ...retentionSettings,
                  projectFiles: parseInt(e.target.value),
                })
              }
              className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value={90}>90 days</option>
              <option value={180}>180 days</option>
              <option value={365}>1 year</option>
              <option value={730}>2 years</option>
              <option value={-1}>Forever</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Audit Logs</label>
            <select
              value={retentionSettings.auditLogs}
              onChange={(e) =>
                setRetentionSettings({
                  ...retentionSettings,
                  auditLogs: parseInt(e.target.value),
                })
              }
              className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={180}>180 days</option>
              <option value={365}>1 year</option>
            </select>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">Auto-delete Expired Data</p>
              <p className="text-sm text-muted-foreground">
                Automatically remove data past retention period
              </p>
            </div>
            <button
              onClick={() =>
                setRetentionSettings({
                  ...retentionSettings,
                  autoDelete: !retentionSettings.autoDelete,
                })
              }
              className={`w-12 h-6 rounded-full relative transition-colors ${
                retentionSettings.autoDelete ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                  retentionSettings.autoDelete ? "right-1" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>
        <button
          onClick={handleSaveRetention}
          disabled={loading}
          className="mt-6 flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 transition"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Retention Settings
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Danger Zone
        </h2>
        <p className="text-red-600 dark:text-red-400/80 mb-6">
          These actions are irreversible. Please be certain before proceeding.
        </p>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white dark:bg-red-950/50 rounded-xl">
            <div>
              <p className="font-medium text-red-700 dark:text-red-400">Delete All Projects</p>
              <p className="text-sm text-red-600/70 dark:text-red-400/70">
                Permanently delete all your projects and files
              </p>
            </div>
            <button className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition">
              Delete Projects
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-white dark:bg-red-950/50 rounded-xl">
            <div>
              <p className="font-medium text-red-700 dark:text-red-400">Delete Account</p>
              <p className="text-sm text-red-600/70 dark:text-red-400/70">
                Permanently delete your account and all associated data
              </p>
            </div>
            <button
              onClick={handleRequestDeletion}
              className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Cloud Browser Tab Component
  const BrowserTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Cloud Browser Sessions</h2>
          <p className="text-sm text-muted-foreground">
            Manage your cloud browser instances for web automation
          </p>
        </div>
        <button
          onClick={handleCreateBrowserSession}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 transition"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          New Session
        </button>
      </div>

      {/* Active Sessions */}
      <div className="bg-card border rounded-2xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Chrome className="h-5 w-5" />
          Active Sessions
        </h3>
        <div className="space-y-4">
          {browserSessions.length === 0 ? (
            <div className="text-center py-12">
              <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No active browser sessions</p>
              <button
                onClick={handleCreateBrowserSession}
                disabled={loading}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition"
              >
                Start New Session
              </button>
            </div>
          ) : (
            browserSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      session.status === "active" ? "bg-green-500" : "bg-yellow-500"
                    }`}
                  />
                  <div>
                    <p className="font-medium">Session {session.id}</p>
                    <p className="text-sm text-muted-foreground">
                      {session.resolution} • {session.currentUrl || "No URL"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-muted rounded-lg transition" title="Open">
                    <ExternalLink className="h-4 w-4" />
                  </button>
                  <button className="p-2 hover:bg-muted rounded-lg transition" title="Screenshot">
                    <Camera className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteBrowserSession(parseInt(session.id))}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Browser Profiles */}
      <div className="bg-card border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Browser Profiles
          </h3>
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-muted transition">
            <Plus className="h-4 w-4" />
            New Profile
          </button>
        </div>
        <div className="space-y-3">
          {browserProfiles.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No browser profiles created yet
            </p>
          ) : (
            browserProfiles.map((profile) => (
              <div
                key={profile.id}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
              >
                <div>
                  <p className="font-medium">{profile.name}</p>
                  <p className="text-sm text-muted-foreground">{profile.userAgent}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-muted rounded-lg">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded-lg">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Usage Stats */}
      <div className="bg-card border rounded-2xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Browser Usage
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-xl">
            <p className="text-2xl font-bold">{browserSessions.length}</p>
            <p className="text-sm text-muted-foreground">Active Sessions</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-xl">
            <p className="text-2xl font-bold">{browserProfiles.length}</p>
            <p className="text-sm text-muted-foreground">Profiles</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-xl">
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-muted-foreground">Hours Used</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Connectors Tab Component
  const ConnectorsTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Data Connectors</h2>
          <p className="text-sm text-muted-foreground">
            Connect external data sources and services
          </p>
        </div>
        <button
          onClick={() => setShowAddConnector(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition"
        >
          <Plus className="h-4 w-4" />
          Add Connector
        </button>
      </div>

      {/* Available Connectors */}
      <div className="bg-card border rounded-2xl p-6">
        <h3 className="font-semibold mb-4">Available Connectors</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { id: "github", name: "GitHub", icon: Github, description: "Code repositories" },
            { id: "gitlab", name: "GitLab", icon: Gitlab, description: "Code repositories" },
            { id: "slack", name: "Slack", icon: Slack, description: "Team messaging" },
            { id: "notion", name: "Notion", icon: FileText, description: "Documentation" },
            { id: "google-drive", name: "Google Drive", icon: Cloud, description: "File storage" },
            { id: "dropbox", name: "Dropbox", icon: Box, description: "File storage" },
            { id: "aws", name: "AWS", icon: Server, description: "Cloud infrastructure" },
            { id: "azure", name: "Azure", icon: Cloud, description: "Cloud infrastructure" },
            { id: "gcp", name: "Google Cloud", icon: Cloud, description: "Cloud infrastructure" },
          ].map((connector) => {
            const isConnected = connectorsList.some(
              (c) => c.provider === connector.id && c.status === "connected"
            );
            return (
              <div
                key={connector.id}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-background rounded-lg">
                    <connector.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{connector.name}</p>
                    <p className="text-xs text-muted-foreground">{connector.description}</p>
                  </div>
                </div>
                {isConnected ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <button
                      onClick={() => handleDisconnectConnector(connector.id)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleConnectConnector(connector.id)}
                    className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
                  >
                    Connect
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Connected Connectors */}
      {connectorsList.length > 0 && (
        <div className="bg-card border rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Connected</h3>
          <div className="space-y-3">
            {connectorsList.map((connector) => (
              <div
                key={connector.id}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      connector.status === "connected" ? "bg-green-500" : "bg-yellow-500"
                    }`}
                  />
                  <div>
                    <p className="font-medium">{connector.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {connector.provider} •{" "}
                      {connector.lastSyncAt
                        ? `Last sync: ${new Date(connector.lastSyncAt).toLocaleString()}`
                        : "Never synced"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSyncConnector(connector.id)}
                    className="p-2 hover:bg-muted rounded-lg transition"
                    title="Sync"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                  <button className="p-2 hover:bg-muted rounded-lg transition" title="Settings">
                    <SettingsIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDisconnectConnector(connector.id)}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded-lg transition"
                    title="Disconnect"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Integrations Tab Component
  const IntegrationsTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">Integrations</h2>
        <p className="text-sm text-muted-foreground">
          Extend ADELE with third-party applications and services
        </p>
      </div>

      {/* Installed Integrations */}
      {installedIntegrations.length > 0 && (
        <div className="bg-card border rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Installed</h3>
          <div className="space-y-3">
            {installedIntegrations.map((integration) => (
              <div
                key={integration.id}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold">
                    {integration.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{integration.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Installed {new Date(integration.installedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      handleToggleIntegration(integration.id, integration.status !== "active")
                    }
                    className={`w-12 h-6 rounded-full relative transition-colors ${
                      integration.status === "active" ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                        integration.status === "active" ? "right-1" : "left-1"
                      }`}
                    />
                  </button>
                  <button className="p-2 hover:bg-muted rounded-lg transition">
                    <SettingsIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleUninstallIntegration(integration.id)}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded-lg transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Integrations */}
      <div className="bg-card border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold">Available Integrations</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search integrations..."
                className="pl-10 pr-4 py-2 border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(availableIntegrations.length > 0
            ? availableIntegrations
            : [
                {
                  id: "openai",
                  name: "OpenAI",
                  description: "GPT models for AI assistance",
                  category: "AI",
                  icon: "🤖",
                  features: ["Chat completion", "Code generation", "Embeddings"],
                  popular: true,
                },
                {
                  id: "anthropic",
                  name: "Anthropic Claude",
                  description: "Advanced AI assistant",
                  category: "AI",
                  icon: "🧠",
                  features: ["Long context", "Analysis", "Writing"],
                  popular: true,
                },
                {
                  id: "stripe",
                  name: "Stripe",
                  description: "Payment processing",
                  category: "Payments",
                  icon: "💳",
                  features: ["Subscriptions", "Invoicing", "Checkout"],
                },
                {
                  id: "twilio",
                  name: "Twilio",
                  description: "Communication APIs",
                  category: "Communication",
                  icon: "📱",
                  features: ["SMS", "Voice", "Video"],
                },
                {
                  id: "sendgrid",
                  name: "SendGrid",
                  description: "Email delivery",
                  category: "Communication",
                  icon: "📧",
                  features: ["Transactional", "Marketing", "Analytics"],
                },
                {
                  id: "vercel",
                  name: "Vercel",
                  description: "Deployment platform",
                  category: "DevOps",
                  icon: "▲",
                  features: ["Deploy", "Preview", "Analytics"],
                },
                {
                  id: "supabase",
                  name: "Supabase",
                  description: "Backend as a service",
                  category: "Database",
                  icon: "⚡",
                  features: ["Database", "Auth", "Storage"],
                },
                {
                  id: "zapier",
                  name: "Zapier",
                  description: "Workflow automation",
                  category: "Automation",
                  icon: "⚡",
                  features: ["Triggers", "Actions", "Workflows"],
                },
              ]
          ).map((integration) => {
            const isInstalled = installedIntegrations.some(
              (i) => i.integrationId === integration.id
            );
            return (
              <div
                key={integration.id}
                className="p-4 border rounded-xl hover:border-primary/50 transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl">
                      {integration.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{integration.name}</p>
                        {integration.popular && (
                          <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{integration.category}</p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{integration.description}</p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {integration.features.map((feature, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 text-xs bg-muted rounded"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
                {isInstalled ? (
                  <button
                    disabled
                    className="w-full py-2 text-sm bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg"
                  >
                    <CheckCircle className="h-4 w-4 inline mr-2" />
                    Installed
                  </button>
                ) : (
                  <button
                    onClick={() => handleInstallIntegration(integration.id)}
                    className="w-full py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
                  >
                    Install
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-muted rounded-lg transition">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold">Settings</h1>
              <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div
            className={`${
              sidebarCollapsed ? "lg:w-16" : "lg:w-72"
            } flex-shrink-0 transition-all duration-300`}
          >
            <div className="sticky top-24">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:flex items-center justify-center w-full p-2 mb-4 hover:bg-muted rounded-lg transition"
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="h-5 w-5" />
                ) : (
                  <ArrowLeft className="h-5 w-5" />
                )}
              </button>
              <nav className="space-y-1">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition ${
                      activeTab === tab.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                    title={sidebarCollapsed ? tab.label : undefined}
                  >
                    <tab.icon className="h-5 w-5 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <div className="min-w-0">
                        <p className="font-medium truncate">{tab.label}</p>
                        <p
                          className={`text-xs truncate ${
                            activeTab === tab.id
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {tab.description}
                        </p>
                      </div>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 max-w-4xl">
            {loading && activeTab !== "account" && activeTab !== "settings" ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              renderTabContent()
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
