import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Loader2,
  Brain,
  Mic,
  Key,
  Server,
  Settings,
  Users,
  Activity,
  Database,
  Shield,
  Check,
  AlertTriangle,
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

interface APIConfig {
  id: string;
  name: string;
  type: string;
  apiKey: string;
  isActive: boolean;
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
  const [apiConfigs, setApiConfigs] = useState<APIConfig[]>([]);
  const [editingLLM, setEditingLLM] = useState<LLMModel | null>(null);
  const [editingVoice, setEditingVoice] = useState<VoiceModel | null>(null);
  const [showAddLLM, setShowAddLLM] = useState(false);
  const [showAddVoice, setShowAddVoice] = useState(false);
  const [saving, setSaving] = useState(false);

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
    // Check if user is admin
    if (user && user.role !== 'admin') {
      toast.error('Access denied. Admin privileges required.');
      setLocation('/dashboard');
    }
  }, [user, authLoading, setLocation]);

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
      // Save to backend
      await fetch('/api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          llmModels,
          voiceModels,
          apiConfigs,
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
                    <p className="text-zinc-400 mt-1">Configure AI models for code generation</p>
                  </div>
                  <button
                    onClick={() => setShowAddLLM(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add Model
                  </button>
                </div>

                {/* Add LLM Modal */}
                {showAddLLM && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold">Add New LLM Model</h3>
                      <button onClick={() => setShowAddLLM(false)} className="p-1 hover:bg-zinc-800 rounded">
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
                        <label className="block text-sm font-medium mb-2">API Key</label>
                        <input
                          type="password"
                          value={newLLM.apiKey}
                          onChange={(e) => setNewLLM({ ...newLLM, apiKey: e.target.value })}
                          className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500"
                          placeholder="sk-..."
                        />
                      </div>
                      {(newLLM.provider === 'ollama' || newLLM.provider === 'custom') && (
                        <div className="col-span-2">
                          <label className="block text-sm font-medium mb-2">Base URL</label>
                          <input
                            type="text"
                            value={newLLM.baseUrl}
                            onChange={(e) => setNewLLM({ ...newLLM, baseUrl: e.target.value })}
                            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500"
                            placeholder="http://localhost:11434"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newLLM.isActive}
                          onChange={(e) => setNewLLM({ ...newLLM, isActive: e.target.checked })}
                          className="rounded border-zinc-600"
                        />
                        <span className="text-sm">Active</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newLLM.isDefault}
                          onChange={(e) => setNewLLM({ ...newLLM, isDefault: e.target.checked })}
                          className="rounded border-zinc-600"
                        />
                        <span className="text-sm">Set as default</span>
                      </label>
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
                  {llmModels.map((model) => (
                    <div
                      key={model.id}
                      className={`flex items-center justify-between p-4 rounded-xl border ${
                        model.isActive ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-900/50 border-zinc-800/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${model.isActive ? 'bg-blue-500/20' : 'bg-zinc-800'}`}>
                          <Brain className={`h-5 w-5 ${model.isActive ? 'text-blue-500' : 'text-zinc-500'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{model.name}</span>
                            {model.isDefault && (
                              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">Default</span>
                            )}
                          </div>
                          <div className="text-sm text-zinc-500">
                            {llmProviders.find(p => p.value === model.provider)?.label} • {model.model}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleLLMActive(model.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            model.isActive ? 'text-green-500 hover:bg-green-500/20' : 'text-zinc-500 hover:bg-zinc-800'
                          }`}
                          title={model.isActive ? 'Disable' : 'Enable'}
                        >
                          {model.isActive ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                        </button>
                        {!model.isDefault && (
                          <button
                            onClick={() => handleSetDefaultLLM(model.id)}
                            className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                            title="Set as default"
                          >
                            <Settings className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteLLM(model.id)}
                          className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Provider Info */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                  <h3 className="font-semibold mb-4">Supported Providers</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {llmProviders.map((provider) => (
                      <div key={provider.value} className="flex items-center gap-2 text-sm text-zinc-400">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        {provider.label}
                      </div>
                    ))}
                  </div>
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
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add Voice
                  </button>
                </div>

                {/* Add Voice Modal */}
                {showAddVoice && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold">Add New Voice Model</h3>
                      <button onClick={() => setShowAddVoice(false)} className="p-1 hover:bg-zinc-800 rounded">
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
                  {[
                    { name: 'OpenAI', key: 'OPENAI_API_KEY', description: 'For GPT models and embeddings' },
                    { name: 'Anthropic', key: 'ANTHROPIC_API_KEY', description: 'For Claude models' },
                    { name: 'ElevenLabs', key: 'ELEVENLABS_API_KEY', description: 'For text-to-speech' },
                    { name: 'Stripe', key: 'STRIPE_SECRET_KEY', description: 'For payment processing' },
                    { name: 'Resend', key: 'RESEND_API_KEY', description: 'For email notifications' },
                    { name: 'GitHub', key: 'GITHUB_CLIENT_SECRET', description: 'For OAuth and integrations' },
                  ].map((api) => (
                    <div key={api.key} className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-zinc-800 rounded-lg">
                          <Key className="h-5 w-5 text-zinc-400" />
                        </div>
                        <div>
                          <span className="font-medium">{api.name}</span>
                          <div className="text-sm text-zinc-500">{api.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-zinc-500 font-mono">{api.key}</span>
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                          <Check className="h-3 w-3" />
                          Configured
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-yellow-200 font-medium">Security Notice</p>
                    <p className="text-yellow-200/70 text-sm mt-1">
                      API keys are stored securely in environment variables. To update keys, modify the .env file on the server and restart the application.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold">User Management</h2>
                  <p className="text-zinc-400 mt-1">Manage user accounts and permissions</p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                  <div className="flex items-center justify-center py-12 text-zinc-500">
                    <div className="text-center">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>User management coming soon</p>
                      <p className="text-sm mt-1">View and manage all registered users</p>
                    </div>
                  </div>
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
    </div>
  );
}
