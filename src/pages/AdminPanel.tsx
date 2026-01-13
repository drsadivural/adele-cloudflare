import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { admin } from '@/lib/api';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  X,
  Loader2,
  Brain,
  Mic,
  Key,
  Server,
  Users,
  Database,
  Shield,
  Check,
  AlertTriangle,
  Edit2,
  Lock,
  Mail,
  UserCog,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
} from 'lucide-react';

interface LLMModel {
  id: string;
  name: string;
  provider: string;
  model: string;
  apiKey: string;
  baseUrl?: string;
  isActive: boolean;
  isDefault: boolean;
}

interface VoiceModel {
  id: string;
  name: string;
  provider: string;
  voiceId: string;
  apiKey: string;
  language: string;
  isActive: boolean;
}

interface APIKeyConfig {
  id: string;
  name: string;
  key: string;
  description: string;
  value: string;
  isConfigured: boolean;
}

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  phone?: string;
  company?: string;
  position?: string;
  createdAt?: string;
  updatedAt?: string;
  emailVerified?: boolean;
  avatarUrl?: string;
  lastSignedIn?: string;
}

const defaultLLMs: LLMModel[] = [
  { id: '1', name: 'GPT-4', provider: 'openai', model: 'gpt-4-turbo-preview', apiKey: '', isActive: true, isDefault: true },
  { id: '2', name: 'GPT-3.5 Turbo', provider: 'openai', model: 'gpt-3.5-turbo', apiKey: '', isActive: true, isDefault: false },
  { id: '3', name: 'Claude 3 Opus', provider: 'anthropic', model: 'claude-3-opus-20240229', apiKey: '', isActive: false, isDefault: false },
];

const defaultVoices: VoiceModel[] = [
  { id: '1', name: 'Rachel', provider: 'elevenlabs', voiceId: '21m00Tcm4TlvDq8ikWAM', apiKey: '', language: 'en', isActive: true },
  { id: '2', name: 'Browser TTS', provider: 'browser', voiceId: 'default', apiKey: '', language: 'en', isActive: true },
];

const llmProviders = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic (Claude)' },
  { value: 'google', label: 'Google AI' },
  { value: 'ollama', label: 'Ollama (Local)' },
  { value: 'mistral', label: 'Mistral AI' },
  { value: 'qwen', label: 'Qwen (Alibaba)' },
  { value: 'groq', label: 'Groq' },
  { value: 'together', label: 'Together AI' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'custom', label: 'Custom API' },
];

const voiceProviders = [
  { value: 'elevenlabs', label: 'ElevenLabs' },
  { value: 'openai', label: 'OpenAI TTS' },
  { value: 'google', label: 'Google Cloud TTS' },
  { value: 'azure', label: 'Azure TTS' },
  { value: 'browser', label: 'Browser TTS' },
];

export default function AdminPanel() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('llms');
  const [llmModels, setLlmModels] = useState<LLMModel[]>(defaultLLMs);
  const [voiceModels, setVoiceModels] = useState<VoiceModel[]>(defaultVoices);
  const [showAddLLM, setShowAddLLM] = useState(false);
  const [showAddVoice, setShowAddVoice] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // User management state
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // API Keys state
  const [apiKeys, setApiKeys] = useState<APIKeyConfig[]>([
    { id: '1', name: 'OpenAI', key: 'OPENAI_API_KEY', description: 'For GPT models and embeddings', value: '', isConfigured: false },
    { id: '2', name: 'Anthropic', key: 'ANTHROPIC_API_KEY', description: 'For Claude models', value: '', isConfigured: false },
    { id: '3', name: 'ElevenLabs', key: 'ELEVENLABS_API_KEY', description: 'For text-to-speech', value: '', isConfigured: false },
    { id: '4', name: 'Stripe', key: 'STRIPE_SECRET_KEY', description: 'For payment processing', value: '', isConfigured: false },
    { id: '5', name: 'Resend', key: 'RESEND_API_KEY', description: 'For email notifications', value: '', isConfigured: false },
    { id: '6', name: 'GitHub', key: 'GITHUB_CLIENT_SECRET', description: 'For OAuth and integrations', value: '', isConfigured: false },
  ]);
  const [editingApiKey, setEditingApiKey] = useState<string | null>(null);
  const [showApiKeyValue, setShowApiKeyValue] = useState<Record<string, boolean>>({});

  // New LLM form state
  const [newLLM, setNewLLM] = useState<Partial<LLMModel>>({
    name: '',
    provider: 'openai',
    model: '',
    apiKey: '',
    baseUrl: '',
    isActive: true,
    isDefault: false,
  });

  // New Voice form state
  const [newVoice, setNewVoice] = useState<Partial<VoiceModel>>({
    name: '',
    provider: 'elevenlabs',
    voiceId: '',
    apiKey: '',
    language: 'en',
    isActive: true,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation('/login');
    }
    if (user && user.role !== 'admin') {
      toast.error('Access denied. Admin privileges required.');
      setLocation('/dashboard');
    }
  }, [user, authLoading, setLocation]);

  // Fetch users when Users tab is active
  useEffect(() => {
    if (activeTab === 'users' && user?.role === 'admin') {
      fetchUsers();
    }
  }, [activeTab, user]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await admin.getUsers();
      setUsers(response.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  // User Management Functions
  const handleEditUser = (u: User) => {
    setEditingUser({ ...u });
    setShowEditModal(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    
    try {
      const response = await fetch(`https://adele-api.ayonix.com/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role,
          phone: editingUser.phone,
          company: editingUser.company,
          position: editingUser.position,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user');
      }
      
      toast.success('User updated successfully');
      setShowEditModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const handleChangePassword = async () => {
    if (!editingUser) return;
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    try {
      const response = await fetch(`https://adele-api.ayonix.com/api/admin/users/${editingUser.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ password: newPassword }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to change password');
      }
      
      toast.success('Password changed successfully');
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error('Failed to change password');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      const response = await fetch(`https://adele-api.ayonix.com/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      
      toast.success('User deleted successfully');
      setShowDeleteModal(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleOpenPasswordModal = (u: User) => {
    setEditingUser(u);
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordModal(true);
  };

  const handleOpenDeleteModal = (u: User) => {
    setUserToDelete(u);
    setShowDeleteModal(true);
  };

  // API Key Functions
  const handleSaveApiKey = async (apiKey: APIKeyConfig) => {
    try {
      const response = await fetch(`https://adele-api.ayonix.com/api/admin/config/api-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          key: apiKey.key,
          value: apiKey.value,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save API key');
      }
      
      setApiKeys(apiKeys.map(k => 
        k.id === apiKey.id ? { ...k, isConfigured: true } : k
      ));
      setEditingApiKey(null);
      toast.success(`${apiKey.name} API key saved`);
    } catch (error) {
      toast.error('Failed to save API key');
    }
  };

  const handleCopyApiKey = (value: string) => {
    navigator.clipboard.writeText(value);
    toast.success('API key copied to clipboard');
  };

  const generateApiKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'sk-';
    for (let i = 0; i < 48; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // LLM Functions
  const handleAddLLM = () => {
    if (!newLLM.name || !newLLM.model) {
      toast.error('Please fill in all required fields');
      return;
    }

    const llm: LLMModel = {
      id: Date.now().toString(),
      name: newLLM.name!,
      provider: newLLM.provider!,
      model: newLLM.model!,
      apiKey: newLLM.apiKey || '',
      baseUrl: newLLM.baseUrl,
      isActive: newLLM.isActive!,
      isDefault: newLLM.isDefault!,
    };

    setLlmModels([...llmModels, llm]);
    setShowAddLLM(false);
    setNewLLM({
      name: '',
      provider: 'openai',
      model: '',
      apiKey: '',
      baseUrl: '',
      isActive: true,
      isDefault: false,
    });
    toast.success('LLM model added successfully');
  };

  const handleAddVoice = () => {
    if (!newVoice.name || !newVoice.voiceId) {
      toast.error('Please fill in all required fields');
      return;
    }

    const voice: VoiceModel = {
      id: Date.now().toString(),
      name: newVoice.name!,
      provider: newVoice.provider!,
      voiceId: newVoice.voiceId!,
      apiKey: newVoice.apiKey || '',
      language: newVoice.language!,
      isActive: newVoice.isActive!,
    };

    setVoiceModels([...voiceModels, voice]);
    setShowAddVoice(false);
    setNewVoice({
      name: '',
      provider: 'elevenlabs',
      voiceId: '',
      apiKey: '',
      language: 'en',
      isActive: true,
    });
    toast.success('Voice model added successfully');
  };

  const handleDeleteLLM = (id: string) => {
    setLlmModels(llmModels.filter(m => m.id !== id));
    toast.success('LLM model deleted');
  };

  const handleDeleteVoice = (id: string) => {
    setVoiceModels(voiceModels.filter(v => v.id !== id));
    toast.success('Voice model deleted');
  };

  const handleSetDefaultLLM = (id: string) => {
    setLlmModels(llmModels.map(m => ({
      ...m,
      isDefault: m.id === id,
    })));
    toast.success('Default LLM updated');
  };

  const handleToggleLLMActive = (id: string) => {
    setLlmModels(llmModels.map(m => 
      m.id === id ? { ...m, isActive: !m.isActive } : m
    ));
  };

  const handleToggleVoiceActive = (id: string) => {
    setVoiceModels(voiceModels.map(v => 
      v.id === id ? { ...v, isActive: !v.isActive } : v
    ));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await fetch('https://adele-api.ayonix.com/api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          llmModels,
          voiceModels,
        }),
      });
      toast.success('Configuration saved successfully');
    } catch (error) {
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const tabs = [
    { id: 'llms', label: 'LLM Models', icon: Brain },
    { id: 'voices', label: 'Voice Models', icon: Mic },
    { id: 'apis', label: 'API Keys', icon: Key },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'system', label: 'System', icon: Server },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-blue-500" />
              <h1 className="text-xl font-semibold">Admin Panel</h1>
            </div>
          </div>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save All Changes
          </button>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* LLM Models Tab */}
            {activeTab === 'llms' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold">LLM Models</h2>
                    <p className="text-zinc-400 mt-1">Configure AI language models for the application</p>
                  </div>
                  <button
                    onClick={() => setShowAddLLM(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add Model
                  </button>
                </div>

                {/* Add LLM Form */}
                {showAddLLM && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Add New LLM Model</h3>
                      <button onClick={() => setShowAddLLM(false)} className="text-zinc-400 hover:text-white">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Name</label>
                        <input
                          type="text"
                          value={newLLM.name}
                          onChange={(e) => setNewLLM({ ...newLLM, name: e.target.value })}
                          className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500"
                          placeholder="e.g., GPT-4 Turbo"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Provider</label>
                        <select
                          value={newLLM.provider}
                          onChange={(e) => setNewLLM({ ...newLLM, provider: e.target.value })}
                          className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500"
                        >
                          {llmProviders.map((p) => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Model ID</label>
                        <input
                          type="text"
                          value={newLLM.model}
                          onChange={(e) => setNewLLM({ ...newLLM, model: e.target.value })}
                          className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500"
                          placeholder="e.g., gpt-4-turbo-preview"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Base URL (optional)</label>
                        <input
                          type="text"
                          value={newLLM.baseUrl}
                          onChange={(e) => setNewLLM({ ...newLLM, baseUrl: e.target.value })}
                          className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500"
                          placeholder="For custom endpoints"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium mb-2">API Key</label>
                        <input
                          type="password"
                          value={newLLM.apiKey}
                          onChange={(e) => setNewLLM({ ...newLLM, apiKey: e.target.value })}
                          className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500"
                          placeholder="API Key"
                        />
                      </div>
                      <div className="col-span-2 flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newLLM.isActive}
                            onChange={(e) => setNewLLM({ ...newLLM, isActive: e.target.checked })}
                            className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500"
                          />
                          <span className="text-sm">Active</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newLLM.isDefault}
                            onChange={(e) => setNewLLM({ ...newLLM, isDefault: e.target.checked })}
                            className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500"
                          />
                          <span className="text-sm">Set as Default</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                      <button
                        onClick={() => setShowAddLLM(false)}
                        className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddLLM}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      >
                        Add Model
                      </button>
                    </div>
                  </div>
                )}

                {/* LLM Models List */}
                <div className="space-y-3">
                  {llmModels.map((llm) => (
                    <div
                      key={llm.id}
                      className={`flex items-center justify-between p-4 rounded-xl border ${
                        llm.isActive ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-900/50 border-zinc-800/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${llm.isActive ? 'bg-blue-500/20' : 'bg-zinc-800'}`}>
                          <Brain className={`h-5 w-5 ${llm.isActive ? 'text-blue-500' : 'text-zinc-500'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{llm.name}</span>
                            {llm.isDefault && (
                              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">Default</span>
                            )}
                          </div>
                          <div className="text-sm text-zinc-500">
                            {llmProviders.find(p => p.value === llm.provider)?.label} • {llm.model}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!llm.isDefault && (
                          <button
                            onClick={() => handleSetDefaultLLM(llm.id)}
                            className="px-3 py-1 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleLLMActive(llm.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            llm.isActive ? 'text-green-500 hover:bg-green-500/20' : 'text-zinc-500 hover:bg-zinc-800'
                          }`}
                        >
                          {llm.isActive ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleDeleteLLM(llm.id)}
                          className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Voice Models Tab */}
            {activeTab === 'voices' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold">Voice Models</h2>
                    <p className="text-zinc-400 mt-1">Configure text-to-speech voices</p>
                  </div>
                  <button
                    onClick={() => setShowAddVoice(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add Voice
                  </button>
                </div>

                {/* Add Voice Form */}
                {showAddVoice && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Add New Voice</h3>
                      <button onClick={() => setShowAddVoice(false)} className="text-zinc-400 hover:text-white">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Name</label>
                        <input
                          type="text"
                          value={newVoice.name}
                          onChange={(e) => setNewVoice({ ...newVoice, name: e.target.value })}
                          className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500"
                          placeholder="e.g., Rachel"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Provider</label>
                        <select
                          value={newVoice.provider}
                          onChange={(e) => setNewVoice({ ...newVoice, provider: e.target.value })}
                          className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500"
                        >
                          {voiceProviders.map((p) => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Voice ID</label>
                        <input
                          type="text"
                          value={newVoice.voiceId}
                          onChange={(e) => setNewVoice({ ...newVoice, voiceId: e.target.value })}
                          className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500"
                          placeholder="Voice ID from provider"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Language</label>
                        <select
                          value={newVoice.language}
                          onChange={(e) => setNewVoice({ ...newVoice, language: e.target.value })}
                          className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500"
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                          <option value="ja">Japanese</option>
                          <option value="zh">Chinese</option>
                        </select>
                      </div>
                      {newVoice.provider !== 'browser' && (
                        <div className="col-span-2">
                          <label className="block text-sm font-medium mb-2">API Key</label>
                          <input
                            type="password"
                            value={newVoice.apiKey}
                            onChange={(e) => setNewVoice({ ...newVoice, apiKey: e.target.value })}
                            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500"
                            placeholder="API Key"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                      <button
                        onClick={() => setShowAddVoice(false)}
                        className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddVoice}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      >
                        Add Voice
                      </button>
                    </div>
                  </div>
                )}

                {/* Voice Models List */}
                <div className="space-y-3">
                  {voiceModels.map((voice) => (
                    <div
                      key={voice.id}
                      className={`flex items-center justify-between p-4 rounded-xl border ${
                        voice.isActive ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-900/50 border-zinc-800/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${voice.isActive ? 'bg-purple-500/20' : 'bg-zinc-800'}`}>
                          <Mic className={`h-5 w-5 ${voice.isActive ? 'text-purple-500' : 'text-zinc-500'}`} />
                        </div>
                        <div>
                          <span className="font-medium">{voice.name}</span>
                          <div className="text-sm text-zinc-500">
                            {voiceProviders.find(p => p.value === voice.provider)?.label} • {voice.language.toUpperCase()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleVoiceActive(voice.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            voice.isActive ? 'text-green-500 hover:bg-green-500/20' : 'text-zinc-500 hover:bg-zinc-800'
                          }`}
                        >
                          {voice.isActive ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleDeleteVoice(voice.id)}
                          className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* API Keys Tab */}
            {activeTab === 'apis' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold">API Keys</h2>
                  <p className="text-zinc-400 mt-1">Manage API keys for external services</p>
                </div>

                <div className="space-y-4">
                  {apiKeys.map((apiKey) => (
                    <div key={apiKey.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-zinc-800 rounded-lg">
                            <Key className="h-5 w-5 text-zinc-400" />
                          </div>
                          <div>
                            <span className="font-medium">{apiKey.name}</span>
                            <div className="text-sm text-zinc-500">{apiKey.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {apiKey.isConfigured ? (
                            <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                              <Check className="h-3 w-3" />
                              Configured
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                              <AlertTriangle className="h-3 w-3" />
                              Not Set
                            </div>
                          )}
                          <button
                            onClick={() => setEditingApiKey(editingApiKey === apiKey.id ? null : apiKey.id)}
                            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      {editingApiKey === apiKey.id && (
                        <div className="mt-4 pt-4 border-t border-zinc-800">
                          <div className="flex gap-3">
                            <div className="flex-1 relative">
                              <input
                                type={showApiKeyValue[apiKey.id] ? 'text' : 'password'}
                                value={apiKey.value}
                                onChange={(e) => setApiKeys(apiKeys.map(k => 
                                  k.id === apiKey.id ? { ...k, value: e.target.value } : k
                                ))}
                                className="w-full px-4 py-2 pr-20 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 font-mono text-sm"
                                placeholder={`Enter ${apiKey.name} API key`}
                              />
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <button
                                  onClick={() => setShowApiKeyValue({ ...showApiKeyValue, [apiKey.id]: !showApiKeyValue[apiKey.id] })}
                                  className="p-1 text-zinc-500 hover:text-white"
                                >
                                  {showApiKeyValue[apiKey.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                                <button
                                  onClick={() => handleCopyApiKey(apiKey.value)}
                                  className="p-1 text-zinc-500 hover:text-white"
                                >
                                  <Copy className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            <button
                              onClick={() => handleSaveApiKey(apiKey)}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-yellow-200 font-medium">Security Notice</p>
                    <p className="text-yellow-200/70 text-sm mt-1">
                      API keys are stored securely. For production environments, use Cloudflare Worker secrets via <code className="bg-zinc-800 px-1 rounded">wrangler secret put</code>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold">User Management</h2>
                    <p className="text-zinc-400 mt-1">Manage user accounts and permissions</p>
                  </div>
                  <button
                    onClick={fetchUsers}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                  >
                    <RefreshCw className={`h-4 w-4 ${loadingUsers ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                  {loadingUsers ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                  ) : users.length === 0 ? (
                    <div className="flex items-center justify-center py-12 text-zinc-500">
                      <div className="text-center">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No users found</p>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-zinc-800/50">
                          <tr>
                            <th className="text-left px-6 py-3 text-sm font-medium text-zinc-400">User</th>
                            <th className="text-left px-6 py-3 text-sm font-medium text-zinc-400">Email</th>
                            <th className="text-left px-6 py-3 text-sm font-medium text-zinc-400">Role</th>
                            <th className="text-left px-6 py-3 text-sm font-medium text-zinc-400">Company</th>
                            <th className="text-left px-6 py-3 text-sm font-medium text-zinc-400">Joined</th>
                            <th className="text-right px-6 py-3 text-sm font-medium text-zinc-400">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((u) => (
                            <tr key={u.id} className="border-t border-zinc-800 hover:bg-zinc-800/30">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-medium text-blue-400">
                                      {u.name?.[0]?.toUpperCase() || '?'}
                                    </span>
                                  </div>
                                  <span className="font-medium">{u.name || 'Unknown'}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-zinc-400">{u.email}</td>
                              <td className="px-6 py-4">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    u.role === 'admin'
                                      ? 'bg-purple-500/20 text-purple-400'
                                      : 'bg-zinc-700 text-zinc-300'
                                  }`}
                                >
                                  {u.role}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-zinc-400">{u.company || '-'}</td>
                              <td className="px-6 py-4 text-zinc-400">
                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleEditUser(u)}
                                    className="p-2 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                                    title="Edit user"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleOpenPasswordModal(u)}
                                    className="p-2 text-zinc-400 hover:text-yellow-400 hover:bg-yellow-500/20 rounded-lg transition-colors"
                                    title="Change password"
                                  >
                                    <Lock className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleOpenDeleteModal(u)}
                                    className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                    title="Delete user"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* System Tab */}
            {activeTab === 'system' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold">System Status</h2>
                  <p className="text-zinc-400 mt-1">Monitor system health and performance</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Database', status: 'healthy', icon: Database },
                    { label: 'API Server', status: 'healthy', icon: Server },
                    { label: 'AI Services', status: 'healthy', icon: Brain },
                    { label: 'Voice Services', status: 'healthy', icon: Mic },
                  ].map((service) => (
                    <div key={service.label} className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                      <div className="flex items-center gap-3">
                        <service.icon className="h-5 w-5 text-zinc-400" />
                        <span>{service.label}</span>
                      </div>
                      <div className="flex items-center gap-2 text-green-400 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Healthy
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                  <h3 className="font-semibold mb-4">Quick Actions</h3>
                  <div className="flex flex-wrap gap-3">
                    <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-sm">
                      Clear Cache
                    </button>
                    <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-sm">
                      Restart Services
                    </button>
                    <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-sm">
                      View Logs
                    </button>
                    <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-sm">
                      Backup Database
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Edit User</h3>
              <button onClick={() => setShowEditModal(false)} className="text-zinc-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Company</label>
                <input
                  type="text"
                  value={editingUser.company || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, company: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Position</label>
                <input
                  type="text"
                  value={editingUser.position || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, position: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  value={editingUser.phone || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Change Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-zinc-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-zinc-400 text-sm mb-4">
              Changing password for: <span className="text-white font-medium">{editingUser.email}</span>
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 pr-10 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="Enter new password"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-red-400">Delete User</h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-zinc-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
              <p className="text-red-200">
                Are you sure you want to delete this user? This action cannot be undone.
              </p>
            </div>
            <div className="bg-zinc-800 rounded-lg p-4">
              <p className="text-sm text-zinc-400">User to delete:</p>
              <p className="font-medium">{userToDelete.name}</p>
              <p className="text-sm text-zinc-500">{userToDelete.email}</p>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
