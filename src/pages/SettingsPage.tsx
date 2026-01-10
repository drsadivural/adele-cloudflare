import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Settings,
  Palette,
  Globe,
  Bell,
  Bot,
  Mic,
  Volume2,
  Key,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { ResponsiveLayout, PageContainer, PageHeader, Card } from '@/components/layout/ResponsiveLayout';
import { Button, Input, Select, Tabs, Badge, Modal, Switch, Alert, Checkbox } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface ApiKey {
  id: number;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

const themeOptions = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'ja', label: '日本語' },
  { value: 'zh', label: '中文' },
  { value: 'ko', label: '한국어' },
];

const modelOptions = [
  { value: 'gpt-4', label: 'GPT-4 (Most Capable)' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (Faster)' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Economical)' },
  { value: 'claude-3-opus', label: 'Claude 3 Opus' },
  { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
];

const providerOptions = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google', label: 'Google AI' },
  { value: 'azure', label: 'Azure OpenAI' },
];

const ttsProviderOptions = [
  { value: 'browser', label: 'Browser (Free)' },
  { value: 'elevenlabs', label: 'ElevenLabs' },
  { value: 'google', label: 'Google Cloud TTS' },
  { value: 'azure', label: 'Azure Speech' },
];

const voiceOptions = [
  { value: 'en-US-Standard-A', label: 'English (US) - Female' },
  { value: 'en-US-Standard-B', label: 'English (US) - Male' },
  { value: 'en-GB-Standard-A', label: 'English (UK) - Female' },
  { value: 'en-GB-Standard-B', label: 'English (UK) - Male' },
];

const apiScopes = [
  { id: 'projects:read', label: 'Read Projects', description: 'View project information' },
  { id: 'projects:write', label: 'Write Projects', description: 'Create and modify projects' },
  { id: 'chat:read', label: 'Read Chat', description: 'View chat history' },
  { id: 'chat:write', label: 'Write Chat', description: 'Send messages' },
  { id: 'files:read', label: 'Read Files', description: 'Download generated files' },
  { id: 'files:write', label: 'Write Files', description: 'Upload files' },
  { id: 'deployments:read', label: 'Read Deployments', description: 'View deployment status' },
  { id: 'deployments:write', label: 'Write Deployments', description: 'Trigger deployments' },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('preferences');
  const [loading, setLoading] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showCreateKeyModal, setShowCreateKeyModal] = useState(false);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');

  // Settings state
  const [settings, setSettings] = useState({
    theme: 'system',
    language: 'en',
    defaultModel: 'gpt-4',
    defaultProvider: 'openai',
    voiceEnabled: true,
    voiceLanguage: 'en-US',
    ttsEnabled: false,
    ttsProvider: 'browser',
    ttsVoice: 'en-US-Standard-A',
    proactiveVoice: false,
    wakeWordEnabled: false,
    wakeWord: 'hey adele',
  });

  // Notifications state
  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    projectComplete: true,
    deploymentStatus: true,
    securityAlerts: true,
    marketing: false,
    weeklyDigest: true,
  });

  // New API key form
  const [newKeyForm, setNewKeyForm] = useState({
    name: '',
    scopes: [] as string[],
    expiresIn: '90',
  });

  useEffect(() => {
    loadSettings();
    loadApiKeys();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.settings.get();
      if (response) {
        setSettings((prev) => ({ ...prev, ...response }));
        if (response.notifications) {
          setNotifications((prev) => ({ ...prev, ...JSON.parse(response.notifications) }));
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const loadApiKeys = async () => {
    try {
      const response = await api.apiKeys.list();
      setApiKeys(response.keys || []);
    } catch (error) {
      console.error('Failed to load API keys:', error);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await api.settings.update({
        ...settings,
        notifications: JSON.stringify(notifications),
      });
      toast.success('Settings saved successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyForm.name.trim()) {
      toast.error('Please enter a name for the API key');
      return;
    }
    if (newKeyForm.scopes.length === 0) {
      toast.error('Please select at least one scope');
      return;
    }
    setLoading(true);
    try {
      const response = await api.apiKeys.create({
        name: newKeyForm.name,
        scopes: newKeyForm.scopes,
        expiresIn: parseInt(newKeyForm.expiresIn),
      });
      setNewApiKey(response.key);
      setShowCreateKeyModal(false);
      setShowNewKeyModal(true);
      setNewKeyForm({ name: '', scopes: [], expiresIn: '90' });
      loadApiKeys();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create API key');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeApiKey = async (keyId: number) => {
    try {
      await api.apiKeys.revoke(keyId);
      loadApiKeys();
      toast.success('API key revoked');
    } catch (error: any) {
      toast.error(error.message || 'Failed to revoke API key');
    }
  };

  const toggleScope = (scopeId: string) => {
    setNewKeyForm((prev) => ({
      ...prev,
      scopes: prev.scopes.includes(scopeId)
        ? prev.scopes.filter((s) => s !== scopeId)
        : [...prev.scopes, scopeId],
    }));
  };

  const tabs = [
    { id: 'preferences', label: 'Preferences', icon: <Palette className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'ai', label: 'AI & Voice', icon: <Bot className="w-4 h-4" /> },
    { id: 'api', label: 'API Keys', icon: <Key className="w-4 h-4" /> },
  ];

  return (
    <ResponsiveLayout>
      <PageContainer>
        <PageHeader
          title="Settings"
          description="Customize your ADELE experience"
          actions={
            <Button onClick={handleSaveSettings} loading={loading}>
              Save Changes
            </Button>
          }
        />

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <Card>
              <h3 className="text-lg font-semibold text-white mb-6">Appearance</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Select
                  label="Theme"
                  options={themeOptions}
                  value={settings.theme}
                  onChange={(value) => setSettings({ ...settings, theme: value })}
                />
                <Select
                  label="Language"
                  options={languageOptions}
                  value={settings.language}
                  onChange={(value) => setSettings({ ...settings, language: value })}
                />
              </div>
            </Card>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <Card>
              <h3 className="text-lg font-semibold text-white mb-6">Email Notifications</h3>
              <div className="space-y-4">
                <Switch
                  checked={notifications.emailUpdates}
                  onChange={(checked) => setNotifications({ ...notifications, emailUpdates: checked })}
                  label="Email Updates"
                  description="Receive important updates about your account"
                />
                <Switch
                  checked={notifications.projectComplete}
                  onChange={(checked) => setNotifications({ ...notifications, projectComplete: checked })}
                  label="Project Completion"
                  description="Get notified when a project build completes"
                />
                <Switch
                  checked={notifications.deploymentStatus}
                  onChange={(checked) => setNotifications({ ...notifications, deploymentStatus: checked })}
                  label="Deployment Status"
                  description="Receive updates about deployment status changes"
                />
                <Switch
                  checked={notifications.securityAlerts}
                  onChange={(checked) => setNotifications({ ...notifications, securityAlerts: checked })}
                  label="Security Alerts"
                  description="Get notified about security-related events"
                />
                <Switch
                  checked={notifications.marketing}
                  onChange={(checked) => setNotifications({ ...notifications, marketing: checked })}
                  label="Marketing Emails"
                  description="Receive news, tips, and special offers"
                />
                <Switch
                  checked={notifications.weeklyDigest}
                  onChange={(checked) => setNotifications({ ...notifications, weeklyDigest: checked })}
                  label="Weekly Digest"
                  description="Get a weekly summary of your activity"
                />
              </div>
            </Card>
          </div>
        )}

        {/* AI & Voice Tab */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            <Card>
              <h3 className="text-lg font-semibold text-white mb-6">Default AI Settings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Select
                  label="Default Model"
                  options={modelOptions}
                  value={settings.defaultModel}
                  onChange={(value) => setSettings({ ...settings, defaultModel: value })}
                />
                <Select
                  label="Default Provider"
                  options={providerOptions}
                  value={settings.defaultProvider}
                  onChange={(value) => setSettings({ ...settings, defaultProvider: value })}
                />
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-white mb-6">Voice Settings</h3>
              <div className="space-y-6">
                <Switch
                  checked={settings.voiceEnabled}
                  onChange={(checked) => setSettings({ ...settings, voiceEnabled: checked })}
                  label="Enable Voice Input"
                  description="Use your microphone to speak to ADELE"
                />

                <Switch
                  checked={settings.ttsEnabled}
                  onChange={(checked) => setSettings({ ...settings, ttsEnabled: checked })}
                  label="Enable Text-to-Speech"
                  description="ADELE will speak responses aloud"
                />

                {settings.ttsEnabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pl-8 border-l-2 border-zinc-800">
                    <Select
                      label="TTS Provider"
                      options={ttsProviderOptions}
                      value={settings.ttsProvider}
                      onChange={(value) => setSettings({ ...settings, ttsProvider: value })}
                    />
                    <Select
                      label="Voice"
                      options={voiceOptions}
                      value={settings.ttsVoice}
                      onChange={(value) => setSettings({ ...settings, ttsVoice: value })}
                    />
                  </div>
                )}

                <Switch
                  checked={settings.proactiveVoice}
                  onChange={(checked) => setSettings({ ...settings, proactiveVoice: checked })}
                  label="Proactive Voice Updates"
                  description="ADELE will speak status updates during long tasks"
                />

                <Switch
                  checked={settings.wakeWordEnabled}
                  onChange={(checked) => setSettings({ ...settings, wakeWordEnabled: checked })}
                  label="Enable Wake Word"
                  description="Activate ADELE by saying the wake word"
                />

                {settings.wakeWordEnabled && (
                  <div className="pl-8 border-l-2 border-zinc-800">
                    <Input
                      label="Wake Word"
                      value={settings.wakeWord}
                      onChange={(e) => setSettings({ ...settings, wakeWord: e.target.value })}
                      placeholder="hey adele"
                      hint="The phrase that activates voice mode"
                    />
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* API Keys Tab */}
        {activeTab === 'api' && (
          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">API Keys</h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    Create and manage API keys for programmatic access to ADELE
                  </p>
                </div>
                <Button onClick={() => setShowCreateKeyModal(true)} icon={<Plus className="w-4 h-4" />}>
                  Create Key
                </Button>
              </div>

              {apiKeys.length === 0 ? (
                <div className="text-center py-12">
                  <Key className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                  <p className="text-zinc-400">No API keys yet</p>
                  <p className="text-sm text-zinc-500 mt-1">
                    Create an API key to access ADELE programmatically
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {apiKeys.map((key) => (
                    <div
                      key={key.id}
                      className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{key.name}</span>
                          <code className="px-2 py-0.5 bg-zinc-700 rounded text-xs text-zinc-300">
                            {key.keyPrefix}...
                          </code>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-zinc-400 mt-1">
                          <span>Created {new Date(key.createdAt).toLocaleDateString()}</span>
                          {key.lastUsedAt && (
                            <span>Last used {new Date(key.lastUsedAt).toLocaleDateString()}</span>
                          )}
                          {key.expiresAt && (
                            <span>Expires {new Date(key.expiresAt).toLocaleDateString()}</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {key.scopes.map((scope) => (
                            <Badge key={scope} size="sm">
                              {scope}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeApiKey(key.id)}
                        icon={<Trash2 className="w-4 h-4 text-red-400" />}
                      >
                        Revoke
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-white mb-4">API Documentation</h3>
              <p className="text-zinc-400 mb-4">
                Use the ADELE API to integrate with your applications and workflows.
              </p>
              <div className="bg-zinc-800 rounded-xl p-4">
                <code className="text-sm text-zinc-300">
                  Base URL: https://api.adele.ayonix.com/v1
                </code>
              </div>
              <Button variant="outline" className="mt-4">
                View API Documentation
              </Button>
            </Card>
          </div>
        )}

        {/* Create API Key Modal */}
        <Modal
          isOpen={showCreateKeyModal}
          onClose={() => setShowCreateKeyModal(false)}
          title="Create API Key"
          description="Generate a new API key with specific permissions"
          size="lg"
        >
          <form onSubmit={handleCreateApiKey} className="space-y-6">
            <Input
              label="Key Name"
              value={newKeyForm.name}
              onChange={(e) => setNewKeyForm({ ...newKeyForm, name: e.target.value })}
              placeholder="My API Key"
              hint="A descriptive name to identify this key"
              required
            />

            <Select
              label="Expiration"
              options={[
                { value: '30', label: '30 days' },
                { value: '90', label: '90 days' },
                { value: '180', label: '180 days' },
                { value: '365', label: '1 year' },
                { value: '0', label: 'Never' },
              ]}
              value={newKeyForm.expiresIn}
              onChange={(value) => setNewKeyForm({ ...newKeyForm, expiresIn: value })}
            />

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-3">Permissions</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {apiScopes.map((scope) => (
                  <div
                    key={scope.id}
                    onClick={() => toggleScope(scope.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                      newKeyForm.scopes.includes(scope.id)
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white text-sm">{scope.label}</span>
                      {newKeyForm.scopes.includes(scope.id) && (
                        <Check className="w-4 h-4 text-blue-400" />
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">{scope.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowCreateKeyModal(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                Create Key
              </Button>
            </div>
          </form>
        </Modal>

        {/* New Key Display Modal */}
        <Modal
          isOpen={showNewKeyModal}
          onClose={() => setShowNewKeyModal(false)}
          title="API Key Created"
          description="Make sure to copy your API key now. You won't be able to see it again!"
        >
          <div className="space-y-4">
            <Alert variant="warning">
              This is the only time you'll see this key. Store it securely!
            </Alert>
            <div className="relative">
              <code className="block w-full p-4 bg-zinc-800 rounded-xl font-mono text-sm text-zinc-300 break-all">
                {newApiKey}
              </code>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => {
                  navigator.clipboard.writeText(newApiKey);
                  toast.success('Copied to clipboard');
                }}
                icon={<Copy className="w-4 h-4" />}
              />
            </div>
            <div className="flex justify-end pt-4">
              <Button onClick={() => setShowNewKeyModal(false)}>Done</Button>
            </div>
          </div>
        </Modal>
      </PageContainer>
    </ResponsiveLayout>
  );
}
