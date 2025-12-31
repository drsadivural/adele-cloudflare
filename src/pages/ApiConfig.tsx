import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import { admin } from '../lib/api';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Mail,
  Brain,
  Mic,
  CreditCard,
  Cloud,
  Database,
  Shield,
  Key,
  Globe,
  Webhook,
  // Server unused
} from 'lucide-react';

interface ApiConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  fields: ApiField[];
  testEndpoint?: string;
}

interface ApiField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'url' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  helpText?: string;
}

interface ConfigValue {
  [key: string]: string;
}

interface TestResult {
  success: boolean;
  message: string;
}

const apiConfigs: ApiConfig[] = [
  {
    id: 'resend',
    name: 'Resend (Email)',
    description: 'Transactional email service for welcome emails, password resets, and notifications',
    icon: <Mail className="w-6 h-6" />,
    category: 'Communication',
    fields: [
      { key: 'RESEND_API_KEY', label: 'API Key', type: 'password', placeholder: 're_...', required: true },
      { key: 'RESEND_FROM_EMAIL', label: 'From Email', type: 'text', placeholder: 'noreply@yourdomain.com', required: true },
      { key: 'RESEND_FROM_NAME', label: 'From Name', type: 'text', placeholder: 'ADELE', required: false },
    ],
    testEndpoint: '/api/admin/test-api/resend',
  },
  {
    id: 'openai',
    name: 'OpenAI (LLM)',
    description: 'GPT models for AI-powered code generation and natural language processing',
    icon: <Brain className="w-6 h-6" />,
    category: 'AI & ML',
    fields: [
      { key: 'OPENAI_API_KEY', label: 'API Key', type: 'password', placeholder: 'sk-...', required: true },
      { key: 'OPENAI_ORG_ID', label: 'Organization ID', type: 'text', placeholder: 'org-...', required: false },
      { 
        key: 'OPENAI_MODEL', 
        label: 'Default Model', 
        type: 'select', 
        options: [
          { value: 'gpt-4-turbo-preview', label: 'GPT-4 Turbo' },
          { value: 'gpt-4', label: 'GPT-4' },
          { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
        ],
        required: false 
      },
    ],
    testEndpoint: '/api/admin/test-api/openai',
  },
  {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    description: 'Claude models for advanced reasoning and code generation',
    icon: <Brain className="w-6 h-6" />,
    category: 'AI & ML',
    fields: [
      { key: 'ANTHROPIC_API_KEY', label: 'API Key', type: 'password', placeholder: 'sk-ant-...', required: true },
      { 
        key: 'ANTHROPIC_MODEL', 
        label: 'Default Model', 
        type: 'select', 
        options: [
          { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
          { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
          { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
        ],
        required: false 
      },
    ],
    testEndpoint: '/api/admin/test-api/anthropic',
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs (Voice)',
    description: 'Text-to-speech and voice synthesis for voice-controlled features',
    icon: <Mic className="w-6 h-6" />,
    category: 'AI & ML',
    fields: [
      { key: 'ELEVENLABS_API_KEY', label: 'API Key', type: 'password', placeholder: 'Your API key', required: true },
      { key: 'ELEVENLABS_VOICE_ID', label: 'Default Voice ID', type: 'text', placeholder: 'Voice ID', required: false },
    ],
    testEndpoint: '/api/admin/test-api/elevenlabs',
  },
  {
    id: 'whisper',
    name: 'OpenAI Whisper (Speech-to-Text)',
    description: 'Speech recognition for voice commands and transcription',
    icon: <Mic className="w-6 h-6" />,
    category: 'AI & ML',
    fields: [
      { key: 'WHISPER_API_KEY', label: 'API Key (or use OpenAI key)', type: 'password', placeholder: 'sk-...', required: false, helpText: 'Leave empty to use OpenAI API key' },
    ],
    testEndpoint: '/api/admin/test-api/whisper',
  },
  {
    id: 'stripe',
    name: 'Stripe (Payments)',
    description: 'Payment processing for subscriptions and one-time payments',
    icon: <CreditCard className="w-6 h-6" />,
    category: 'Business',
    fields: [
      { key: 'STRIPE_SECRET_KEY', label: 'Secret Key', type: 'password', placeholder: 'sk_live_... or sk_test_...', required: true },
      { key: 'STRIPE_PUBLISHABLE_KEY', label: 'Publishable Key', type: 'text', placeholder: 'pk_live_... or pk_test_...', required: true },
      { key: 'STRIPE_WEBHOOK_SECRET', label: 'Webhook Secret', type: 'password', placeholder: 'whsec_...', required: false },
    ],
    testEndpoint: '/api/admin/test-api/stripe',
  },
  {
    id: 'twilio',
    name: 'Twilio (SMS/Voice)',
    description: 'SMS and voice calls for phone authentication and notifications',
    icon: <Globe className="w-6 h-6" />,
    category: 'Communication',
    fields: [
      { key: 'TWILIO_ACCOUNT_SID', label: 'Account SID', type: 'text', placeholder: 'AC...', required: true },
      { key: 'TWILIO_AUTH_TOKEN', label: 'Auth Token', type: 'password', placeholder: 'Your auth token', required: true },
      { key: 'TWILIO_PHONE_NUMBER', label: 'Phone Number', type: 'text', placeholder: '+1234567890', required: true },
    ],
    testEndpoint: '/api/admin/test-api/twilio',
  },
  {
    id: 'google_oauth',
    name: 'Google OAuth',
    description: 'Enable "Continue with Google" authentication',
    icon: <Shield className="w-6 h-6" />,
    category: 'Authentication',
    fields: [
      { key: 'GOOGLE_CLIENT_ID', label: 'Client ID', type: 'text', placeholder: '...apps.googleusercontent.com', required: true },
      { key: 'GOOGLE_CLIENT_SECRET', label: 'Client Secret', type: 'password', placeholder: 'GOCSPX-...', required: true },
    ],
  },
  {
    id: 'apple_oauth',
    name: 'Apple OAuth',
    description: 'Enable "Continue with Apple" authentication',
    icon: <Shield className="w-6 h-6" />,
    category: 'Authentication',
    fields: [
      { key: 'APPLE_CLIENT_ID', label: 'Services ID', type: 'text', placeholder: 'com.yourapp.service', required: true },
      { key: 'APPLE_CLIENT_SECRET', label: 'Client Secret (JWT)', type: 'password', placeholder: 'Generated JWT', required: true },
      { key: 'APPLE_TEAM_ID', label: 'Team ID', type: 'text', placeholder: 'Your Team ID', required: true },
      { key: 'APPLE_KEY_ID', label: 'Key ID', type: 'text', placeholder: 'Your Key ID', required: true },
    ],
  },
  {
    id: 'microsoft_oauth',
    name: 'Microsoft OAuth',
    description: 'Enable "Continue with Microsoft" authentication',
    icon: <Shield className="w-6 h-6" />,
    category: 'Authentication',
    fields: [
      { key: 'MICROSOFT_CLIENT_ID', label: 'Application (client) ID', type: 'text', placeholder: 'UUID', required: true },
      { key: 'MICROSOFT_CLIENT_SECRET', label: 'Client Secret', type: 'password', placeholder: 'Your secret', required: true },
      { key: 'MICROSOFT_TENANT_ID', label: 'Tenant ID', type: 'text', placeholder: 'common or your tenant ID', required: false },
    ],
  },
  {
    id: 'github_oauth',
    name: 'GitHub OAuth',
    description: 'Enable "Continue with GitHub" authentication',
    icon: <Shield className="w-6 h-6" />,
    category: 'Authentication',
    fields: [
      { key: 'GITHUB_CLIENT_ID', label: 'Client ID', type: 'text', placeholder: 'Iv1.xxx', required: true },
      { key: 'GITHUB_CLIENT_SECRET', label: 'Client Secret', type: 'password', placeholder: 'Your secret', required: true },
    ],
  },
  {
    id: 'facebook_oauth',
    name: 'Facebook OAuth',
    description: 'Enable "Continue with Facebook" authentication',
    icon: <Shield className="w-6 h-6" />,
    category: 'Authentication',
    fields: [
      { key: 'FACEBOOK_CLIENT_ID', label: 'App ID', type: 'text', placeholder: 'Your App ID', required: true },
      { key: 'FACEBOOK_CLIENT_SECRET', label: 'App Secret', type: 'password', placeholder: 'Your App Secret', required: true },
    ],
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    description: 'Cloudflare API for DNS, Workers, and R2 storage management',
    icon: <Cloud className="w-6 h-6" />,
    category: 'Infrastructure',
    fields: [
      { key: 'CLOUDFLARE_API_TOKEN', label: 'API Token', type: 'password', placeholder: 'Your API token', required: true },
      { key: 'CLOUDFLARE_ACCOUNT_ID', label: 'Account ID', type: 'text', placeholder: 'Your account ID', required: true },
    ],
  },
  {
    id: 'sentry',
    name: 'Sentry (Error Tracking)',
    description: 'Error tracking and performance monitoring',
    icon: <AlertCircle className="w-6 h-6" />,
    category: 'Monitoring',
    fields: [
      { key: 'SENTRY_DSN', label: 'DSN', type: 'url', placeholder: 'https://xxx@xxx.ingest.sentry.io/xxx', required: true },
      { key: 'SENTRY_ORG', label: 'Organization Slug', type: 'text', placeholder: 'your-org', required: false },
      { key: 'SENTRY_PROJECT', label: 'Project Slug', type: 'text', placeholder: 'your-project', required: false },
    ],
  },
  {
    id: 'database',
    name: 'External Database',
    description: 'Connect to external PostgreSQL, MySQL, or MongoDB database',
    icon: <Database className="w-6 h-6" />,
    category: 'Infrastructure',
    fields: [
      { key: 'DATABASE_URL', label: 'Connection String', type: 'password', placeholder: 'postgresql://user:pass@host:5432/db', required: true },
      { 
        key: 'DATABASE_TYPE', 
        label: 'Database Type', 
        type: 'select', 
        options: [
          { value: 'postgresql', label: 'PostgreSQL' },
          { value: 'mysql', label: 'MySQL' },
          { value: 'mongodb', label: 'MongoDB' },
        ],
        required: true 
      },
    ],
    testEndpoint: '/api/admin/test-api/database',
  },
  {
    id: 'webhook',
    name: 'Webhook Endpoints',
    description: 'Configure webhook URLs for external integrations',
    icon: <Webhook className="w-6 h-6" />,
    category: 'Integration',
    fields: [
      { key: 'WEBHOOK_URL_DEPLOY', label: 'Deployment Webhook', type: 'url', placeholder: 'https://...', required: false },
      { key: 'WEBHOOK_URL_BUILD', label: 'Build Webhook', type: 'url', placeholder: 'https://...', required: false },
      { key: 'WEBHOOK_SECRET', label: 'Webhook Secret', type: 'password', placeholder: 'Shared secret for verification', required: false },
    ],
  },
];

const categories = ['AI & ML', 'Communication', 'Authentication', 'Business', 'Infrastructure', 'Monitoring', 'Integration'];

export default function ApiConfig() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('AI & ML');
  const [configs, setConfigs] = useState<Record<string, ConfigValue>>({});
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'admin') {
      setLocation('/dashboard');
      return;
    }
    loadConfigs();
  }, [user]);

  const loadConfigs = async () => {
    try {
      const response = await admin.getApiConfigs();
      setConfigs(response || {});
    } catch (error) {
      console.error('Failed to load configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (apiId: string, fieldKey: string, value: string) => {
    setConfigs(prev => ({
      ...prev,
      [apiId]: {
        ...(prev[apiId] || {}),
        [fieldKey]: value,
      },
    }));
  };

  const toggleFieldVisibility = (fieldKey: string) => {
    setVisibleFields(prev => ({
      ...prev,
      [fieldKey]: !prev[fieldKey],
    }));
  };

  const saveConfig = async (apiId: string) => {
    setSaving(apiId);
    try {
      await admin.saveApiConfig(apiId, configs[apiId] || {});
      toast.success('Configuration saved successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save configuration');
    } finally {
      setSaving(null);
    }
  };

  const testConnection = async (apiId: string, _testEndpoint?: string) => {
    setTesting(apiId);
    setTestResults(prev => ({ ...prev, [apiId]: { success: false, message: 'Testing...' } }));
    
    try {
      const provider = apiId.split('_')[0];
      const response = await admin.testApiConnection(provider, configs[apiId] || {});
      setTestResults(prev => ({
        ...prev,
        [apiId]: { success: response.success, message: response.message || 'Connection successful!' },
      }));
      toast.success('Connection test passed!');
    } catch (error: any) {
      setTestResults(prev => ({
        ...prev,
        [apiId]: { success: false, message: error.message || 'Connection test failed' },
      }));
      toast.error('Connection test failed');
    } finally {
      setTesting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const filteredConfigs = apiConfigs.filter(config => config.category === activeCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setLocation('/admin')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Key className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">API Configuration</h1>
                  <p className="text-sm text-gray-500">Manage API keys and integrations</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar - Categories */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-1 sticky top-24">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
                    activeCategory === category
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {category}
                </button>
              ))}
            </nav>
          </div>

          {/* Main content */}
          <div className="flex-1 space-y-6">
            {filteredConfigs.map(apiConfig => (
              <div
                key={apiConfig.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
              >
                {/* API Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600">
                      {apiConfig.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{apiConfig.name}</h3>
                      <p className="text-sm text-gray-500">{apiConfig.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {testResults[apiConfig.id] && (
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${
                        testResults[apiConfig.id].success
                          ? 'bg-green-50 text-green-700'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {testResults[apiConfig.id].success ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        {testResults[apiConfig.id].success ? 'Connected' : 'Failed'}
                      </div>
                    )}
                  </div>
                </div>

                {/* API Fields */}
                <div className="p-6 space-y-4">
                  {apiConfig.fields.map(field => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <div className="relative">
                        {field.type === 'select' ? (
                          <select
                            value={configs[apiConfig.id]?.[field.key] || ''}
                            onChange={(e) => handleFieldChange(apiConfig.id, field.key, e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                          >
                            <option value="">Select...</option>
                            {field.options?.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        ) : (
                          <>
                            <input
                              type={field.type === 'password' && !visibleFields[field.key] ? 'password' : 'text'}
                              value={configs[apiConfig.id]?.[field.key] || ''}
                              onChange={(e) => handleFieldChange(apiConfig.id, field.key, e.target.value)}
                              placeholder={field.placeholder}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-12"
                            />
                            {field.type === 'password' && (
                              <button
                                type="button"
                                onClick={() => toggleFieldVisibility(field.key)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                {visibleFields[field.key] ? (
                                  <EyeOff className="w-5 h-5" />
                                ) : (
                                  <Eye className="w-5 h-5" />
                                )}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                      {field.helpText && (
                        <p className="mt-1.5 text-sm text-gray-500">{field.helpText}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* API Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                  {apiConfig.testEndpoint && (
                    <button
                      onClick={() => testConnection(apiConfig.id, apiConfig.testEndpoint!)}
                      disabled={testing === apiConfig.id}
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      {testing === apiConfig.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      Test Connection
                    </button>
                  )}
                  <button
                    onClick={() => saveConfig(apiConfig.id)}
                    disabled={saving === apiConfig.id}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {saving === apiConfig.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
