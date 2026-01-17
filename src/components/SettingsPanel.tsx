import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';

import {
  X,
  User,
  Settings as SettingsIcon,
  Sparkles,
  CreditCard,
  Calendar,
  Mail,
  Database,
  Globe,
  Link2,
  Zap,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  Sun,
  Moon,
  Monitor,
  Shield,
  Key,
  Trash2,
  Download,
  LogOut,
  Plus,
  Play,
  Pause,
  Edit2,
  Clock,
  Check,
  AlertTriangle,
  RefreshCw,
  Search,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Upload,
  FileText,
  Archive,
  BarChart3,
  TrendingUp,
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  Server,
  Terminal,
  Chrome,
  Smartphone,
  Laptop,
  MoreVertical,
  Save,
} from 'lucide-react';
import {
  users,
  auth,
  scheduledWorks,
  dataControls,
  connectors,
  integrations,
  usage as usageApi,
  billing as billingApi,
  ScheduledWork,
  Connector,
  Integration,
  InstalledIntegration,
} from '@/lib/api';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: { id?: number; name: string; email: string; company?: string; position?: string; phone?: string } | null;
  onLogout: () => void;
}

// Toggle Switch Component
const Toggle = ({ enabled, onChange, disabled = false }: { enabled: boolean; onChange: (v: boolean) => void; disabled?: boolean }) => (
  <button
    onClick={() => !disabled && onChange(!enabled)}
    disabled={disabled}
    className={`w-12 h-7 rounded-full transition-colors relative ${
      enabled ? 'bg-blue-500' : 'bg-zinc-600'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${
      enabled ? 'translate-x-6' : 'translate-x-1'
    }`} />
  </button>
);

// Progress Bar Component
const ProgressBar = ({ value, max, color = 'blue' }: { value: number; max: number; color?: string }) => {
  const percentage = Math.min((value / max) * 100, 100);
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
  };
  return (
    <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
      <div 
        className={`h-full ${colorClasses[color] || 'bg-blue-500'} rounded-full transition-all`} 
        style={{ width: `${percentage}%` }} 
      />
    </div>
  );
};

export default function SettingsPanel({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  user,
  onLogout
}: SettingsPanelProps) {
  // Settings state - load from localStorage
  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('adele-language') || 'English';
    }
    return 'English';
  });
  const [appearance, setAppearance] = useState<'light' | 'dark' | 'system'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('adele-theme') as 'light' | 'dark' | 'system') || 'dark';
    }
    return 'dark';
  });
  const [receiveContent, setReceiveContent] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('adele-receive-content') !== 'false';
    }
    return true;
  });
  const [emailOnTask, setEmailOnTask] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('adele-email-on-task') !== 'false';
    }
    return true;
  });
  
  // Account state
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profileCompany, setProfileCompany] = useState(user?.company || '');
  const [profilePosition, setProfilePosition] = useState(user?.position || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  
  // Usage state
  const [usageData, setUsageData] = useState<any>(null);
  const [usagePeriod, setUsagePeriod] = useState<'7d' | '30d' | '90d'>('30d');
  
  // Billing state
  const [billingData, setBillingData] = useState<any>(null);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  
  // Scheduled Tasks state
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledWork[]>([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [taskPrompt, setTaskPrompt] = useState('');
  const [taskSchedule, setTaskSchedule] = useState('daily');
  const [taskTime, setTaskTime] = useState('09:00');
  
  // Mail ADELE state
  const [mailAgentEnabled, setMailAgentEnabled] = useState(false);
  const [autoReply, setAutoReply] = useState(false);
  const [summarizeEmails, setSummarizeEmails] = useState(true);
  const [autoCategorize, setAutoCategorize] = useState(true);
  const [priorityDetection, setPriorityDetection] = useState(true);
  const [connectedEmails, setConnectedEmails] = useState<string[]>([]);
  
  // Data Controls state
  const [chatRetention, setChatRetention] = useState('forever');
  const [projectRetention, setProjectRetention] = useState('forever');
  const [auditRetention, setAuditRetention] = useState('1year');
  const [autoDelete, setAutoDelete] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Cloud Browser state
  const [browserEnabled, setBrowserEnabled] = useState(true);
  const [browserSessions, setBrowserSessions] = useState<any[]>([]);
  const [browserProfiles, setBrowserProfiles] = useState<any[]>([]);
  
  // Connectors state
  const [connectorsList, setConnectorsList] = useState<Connector[]>([]);
  const [connectorsLoading, setConnectorsLoading] = useState(false);
  
  // Integrations state
  const [integrationsList, setIntegrationsList] = useState<Integration[]>([]);
  const [installedIntegrations, setInstalledIntegrations] = useState<InstalledIntegration[]>([]);
  const [integrationsSearch, setIntegrationsSearch] = useState('');
  const [integrationsLoading, setIntegrationsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Load data based on active tab
  useEffect(() => {
    if (!isOpen) return;
    
    const loadData = async () => {
      try {
        switch (activeTab) {
          case 'usage':
            const usageRes = await usageApi.getSummary();
            setUsageData(usageRes.usage);
            break;
          case 'billing':
            const [subRes, invoicesRes, methodsRes] = await Promise.all([
              billingApi.getSubscription(),
              billingApi.getInvoices(),
              billingApi.getPaymentMethods()
            ]);
            setBillingData({
              subscription: subRes.subscription,
              invoices: invoicesRes.invoices,
              paymentMethods: methodsRes.paymentMethods
            });
            break;
          case 'scheduled':
            const tasksRes = await scheduledWorks.list();
            setScheduledTasks(tasksRes.works || []);
            break;
          case 'connectors':
            setConnectorsLoading(true);
            const connectorsRes = await connectors.list();
            setConnectorsList(connectorsRes.connectors || []);
            setConnectorsLoading(false);
            break;
          case 'integrations':
            setIntegrationsLoading(true);
            const [availableRes, installedRes] = await Promise.all([
              integrations.getAvailable(),
              integrations.getInstalled()
            ]);
            setIntegrationsList(availableRes.integrations || []);
            setInstalledIntegrations(installedRes.integrations || []);
            setIntegrationsLoading(false);
            break;
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    
    loadData();
  }, [activeTab, isOpen]);

  // Update profile state when user changes
  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileEmail(user.email || '');
      setProfileCompany(user.company || '');
      setProfilePosition(user.position || '');
      setProfilePhone(user.phone || '');
    }
  }, [user]);

  // Track if this is the initial mount
  const [isInitialMount, setIsInitialMount] = useState(true);

  // Apply theme when appearance changes
  useEffect(() => {
    const applyTheme = (theme: 'light' | 'dark' | 'system') => {
      const root = document.documentElement;
      
      let effectiveTheme: 'light' | 'dark' = theme === 'system' 
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme;
      
      // Remove both classes first
      root.classList.remove('dark', 'light');
      
      // Add the appropriate class
      if (effectiveTheme === 'dark') {
        root.classList.add('dark');
      }
      // For light mode, we don't add any class - Tailwind uses :root styles
      
      // Save to localStorage
      localStorage.setItem('adele-theme', theme);
    };
    
    applyTheme(appearance);
    
    // Only show toast after initial mount
    if (!isInitialMount) {
      toast.success(`Theme changed to ${appearance}`);
    } else {
      setIsInitialMount(false);
    }
  }, [appearance]);

  // Save language preference
  useEffect(() => {
    localStorage.setItem('adele-language', language);
  }, [language]);

  // Save notification preferences
  useEffect(() => {
    localStorage.setItem('adele-receive-content', String(receiveContent));
  }, [receiveContent]);

  useEffect(() => {
    localStorage.setItem('adele-email-on-task', String(emailOnTask));
  }, [emailOnTask]);

  if (!isOpen) return null;

  const menuItems = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
    { id: 'usage', label: 'Usage', icon: Sparkles },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'scheduled', label: 'Scheduled tasks', icon: Calendar },
    { id: 'mail', label: 'Mail ADELE', icon: Mail },
    { id: 'data', label: 'Data controls', icon: Database },
    { id: 'browser', label: 'Cloud browser', icon: Globe },
    { id: 'connectors', label: 'Connectors', icon: Link2 },
    { id: 'integrations', label: 'Integrations', icon: Zap },
  ];

  // Handlers
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await users.update({
        name: profileName,
      });
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    try {
      await auth.changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
    }
  };

  const handleExportData = async (format: 'json' | 'csv' | 'zip') => {
    setExporting(true);
    try {
      const result = await dataControls.export(format);
      // Open the download URL in a new tab
      if (result.url) {
        window.open(result.url, '_blank');
        toast.success(`Data export started. Download will begin shortly.`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleCreateTask = async () => {
    if (!taskName.trim() || !taskPrompt.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    try {
      await scheduledWorks.create({
        name: taskName,
        prompt: taskPrompt,
        scheduleType: taskSchedule as any,
        schedule: taskTime,
        taskType: 'prompt',
        taskConfig: {},
        status: 'active',
      });
      toast.success('Scheduled task created');
      setShowTaskModal(false);
      setTaskName('');
      setTaskPrompt('');
      // Refresh tasks
      const tasksRes = await scheduledWorks.list();
      setScheduledTasks(tasksRes.works || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create task');
    }
  };

  const handleToggleTask = async (taskId: number, enabled: boolean) => {
    try {
      if (enabled) {
        await scheduledWorks.resume(taskId);
      } else {
        await scheduledWorks.pause(taskId);
      }
      setScheduledTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, status: enabled ? 'active' : 'paused' } : t
      ));
      toast.success(enabled ? 'Task enabled' : 'Task disabled');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await scheduledWorks.delete(taskId);
      setScheduledTasks(prev => prev.filter(t => t.id !== taskId));
      toast.success('Task deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete task');
    }
  };

  const handleConnectConnector = async (connectorType: string) => {
    try {
      // In production, this would open OAuth flow
      toast.info(`Connecting to ${connectorType}...`);
      const result = await connectors.getOAuthUrl(connectorType);
      if (result.url) {
        window.open(result.url, '_blank');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to connect');
    }
  };

  const handleDisconnectConnector = async (connectorId: number) => {
    try {
      await connectors.disconnect(connectorId);
      setConnectorsList(prev => prev.filter(c => c.id !== connectorId));
      toast.success('Disconnected successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to disconnect');
    }
  };

  const handleInstallIntegration = async (integrationId: string) => {
    try {
      const result = await integrations.install(integrationId);
      setInstalledIntegrations(prev => [...prev, result.installation]);
      toast.success('Integration installed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to install integration');
    }
  };

  const handleUninstallIntegration = async (installationId: number) => {
    try {
      await integrations.uninstall(installationId);
      setInstalledIntegrations(prev => prev.filter(i => i.id !== installationId));
      toast.success('Integration uninstalled');
    } catch (error: any) {
      toast.error(error.message || 'Failed to uninstall integration');
    }
  };

  // Available connectors data
  const availableConnectors = [
    { id: 'github', name: 'GitHub', icon: '🐙', description: 'Code repositories', category: 'development' },
    { id: 'gitlab', name: 'GitLab', icon: '🦊', description: 'Code repositories', category: 'development' },
    { id: 'slack', name: 'Slack', icon: '💬', description: 'Team messaging', category: 'communication' },
    { id: 'notion', name: 'Notion', icon: '📝', description: 'Documentation', category: 'productivity' },
    { id: 'google-drive', name: 'Google Drive', icon: '📁', description: 'File storage', category: 'storage' },
    { id: 'dropbox', name: 'Dropbox', icon: '📦', description: 'File storage', category: 'storage' },
    { id: 'aws', name: 'AWS', icon: '☁️', description: 'Cloud infrastructure', category: 'cloud' },
    { id: 'azure', name: 'Azure', icon: '🔷', description: 'Cloud infrastructure', category: 'cloud' },
    { id: 'gcp', name: 'Google Cloud', icon: '🌐', description: 'Cloud infrastructure', category: 'cloud' },
    { id: 'jira', name: 'Jira', icon: '📋', description: 'Project management', category: 'productivity' },
    { id: 'linear', name: 'Linear', icon: '📐', description: 'Issue tracking', category: 'productivity' },
    { id: 'figma', name: 'Figma', icon: '🎨', description: 'Design tool', category: 'design' },
  ];

  // Available integrations data
  const availableIntegrations = [
    { id: 'openai', name: 'OpenAI', icon: '🤖', description: 'GPT models and embeddings', category: 'ai', popular: true },
    { id: 'anthropic', name: 'Anthropic Claude', icon: '🧠', description: 'Claude AI models', category: 'ai', popular: true },
    { id: 'vercel', name: 'Vercel', icon: '▲', description: 'Deploy frontend apps', category: 'deployment', popular: true },
    { id: 'netlify', name: 'Netlify', icon: '🌐', description: 'Web hosting', category: 'deployment' },
    { id: 'stripe', name: 'Stripe', icon: '💳', description: 'Payment processing', category: 'payments', popular: true },
    { id: 'twilio', name: 'Twilio', icon: '📱', description: 'SMS and voice', category: 'communication' },
    { id: 'sendgrid', name: 'SendGrid', icon: '📧', description: 'Email delivery', category: 'communication' },
    { id: 'sentry', name: 'Sentry', icon: '🐛', description: 'Error tracking', category: 'monitoring' },
    { id: 'datadog', name: 'Datadog', icon: '📊', description: 'Monitoring', category: 'monitoring' },
    { id: 'mixpanel', name: 'Mixpanel', icon: '📈', description: 'Product analytics', category: 'analytics' },
    { id: 'segment', name: 'Segment', icon: '🔀', description: 'Customer data', category: 'analytics' },
    { id: 'hubspot', name: 'HubSpot', icon: '🧲', description: 'CRM', category: 'crm' },
    { id: 'salesforce', name: 'Salesforce', icon: '☁️', description: 'CRM', category: 'crm' },
    { id: 'zapier', name: 'Zapier', icon: '⚡', description: 'Automation', category: 'automation', popular: true },
    { id: 'make', name: 'Make', icon: '🔧', description: 'Workflow automation', category: 'automation' },
    { id: 'supabase', name: 'Supabase', icon: '⚡', description: 'Backend as a service', category: 'database' },
    { id: 'planetscale', name: 'PlanetScale', icon: '🌍', description: 'MySQL database', category: 'database' },
    { id: 'redis', name: 'Redis', icon: '🔴', description: 'In-memory database', category: 'database' },
  ];

  const integrationCategories = [
    { id: 'all', label: 'All' },
    { id: 'ai', label: 'AI & ML' },
    { id: 'deployment', label: 'Deployment' },
    { id: 'communication', label: 'Communication' },
    { id: 'monitoring', label: 'Monitoring' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'database', label: 'Database' },
    { id: 'automation', label: 'Automation' },
  ];

  const filteredIntegrations = availableIntegrations.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(integrationsSearch.toLowerCase()) ||
                         i.description.toLowerCase().includes(integrationsSearch.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || i.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const isIntegrationInstalled = (integrationId: string) => {
    return installedIntegrations.some(i => i.integrationId === integrationId);
  };

  const getInstallationId = (integrationId: string) => {
    return installedIntegrations.find(i => i.integrationId === integrationId)?.id;
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'account':
        return (
          <div className="space-y-6">
            {/* Profile Section */}
            <div>
              <h3 className="text-sm text-zinc-400 mb-4">Profile</h3>
              <div className="p-4 bg-zinc-800/50 rounded-xl space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-semibold text-white">
                    {profileName?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1">
                    <button className="px-4 py-2 bg-zinc-700 rounded-lg text-sm hover:bg-zinc-600 transition-colors">
                      Change avatar
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Email</label>
                    <input
                      type="email"
                      value={profileEmail}
                      disabled
                      className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg opacity-50 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Company</label>
                    <input
                      type="text"
                      value={profileCompany}
                      onChange={(e) => setProfileCompany(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Your company"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Position</label>
                    <input
                      type="text"
                      value={profilePosition}
                      onChange={(e) => setProfilePosition(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Your position"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm text-zinc-400 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                </div>
                
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {savingProfile ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </div>

            {/* Security Section */}
            <div>
              <h3 className="text-sm text-zinc-400 mb-4">Security</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Key className="w-5 h-5 text-zinc-400" />
                    <span>Change password</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500" />
                </button>
                <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-zinc-400" />
                    <div>
                      <span>Two-factor authentication</span>
                      <p className="text-sm text-zinc-500">Add an extra layer of security</p>
                    </div>
                  </div>
                  <Toggle enabled={twoFactorEnabled} onChange={setTwoFactorEnabled} />
                </div>
              </div>
            </div>

            {/* Sessions Section */}
            <div>
              <h3 className="text-sm text-zinc-400 mb-4">Active Sessions</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Laptop className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="font-medium">Current session</p>
                      <p className="text-sm text-zinc-500">Chrome on macOS • Last active now</p>
                    </div>
                  </div>
                  <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">Active</span>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div>
              <h3 className="text-sm text-zinc-400 mb-4">Danger Zone</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => handleExportData('zip')}
                  className="w-full flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl hover:bg-red-900/20 transition-colors text-red-400"
                >
                  <div className="flex items-center gap-3">
                    <Download className="w-5 h-5" />
                    <span>Export all data</span>
                  </div>
                </button>
                <button className="w-full flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl hover:bg-red-900/20 transition-colors text-red-400">
                  <div className="flex items-center gap-3">
                    <Trash2 className="w-5 h-5" />
                    <span>Delete account</span>
                  </div>
                </button>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 p-4 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-colors text-zinc-300"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign out</span>
            </button>

            {/* Password Change Modal */}
            {showPasswordModal && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
                <div className="bg-zinc-900 rounded-xl p-6 w-full max-w-md">
                  <h3 className="text-lg font-semibold mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Current Password</label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full px-4 py-2 pr-10 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                        >
                          {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">New Password</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-2 pr-10 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => setShowPasswordModal(false)}
                      className="px-4 py-2 bg-zinc-700 rounded-lg hover:bg-zinc-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleChangePassword}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Change Password
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-sm text-zinc-400 mb-4">General</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Language</label>
                  <div className="relative">
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full md:w-64 appearance-none bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option>English</option>
                      <option>日本語</option>
                      <option>中文</option>
                      <option>Español</option>
                      <option>Français</option>
                      <option>Deutsch</option>
                      <option>한국어</option>
                      <option>Português</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm text-zinc-400 mb-4">Appearance</h3>
              <div className="flex gap-4">
                {[
                  { id: 'light', label: 'Light', icon: Sun },
                  { id: 'dark', label: 'Dark', icon: Moon },
                  { id: 'system', label: 'Follow System', icon: Monitor },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setAppearance(option.id as 'light' | 'dark' | 'system')}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                      appearance === option.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                    }`}
                  >
                    <div className={`w-full h-16 rounded-lg mb-3 flex items-center justify-center ${
                      option.id === 'light' ? 'bg-white' :
                      option.id === 'dark' ? 'bg-zinc-900' :
                      'bg-gradient-to-r from-white to-zinc-900'
                    }`}>
                      <div className={`space-y-1 ${option.id === 'light' ? 'text-zinc-800' : 'text-zinc-300'}`}>
                        <div className="w-8 h-1 bg-current rounded" />
                        <div className="w-6 h-1 bg-current rounded opacity-60" />
                      </div>
                    </div>
                    <span className="text-sm">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-6">
              <h3 className="text-sm text-zinc-400 mb-4">Personalization</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
                  <div>
                    <p className="font-medium">Receive exclusive content</p>
                    <p className="text-sm text-zinc-400">Get exclusive offers, event updates, excellent case examples and new feature guides.</p>
                  </div>
                  <Toggle enabled={receiveContent} onChange={setReceiveContent} />
                </div>

                <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
                  <div>
                    <p className="font-medium">Email me when my queued task starts</p>
                    <p className="text-sm text-zinc-400">When enabled, we'll send you a timely email once your task finishes queuing and begins processing.</p>
                  </div>
                  <Toggle enabled={emailOnTask} onChange={setEmailOnTask} />
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-6">
              <button className="flex items-center justify-between w-full p-4 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-colors">
                <span>Manage Cookies</span>
                <span className="px-4 py-2 bg-zinc-700 rounded-lg text-sm">Manage</span>
              </button>
            </div>
          </div>
        );

      case 'usage':
        return (
          <div className="space-y-6">
            {/* Current Plan */}
            <div className="p-6 bg-zinc-800/50 rounded-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium">Current Plan</h3>
                  <p className="text-zinc-400">{usageData?.plan || 'Free'}</p>
                </div>
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  Upgrade
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-zinc-900 rounded-lg">
                  <div className="flex items-center gap-2 text-zinc-400 mb-2">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm">Tasks</span>
                  </div>
                  <p className="text-2xl font-bold">{usageData?.tasks?.used || 0}</p>
                  <p className="text-sm text-zinc-500">of {usageData?.tasks?.limit || 10} limit</p>
                  <ProgressBar value={usageData?.tasks?.used || 0} max={usageData?.tasks?.limit || 10} color="blue" />
                </div>
                <div className="p-4 bg-zinc-900 rounded-lg">
                  <div className="flex items-center gap-2 text-zinc-400 mb-2">
                    <Activity className="w-4 h-4" />
                    <span className="text-sm">API Calls</span>
                  </div>
                  <p className="text-2xl font-bold">{usageData?.apiCalls?.used || 0}</p>
                  <p className="text-sm text-zinc-500">of {usageData?.apiCalls?.limit || 1000} limit</p>
                  <ProgressBar value={usageData?.apiCalls?.used || 0} max={usageData?.apiCalls?.limit || 1000} color="green" />
                </div>
                <div className="p-4 bg-zinc-900 rounded-lg">
                  <div className="flex items-center gap-2 text-zinc-400 mb-2">
                    <HardDrive className="w-4 h-4" />
                    <span className="text-sm">Storage</span>
                  </div>
                  <p className="text-2xl font-bold">{usageData?.storage?.used || '0 MB'}</p>
                  <p className="text-sm text-zinc-500">of {usageData?.storage?.limit || '1 GB'}</p>
                  <ProgressBar value={parseFloat(usageData?.storage?.used || '0')} max={parseFloat(usageData?.storage?.limit || '1000')} color="purple" />
                </div>
                <div className="p-4 bg-zinc-900 rounded-lg">
                  <div className="flex items-center gap-2 text-zinc-400 mb-2">
                    <Cpu className="w-4 h-4" />
                    <span className="text-sm">Tokens</span>
                  </div>
                  <p className="text-2xl font-bold">{usageData?.tokens?.used || '0'}</p>
                  <p className="text-sm text-zinc-500">of {usageData?.tokens?.limit || '100K'}</p>
                  <ProgressBar value={usageData?.tokens?.used || 0} max={usageData?.tokens?.limit || 100000} color="yellow" />
                </div>
              </div>
            </div>

            {/* Usage History */}
            <div className="p-6 bg-zinc-800/50 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Usage History</h3>
                <div className="flex gap-2">
                  {(['7d', '30d', '90d'] as const).map((period) => (
                    <button
                      key={period}
                      onClick={() => setUsagePeriod(period)}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        usagePeriod === period ? 'bg-blue-500 text-white' : 'bg-zinc-700 hover:bg-zinc-600'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-3">
                {[
                  { date: 'Today', tasks: 2, tokens: '12.5K' },
                  { date: 'Yesterday', tasks: 5, tokens: '45.2K' },
                  { date: 'Jan 11', tasks: 3, tokens: '28.1K' },
                  { date: 'Jan 10', tasks: 8, tokens: '67.3K' },
                  { date: 'Jan 9', tasks: 4, tokens: '32.8K' },
                ].map((day, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-zinc-700 last:border-0">
                    <span className="text-zinc-400">{day.date}</span>
                    <div className="flex gap-6">
                      <span>{day.tasks} tasks</span>
                      <span className="text-zinc-400">{day.tokens} tokens</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'billing':
        return (
          <div className="space-y-6">
            {/* Current Plan */}
            <div className="p-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Current Plan</p>
                  <h3 className="text-2xl font-bold">{billingData?.plan || 'Free'}</h3>
                  <p className="text-zinc-400 mt-1">
                    {billingData?.renewalDate ? `Renews on ${new Date(billingData.renewalDate).toLocaleDateString()}` : 'No renewal date'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">${billingData?.price || 0}<span className="text-lg text-zinc-400">/mo</span></p>
                  <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                    Change Plan
                  </button>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="p-6 bg-zinc-800/50 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Payment Methods</h3>
                <button 
                  onClick={() => setShowAddCardModal(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Card
                </button>
              </div>
              
              {billingData?.paymentMethods?.length > 0 ? (
                <div className="space-y-3">
                  {billingData.paymentMethods.map((method: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-8 h-8 text-zinc-400" />
                        <div>
                          <p className="font-medium">•••• •••• •••• {method.last4}</p>
                          <p className="text-sm text-zinc-500">Expires {method.expiry}</p>
                        </div>
                      </div>
                      {method.default && (
                        <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">Default</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-zinc-400">
                  <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No payment methods added yet</p>
                </div>
              )}
            </div>

            {/* Billing History */}
            <div className="p-6 bg-zinc-800/50 rounded-xl">
              <h3 className="text-lg font-medium mb-4">Billing History</h3>
              {billingData?.invoices?.length > 0 ? (
                <div className="space-y-2">
                  {billingData.invoices.map((invoice: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg">
                      <div>
                        <p className="font-medium">{invoice.description}</p>
                        <p className="text-sm text-zinc-500">{new Date(invoice.date).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-medium">${invoice.amount}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          invoice.status === 'paid' ? 'text-green-400 bg-green-400/10' : 'text-yellow-400 bg-yellow-400/10'
                        }`}>
                          {invoice.status}
                        </span>
                        <button className="text-zinc-400 hover:text-white">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-400 text-center py-4">No billing history yet</p>
              )}
            </div>

            </div>
        );

      case 'scheduled':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Scheduled Tasks</h3>
                <p className="text-zinc-400 text-sm">Automate recurring tasks and workflows</p>
              </div>
              <button 
                onClick={() => setShowTaskModal(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Task
              </button>
            </div>

            {scheduledTasks.length > 0 ? (
              <div className="space-y-3">
                {scheduledTasks.map((task) => (
                  <div key={task.id} className="p-4 bg-zinc-800/50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          task.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-400'
                        }`}>
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium">{task.name}</p>
                          <p className="text-sm text-zinc-500">{task.scheduleType} at {task.schedule}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Toggle 
                          enabled={task.status === 'active'} 
                          onChange={(v) => handleToggleTask(task.id, v)} 
                        />
                        <button 
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-2 text-zinc-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {task.prompt && (
                      <p className="mt-3 text-sm text-zinc-400 bg-zinc-900 p-3 rounded-lg">{task.prompt}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-zinc-800/50 rounded-xl">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-zinc-500" />
                <p className="text-zinc-400">No scheduled tasks yet</p>
                <p className="text-sm text-zinc-500 mt-1">Create your first automated task to get started</p>
                <button 
                  onClick={() => setShowTaskModal(true)}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Create Task
                </button>
              </div>
            )}

            {/* Create Task Modal */}
            {showTaskModal && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
                <div className="bg-zinc-900 rounded-xl p-6 w-full max-w-lg">
                  <h3 className="text-lg font-semibold mb-4">Create Scheduled Task</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Task Name</label>
                      <input
                        type="text"
                        value={taskName}
                        onChange={(e) => setTaskName(e.target.value)}
                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Daily report generation"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Task Prompt</label>
                      <textarea
                        value={taskPrompt}
                        onChange={(e) => setTaskPrompt(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        placeholder="Generate a summary of all project updates..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-zinc-400 mb-1">Schedule</label>
                        <select
                          value={taskSchedule}
                          onChange={(e) => setTaskSchedule(e.target.value)}
                          className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="hourly">Hourly</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-zinc-400 mb-1">Time</label>
                        <input
                          type="time"
                          value={taskTime}
                          onChange={(e) => setTaskTime(e.target.value)}
                          className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => setShowTaskModal(false)}
                      className="px-4 py-2 bg-zinc-700 rounded-lg hover:bg-zinc-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateTask}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Create Task
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'mail':
        return (
          <div className="space-y-6">
            {/* Email Agent Settings */}
            <div className="p-6 bg-zinc-800/50 rounded-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium">Email Agent</h3>
                  <p className="text-zinc-400 text-sm">AI-powered email assistant for automated responses</p>
                </div>
                <Toggle enabled={mailAgentEnabled} onChange={setMailAgentEnabled} />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg">
                  <div>
                    <p className="font-medium">Auto Reply</p>
                    <p className="text-sm text-zinc-500">Automatically draft replies to incoming emails</p>
                  </div>
                  <Toggle enabled={autoReply} onChange={setAutoReply} disabled={!mailAgentEnabled} />
                </div>
                <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg">
                  <div>
                    <p className="font-medium">Summarize Emails</p>
                    <p className="text-sm text-zinc-500">Generate AI summaries for long emails</p>
                  </div>
                  <Toggle enabled={summarizeEmails} onChange={setSummarizeEmails} disabled={!mailAgentEnabled} />
                </div>
                <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg">
                  <div>
                    <p className="font-medium">Auto Categorize</p>
                    <p className="text-sm text-zinc-500">Automatically sort emails into categories</p>
                  </div>
                  <Toggle enabled={autoCategorize} onChange={setAutoCategorize} disabled={!mailAgentEnabled} />
                </div>
                <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg">
                  <div>
                    <p className="font-medium">Priority Detection</p>
                    <p className="text-sm text-zinc-500">Highlight important emails automatically</p>
                  </div>
                  <Toggle enabled={priorityDetection} onChange={setPriorityDetection} disabled={!mailAgentEnabled} />
                </div>
              </div>
            </div>

            {/* Connected Email Accounts */}
            <div className="p-6 bg-zinc-800/50 rounded-xl">
              <h3 className="text-lg font-medium mb-4">Connected Email Accounts</h3>
              {connectedEmails.length > 0 ? (
                <div className="space-y-3">
                  {connectedEmails.map((email, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-blue-400" />
                        <span>{email}</span>
                      </div>
                      <button className="text-red-400 hover:text-red-300">Disconnect</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Mail className="w-12 h-12 mx-auto mb-3 text-zinc-500" />
                  <p className="text-zinc-400">No email accounts connected</p>
                </div>
              )}
              
              <div className="flex gap-3 mt-4">
                <button className="flex-1 flex items-center justify-center gap-2 p-3 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors">
                  <span className="text-xl">G</span>
                  <span>Connect Gmail</span>
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 p-3 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors">
                  <span className="text-xl">M</span>
                  <span>Connect Outlook</span>
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 p-3 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors">
                  <span className="text-xl">@</span>
                  <span>Connect IMAP</span>
                </button>
              </div>
            </div>

            {/* ADELE Email Address */}
            <div className="p-6 bg-zinc-800/50 rounded-xl">
              <h3 className="text-lg font-medium mb-4">Your ADELE Email</h3>
              <p className="text-zinc-400 mb-4">Send emails to this address to create tasks automatically</p>
              <div className="flex items-center gap-3 p-4 bg-zinc-900 rounded-lg">
                <code className="flex-1 text-blue-400 font-mono">tasks@adele.ayonix.com</code>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText('tasks@adele.ayonix.com');
                    toast.success('Copied to clipboard');
                  }}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );

      case 'data':
        return (
          <div className="space-y-6">
            {/* Export Data */}
            <div className="p-6 bg-zinc-800/50 rounded-xl">
              <h3 className="text-lg font-medium mb-2">Export Your Data</h3>
              <p className="text-zinc-400 mb-4">Download a copy of your data including projects, conversations, and settings.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleExportData('json')}
                  disabled={exporting}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  <FileText className="w-4 h-4" />
                  Export as JSON
                </button>
                <button 
                  onClick={() => handleExportData('csv')}
                  disabled={exporting}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  <FileText className="w-4 h-4" />
                  Export as CSV
                </button>
                <button 
                  onClick={() => handleExportData('zip')}
                  disabled={exporting}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  <Archive className="w-4 h-4" />
                  Full Archive (ZIP)
                </button>
              </div>
            </div>

            {/* Data Retention */}
            <div className="p-6 bg-zinc-800/50 rounded-xl">
              <h3 className="text-lg font-medium mb-2">Data Retention</h3>
              <p className="text-zinc-400 mb-4">Configure how long your data is stored before automatic deletion.</p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg">
                  <div>
                    <p className="font-medium">Chat History</p>
                    <p className="text-sm text-zinc-500">Conversation logs and messages</p>
                  </div>
                  <select 
                    value={chatRetention}
                    onChange={(e) => setChatRetention(e.target.value)}
                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2"
                  >
                    <option value="30days">30 days</option>
                    <option value="90days">90 days</option>
                    <option value="1year">1 year</option>
                    <option value="forever">Forever</option>
                  </select>
                </div>
                <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg">
                  <div>
                    <p className="font-medium">Project Files</p>
                    <p className="text-sm text-zinc-500">Generated code and assets</p>
                  </div>
                  <select 
                    value={projectRetention}
                    onChange={(e) => setProjectRetention(e.target.value)}
                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2"
                  >
                    <option value="90days">90 days</option>
                    <option value="1year">1 year</option>
                    <option value="2years">2 years</option>
                    <option value="forever">Forever</option>
                  </select>
                </div>
                <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg">
                  <div>
                    <p className="font-medium">Audit Logs</p>
                    <p className="text-sm text-zinc-500">Activity and access logs</p>
                  </div>
                  <select 
                    value={auditRetention}
                    onChange={(e) => setAuditRetention(e.target.value)}
                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2"
                  >
                    <option value="30days">30 days</option>
                    <option value="90days">90 days</option>
                    <option value="1year">1 year</option>
                  </select>
                </div>
                <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg">
                  <div>
                    <p className="font-medium">Auto-delete Expired Data</p>
                    <p className="text-sm text-zinc-500">Automatically remove data past retention period</p>
                  </div>
                  <Toggle enabled={autoDelete} onChange={setAutoDelete} />
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="p-6 bg-red-900/20 border border-red-500/30 rounded-xl">
              <h3 className="text-lg font-medium text-red-400 mb-2">Danger Zone</h3>
              <p className="text-zinc-400 mb-4">These actions are irreversible. Please be certain before proceeding.</p>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-4 bg-zinc-900 rounded-lg hover:bg-red-900/30 transition-colors text-red-400">
                  <div className="flex items-center gap-3">
                    <Trash2 className="w-5 h-5" />
                    <div className="text-left">
                      <p className="font-medium">Delete All Projects</p>
                      <p className="text-sm text-zinc-500">Permanently delete all your projects and files</p>
                    </div>
                  </div>
                </button>
                <button className="w-full flex items-center justify-between p-4 bg-zinc-900 rounded-lg hover:bg-red-900/30 transition-colors text-red-400">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5" />
                    <div className="text-left">
                      <p className="font-medium">Delete Account</p>
                      <p className="text-sm text-zinc-500">Permanently delete your account and all data</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        );

      case 'browser':
        return (
          <div className="space-y-6">
            {/* Browser Settings */}
            <div className="p-6 bg-zinc-800/50 rounded-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium">Cloud Browser</h3>
                  <p className="text-zinc-400 text-sm">Manage your cloud browser instances for web automation</p>
                </div>
                <Toggle enabled={browserEnabled} onChange={setBrowserEnabled} />
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-zinc-900 rounded-lg text-center">
                  <p className="text-2xl font-bold">{browserSessions.length}</p>
                  <p className="text-sm text-zinc-500">Active Sessions</p>
                </div>
                <div className="p-4 bg-zinc-900 rounded-lg text-center">
                  <p className="text-2xl font-bold">{browserProfiles.length}</p>
                  <p className="text-sm text-zinc-500">Profiles</p>
                </div>
                <div className="p-4 bg-zinc-900 rounded-lg text-center">
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-zinc-500">Hours Used</p>
                </div>
              </div>
            </div>

            {/* Active Sessions */}
            <div className="p-6 bg-zinc-800/50 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Active Sessions</h3>
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  New Session
                </button>
              </div>
              
              {browserSessions.length > 0 ? (
                <div className="space-y-3">
                  {browserSessions.map((session, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Chrome className="w-5 h-5 text-blue-400" />
                        <div>
                          <p className="font-medium">{session.name}</p>
                          <p className="text-sm text-zinc-500">{session.url}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">Active</span>
                        <button className="p-2 text-zinc-400 hover:text-white">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Globe className="w-12 h-12 mx-auto mb-3 text-zinc-500" />
                  <p className="text-zinc-400">No active browser sessions</p>
                  <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                    Start New Session
                  </button>
                </div>
              )}
            </div>

            {/* Browser Profiles */}
            <div className="p-6 bg-zinc-800/50 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Browser Profiles</h3>
                <button className="px-4 py-2 bg-zinc-700 rounded-lg hover:bg-zinc-600 transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  New Profile
                </button>
              </div>
              
              {browserProfiles.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {browserProfiles.map((profile, i) => (
                    <div key={i} className="p-4 bg-zinc-900 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <User className="w-5 h-5 text-zinc-400" />
                        <p className="font-medium">{profile.name}</p>
                      </div>
                      <p className="text-sm text-zinc-500">{profile.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-400 text-center py-4">No browser profiles created yet</p>
              )}
            </div>
          </div>
        );

      case 'connectors':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Data Connectors</h3>
              <p className="text-zinc-400 text-sm">Connect external data sources and services</p>
            </div>

            {/* Connected Connectors */}
            {connectorsList.length > 0 && (
              <div className="p-6 bg-zinc-800/50 rounded-xl">
                <h4 className="font-medium mb-4">Connected</h4>
                <div className="space-y-3">
                  {connectorsList.map((connector) => (
                    <div key={connector.id} className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                          <Link2 className="w-5 h-5 text-zinc-400" />
                        </div>
                        <div>
                          <p className="font-medium">{connector.name}</p>
                          <p className="text-sm text-zinc-500">{connector.provider}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDisconnectConnector(connector.id)}
                        className="px-3 py-1.5 text-red-400 hover:bg-red-500/20 rounded-lg text-sm transition-colors"
                      >
                        Disconnect
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Connectors */}
            {connectorsLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-zinc-400" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {availableConnectors.map((connector) => (
                  <div key={connector.id} className="p-4 bg-zinc-800/50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{connector.icon}</span>
                        <div>
                          <p className="font-medium">{connector.name}</p>
                          <p className="text-sm text-zinc-500">{connector.description}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleConnectConnector(connector.id)}
                        className="px-3 py-1.5 bg-zinc-700 rounded-lg text-sm hover:bg-zinc-600 transition-colors"
                      >
                        Connect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'integrations':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Integrations</h3>
                <p className="text-zinc-400 text-sm">Extend ADELE with third-party applications</p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search integrations..."
                  value={integrationsSearch}
                  onChange={(e) => setIntegrationsSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="flex gap-2 flex-wrap">
              {integrationCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    selectedCategory === cat.id 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {integrationsLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-zinc-400" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {filteredIntegrations.map((integration) => {
                  const installed = isIntegrationInstalled(integration.id);
                  const installationId = getInstallationId(integration.id);
                  return (
                    <div key={integration.id} className="p-4 bg-zinc-800/50 rounded-xl">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{integration.icon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{integration.name}</p>
                              {integration.popular && (
                                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">Popular</span>
                              )}
                            </div>
                            <p className="text-sm text-zinc-500">{integration.description}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        {installed ? (
                          <button 
                            onClick={() => installationId && handleUninstallIntegration(installationId)}
                            className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-red-500/20 hover:text-red-400 transition-colors"
                          >
                            Installed
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleInstallIntegration(integration.id)}
                            className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                          >
                            Install
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-4xl h-[85vh] bg-zinc-900 rounded-2xl shadow-2xl flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <img src="/adele-logo.png" alt="ADELE" className="w-8 h-8" />
              <span className="font-semibold text-lg">adele</span>
            </div>
          </div>

          <nav className="flex-1 p-2 overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                  activeTab === item.id
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-2 border-t border-zinc-800">
            <a 
              href="https://help.adele.ayonix.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-zinc-800/50 hover:text-white transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
              <span>Get help</span>
              <ExternalLink className="w-4 h-4 ml-auto" />
            </a>
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-zinc-800">
            <h2 className="text-xl font-semibold">
              {menuItems.find(m => m.id === activeTab)?.label || 'Settings'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Add Card Modal - rendered at root level using Portal */}
      {showAddCardModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60" onClick={() => setShowAddCardModal(false)}>
          <div className="bg-zinc-900 rounded-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Payment Method</h3>
              <button onClick={() => setShowAddCardModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const cardNumber = formData.get('cardNumber') as string;
              const expiry = formData.get('expiry') as string;
              const cvc = formData.get('cvc') as string;
              const name = formData.get('name') as string;
              
              if (!cardNumber || !expiry || !cvc || !name) {
                toast.error('Please fill in all fields');
                return;
              }
              
              try {
                toast.success('Card added successfully');
                setShowAddCardModal(false);
                setBillingData((prev: any) => ({
                  ...prev,
                  paymentMethods: [
                    ...(prev?.paymentMethods || []),
                    { last4: cardNumber.slice(-4), expiry, brand: 'Visa' }
                  ]
                }));
              } catch (err: any) {
                toast.error(err.message || 'Failed to add card');
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Cardholder Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Card Number</label>
                <input
                  type="text"
                  name="cardNumber"
                  placeholder="4242 4242 4242 4242"
                  maxLength={19}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Expiry Date</label>
                  <input
                    type="text"
                    name="expiry"
                    placeholder="MM/YY"
                    maxLength={5}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">CVC</label>
                  <input
                    type="text"
                    name="cvc"
                    placeholder="123"
                    maxLength={4}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddCardModal(false)}
                  className="px-4 py-2 bg-zinc-700 rounded-lg hover:bg-zinc-600 transition-colors text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Add Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
// Build timestamp: 1768636015
