import { useState } from 'react';
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
  LogOut
} from 'lucide-react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: { name: string; email: string } | null;
  onLogout: () => void;
}

export default function SettingsPanel({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  user,
  onLogout
}: SettingsPanelProps) {
  const [language, setLanguage] = useState('English');
  const [appearance, setAppearance] = useState<'light' | 'dark' | 'system'>('system');
  const [receiveContent, setReceiveContent] = useState(true);
  const [emailOnTask, setEmailOnTask] = useState(true);

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

  const renderContent = () => {
    switch (activeTab) {
      case 'account':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm text-zinc-400 mb-4">Profile</h3>
              <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-semibold text-white">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="font-medium text-white">{user?.name || 'User'}</p>
                  <p className="text-sm text-zinc-400">{user?.email || 'user@example.com'}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm text-zinc-400 mb-4">Security</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <Key className="w-5 h-5 text-zinc-400" />
                    <span>Change password</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-zinc-500" />
                </button>
                <button className="w-full flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-zinc-400" />
                    <span>Two-factor authentication</span>
                  </div>
                  <span className="text-sm text-zinc-500">Off</span>
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-sm text-zinc-400 mb-4">Danger Zone</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl hover:bg-red-900/20 transition-colors text-red-400">
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
                  <button
                    onClick={() => setReceiveContent(!receiveContent)}
                    className={`w-12 h-7 rounded-full transition-colors ${
                      receiveContent ? 'bg-blue-500' : 'bg-zinc-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      receiveContent ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
                  <div>
                    <p className="font-medium">Email me when my queued task starts</p>
                    <p className="text-sm text-zinc-400">When enabled, we'll send you a timely email once your task finishes queuing and begins processing.</p>
                  </div>
                  <button
                    onClick={() => setEmailOnTask(!emailOnTask)}
                    className={`w-12 h-7 rounded-full transition-colors ${
                      emailOnTask ? 'bg-blue-500' : 'bg-zinc-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      emailOnTask ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
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
            <div className="p-6 bg-zinc-800/50 rounded-xl">
              <h3 className="text-lg font-medium mb-4">Current Plan</h3>
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-bold">Free</span>
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  Upgrade
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Tasks</span>
                    <span>3 / 10</span>
                  </div>
                  <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '30%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Storage</span>
                    <span>256 MB / 1 GB</span>
                  </div>
                  <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: '25%' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-zinc-800/50 rounded-xl">
              <h3 className="text-lg font-medium mb-4">Usage History</h3>
              <div className="space-y-3">
                {[
                  { date: 'Today', tasks: 2, tokens: '12.5K' },
                  { date: 'Yesterday', tasks: 5, tokens: '45.2K' },
                  { date: 'Dec 29', tasks: 3, tokens: '28.1K' },
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
            <div className="p-6 bg-zinc-800/50 rounded-xl">
              <h3 className="text-lg font-medium mb-4">Payment Method</h3>
              <button className="w-full p-4 border-2 border-dashed border-zinc-600 rounded-xl text-zinc-400 hover:border-zinc-500 hover:text-zinc-300 transition-colors">
                + Add payment method
              </button>
            </div>

            <div className="p-6 bg-zinc-800/50 rounded-xl">
              <h3 className="text-lg font-medium mb-4">Billing History</h3>
              <p className="text-zinc-400">No billing history yet.</p>
            </div>
          </div>
        );

      case 'scheduled':
        return (
          <div className="space-y-6">
            <div className="p-6 bg-zinc-800/50 rounded-xl">
              <h3 className="text-lg font-medium mb-4">Scheduled Tasks</h3>
              <p className="text-zinc-400 mb-4">Schedule tasks to run automatically at specific times.</p>
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                + Create Schedule
              </button>
            </div>

            <div className="p-6 bg-zinc-800/50 rounded-xl">
              <h3 className="text-lg font-medium mb-4">Active Schedules</h3>
              <p className="text-zinc-400">No scheduled tasks yet.</p>
            </div>
          </div>
        );

      case 'mail':
        return (
          <div className="space-y-6">
            <div className="p-6 bg-zinc-800/50 rounded-xl">
              <h3 className="text-lg font-medium mb-4">Mail ADELE</h3>
              <p className="text-zinc-400 mb-4">Send emails to ADELE to create tasks automatically.</p>
              <div className="p-4 bg-zinc-900 rounded-lg">
                <p className="text-sm text-zinc-400 mb-1">Your ADELE email address:</p>
                <p className="font-mono text-blue-400">tasks@adele.ayonix.com</p>
              </div>
            </div>
          </div>
        );

      case 'data':
        return (
          <div className="space-y-6">
            <div className="p-6 bg-zinc-800/50 rounded-xl">
              <h3 className="text-lg font-medium mb-4">Data Controls</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg">
                  <div>
                    <p className="font-medium">Data retention</p>
                    <p className="text-sm text-zinc-400">How long to keep your conversation history</p>
                  </div>
                  <select className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2">
                    <option>Forever</option>
                    <option>1 year</option>
                    <option>6 months</option>
                    <option>30 days</option>
                  </select>
                </div>
                <button className="w-full p-4 bg-zinc-900 rounded-lg text-left hover:bg-zinc-800 transition-colors">
                  <p className="font-medium text-red-400">Clear all data</p>
                  <p className="text-sm text-zinc-400">Delete all your conversations and generated content</p>
                </button>
              </div>
            </div>
          </div>
        );

      case 'browser':
        return (
          <div className="space-y-6">
            <div className="p-6 bg-zinc-800/50 rounded-xl">
              <h3 className="text-lg font-medium mb-4">Cloud Browser</h3>
              <p className="text-zinc-400 mb-4">ADELE can browse the web on your behalf using a cloud browser.</p>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg">
                  <div>
                    <p className="font-medium">Enable cloud browser</p>
                    <p className="text-sm text-zinc-400">Allow ADELE to access websites</p>
                  </div>
                  <button className="w-12 h-7 rounded-full bg-blue-500">
                    <div className="w-5 h-5 bg-white rounded-full translate-x-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'connectors':
      case 'integrations':
        return (
          <div className="space-y-6">
            <div className="p-6 bg-zinc-800/50 rounded-xl">
              <h3 className="text-lg font-medium mb-4">
                {activeTab === 'connectors' ? 'Connectors' : 'Integrations'}
              </h3>
              <p className="text-zinc-400">
                {activeTab === 'connectors' 
                  ? 'Connect your favorite apps to ADELE.'
                  : 'Integrate ADELE with your workflow.'}
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-4xl h-[80vh] bg-zinc-900 rounded-2xl shadow-2xl flex overflow-hidden">
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
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-zinc-800/50 hover:text-white transition-colors">
              <HelpCircle className="w-5 h-5" />
              <span>Get help</span>
              <ExternalLink className="w-4 h-4 ml-auto" />
            </button>
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
    </div>
  );
}
