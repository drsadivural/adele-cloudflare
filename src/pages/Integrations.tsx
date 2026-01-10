import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Puzzle,
  Search,
  Star,
  Download,
  Check,
  ExternalLink,
  Settings,
  Trash2,
  Plus,
  Filter,
  TrendingUp,
  Clock,
  Users,
  Code,
  Zap,
  Shield,
  BookOpen,
} from 'lucide-react';
import { ResponsiveLayout, PageContainer, PageHeader, Card } from '@/components/layout/ResponsiveLayout';
import { Button, Input, Select, Badge, Modal, Alert, Tabs, Switch } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Integration {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  category: string;
  author: string;
  version: string;
  icon: string;
  rating: number;
  downloads: number;
  installed: boolean;
  enabled?: boolean;
  verified: boolean;
  features: string[];
  permissions: string[];
  lastUpdated: Date;
  config?: Record<string, any>;
}

interface IntegrationCategory {
  id: string;
  name: string;
  count: number;
}

const categories: IntegrationCategory[] = [
  { id: 'all', name: 'All', count: 0 },
  { id: 'ai', name: 'AI & ML', count: 5 },
  { id: 'automation', name: 'Automation', count: 4 },
  { id: 'analytics', name: 'Analytics', count: 3 },
  { id: 'security', name: 'Security', count: 2 },
  { id: 'developer', name: 'Developer Tools', count: 4 },
  { id: 'communication', name: 'Communication', count: 3 },
];

const availableIntegrations: Integration[] = [
  // AI & ML
  {
    id: 'openai-gpt4',
    name: 'OpenAI GPT-4',
    description: 'Access GPT-4 and GPT-4 Turbo models for advanced AI capabilities',
    longDescription: 'Integrate OpenAI\'s most advanced language models directly into ADELE. Use GPT-4 for complex reasoning, code generation, and creative tasks.',
    category: 'ai',
    author: 'ADELE Team',
    version: '2.1.0',
    icon: '🤖',
    rating: 4.9,
    downloads: 15420,
    installed: true,
    enabled: true,
    verified: true,
    features: ['GPT-4 Access', 'GPT-4 Turbo', 'Vision Support', 'Function Calling'],
    permissions: ['api_calls', 'model_selection'],
    lastUpdated: new Date(Date.now() - 86400000 * 7),
  },
  {
    id: 'anthropic-claude',
    name: 'Anthropic Claude',
    description: 'Use Claude 3 models for safe and helpful AI assistance',
    category: 'ai',
    author: 'ADELE Team',
    version: '1.5.0',
    icon: '🧠',
    rating: 4.8,
    downloads: 8930,
    installed: true,
    enabled: true,
    verified: true,
    features: ['Claude 3 Opus', 'Claude 3 Sonnet', 'Claude 3 Haiku', 'Long Context'],
    permissions: ['api_calls', 'model_selection'],
    lastUpdated: new Date(Date.now() - 86400000 * 3),
  },
  {
    id: 'stable-diffusion',
    name: 'Stable Diffusion',
    description: 'Generate images with Stable Diffusion XL',
    category: 'ai',
    author: 'Community',
    version: '1.2.0',
    icon: '🎨',
    rating: 4.6,
    downloads: 5670,
    installed: false,
    verified: true,
    features: ['SDXL', 'Image Generation', 'Inpainting', 'Upscaling'],
    permissions: ['api_calls', 'file_write'],
    lastUpdated: new Date(Date.now() - 86400000 * 14),
  },
  // Automation
  {
    id: 'zapier',
    name: 'Zapier Integration',
    description: 'Connect ADELE to 5000+ apps via Zapier',
    category: 'automation',
    author: 'ADELE Team',
    version: '1.0.0',
    icon: '⚡',
    rating: 4.7,
    downloads: 3240,
    installed: false,
    verified: true,
    features: ['Triggers', 'Actions', 'Multi-step Zaps'],
    permissions: ['webhooks', 'api_calls'],
    lastUpdated: new Date(Date.now() - 86400000 * 30),
  },
  {
    id: 'n8n',
    name: 'n8n Workflows',
    description: 'Build complex workflows with n8n',
    category: 'automation',
    author: 'Community',
    version: '0.9.0',
    icon: '🔄',
    rating: 4.5,
    downloads: 1890,
    installed: false,
    verified: false,
    features: ['Custom Workflows', 'Self-hosted', 'API Integration'],
    permissions: ['webhooks', 'api_calls'],
    lastUpdated: new Date(Date.now() - 86400000 * 45),
  },
  // Analytics
  {
    id: 'analytics-dashboard',
    name: 'Advanced Analytics',
    description: 'Deep insights into your ADELE usage patterns',
    category: 'analytics',
    author: 'ADELE Team',
    version: '2.0.0',
    icon: '📊',
    rating: 4.4,
    downloads: 4560,
    installed: true,
    enabled: false,
    verified: true,
    features: ['Usage Metrics', 'Cost Analysis', 'Performance Tracking'],
    permissions: ['read_usage', 'read_projects'],
    lastUpdated: new Date(Date.now() - 86400000 * 10),
  },
  // Security
  {
    id: 'audit-logger',
    name: 'Audit Logger Pro',
    description: 'Enterprise-grade audit logging and compliance',
    category: 'security',
    author: 'ADELE Team',
    version: '1.3.0',
    icon: '🔒',
    rating: 4.8,
    downloads: 2340,
    installed: false,
    verified: true,
    features: ['Detailed Logs', 'Export', 'Compliance Reports', 'Alerts'],
    permissions: ['read_all', 'write_logs'],
    lastUpdated: new Date(Date.now() - 86400000 * 20),
  },
  // Developer Tools
  {
    id: 'code-review',
    name: 'AI Code Review',
    description: 'Automated code review with AI suggestions',
    category: 'developer',
    author: 'Community',
    version: '1.1.0',
    icon: '👀',
    rating: 4.6,
    downloads: 6780,
    installed: false,
    verified: true,
    features: ['Code Analysis', 'Security Scan', 'Best Practices', 'Auto-fix'],
    permissions: ['read_projects', 'api_calls'],
    lastUpdated: new Date(Date.now() - 86400000 * 5),
  },
  {
    id: 'git-assistant',
    name: 'Git Assistant',
    description: 'AI-powered Git operations and commit messages',
    category: 'developer',
    author: 'ADELE Team',
    version: '1.4.0',
    icon: '🌿',
    rating: 4.7,
    downloads: 4320,
    installed: true,
    enabled: true,
    verified: true,
    features: ['Smart Commits', 'Branch Management', 'PR Descriptions'],
    permissions: ['git_operations', 'api_calls'],
    lastUpdated: new Date(Date.now() - 86400000 * 8),
  },
  // Communication
  {
    id: 'slack-bot',
    name: 'Slack Bot',
    description: 'Interact with ADELE directly from Slack',
    category: 'communication',
    author: 'ADELE Team',
    version: '1.2.0',
    icon: '💬',
    rating: 4.5,
    downloads: 3890,
    installed: false,
    verified: true,
    features: ['Chat Commands', 'Notifications', 'File Sharing'],
    permissions: ['slack_integration', 'notifications'],
    lastUpdated: new Date(Date.now() - 86400000 * 15),
  },
];

export default function Integrations() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('browse');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [loading, setLoading] = useState(false);
  const [integrations, setIntegrations] = useState<Integration[]>(availableIntegrations);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showUninstallConfirm, setShowUninstallConfirm] = useState(false);

  const installedIntegrations = integrations.filter((i) => i.installed);

  const handleInstall = async (integration: Integration) => {
    setLoading(true);
    try {
      await api.integrations.install(integration.id);
      setIntegrations(
        integrations.map((i) =>
          i.id === integration.id ? { ...i, installed: true, enabled: true } : i
        )
      );
      toast.success(`${integration.name} installed successfully`);
      setShowDetailModal(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to install integration');
    } finally {
      setLoading(false);
    }
  };

  const handleUninstall = async () => {
    if (!selectedIntegration) return;
    setLoading(true);
    try {
      await api.integrations.uninstall(selectedIntegration.id);
      setIntegrations(
        integrations.map((i) =>
          i.id === selectedIntegration.id ? { ...i, installed: false, enabled: false } : i
        )
      );
      toast.success(`${selectedIntegration.name} uninstalled`);
      setShowUninstallConfirm(false);
      setSelectedIntegration(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to uninstall integration');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnabled = async (integration: Integration) => {
    try {
      await api.integrations.toggle(integration.id, !integration.enabled);
      setIntegrations(
        integrations.map((i) =>
          i.id === integration.id ? { ...i, enabled: !i.enabled } : i
        )
      );
      toast.success(`${integration.name} ${integration.enabled ? 'disabled' : 'enabled'}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update integration');
    }
  };

  const filteredIntegrations = integrations.filter((integration) => {
    const matchesCategory = activeCategory === 'all' || integration.category === activeCategory;
    const matchesSearch =
      searchQuery === '' ||
      integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'browse' || (activeTab === 'installed' && integration.installed);
    return matchesCategory && matchesSearch && matchesTab;
  });

  const sortedIntegrations = [...filteredIntegrations].sort((a, b) => {
    if (sortBy === 'popular') return b.downloads - a.downloads;
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'recent') return b.lastUpdated.getTime() - a.lastUpdated.getTime();
    return 0;
  });

  const tabs = [
    { id: 'browse', label: 'Browse', icon: <Search className="w-4 h-4" /> },
    { id: 'installed', label: `Installed (${installedIntegrations.length})`, icon: <Download className="w-4 h-4" /> },
  ];

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              'w-4 h-4',
              star <= Math.floor(rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-zinc-600'
            )}
          />
        ))}
        <span className="text-sm text-zinc-400 ml-1">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <ResponsiveLayout>
      <PageContainer>
        <PageHeader
          title="Integrations"
          description="Extend ADELE's capabilities with integrations"
        />

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

        {/* Search and Filter */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search integrations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <Select
              options={[
                { value: 'popular', label: 'Most Popular' },
                { value: 'rating', label: 'Highest Rated' },
                { value: 'recent', label: 'Recently Updated' },
              ]}
              value={sortBy}
              onChange={setSortBy}
              className="w-40"
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Categories Sidebar */}
          <div className="lg:w-48 flex-shrink-0">
            <div className="space-y-1">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
                    activeCategory === category.id
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                  )}
                >
                  <span>{category.name}</span>
                  {category.id !== 'all' && (
                    <span className="text-xs text-zinc-500">{category.count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Integrations Grid */}
          <div className="flex-1">
            {sortedIntegrations.length === 0 ? (
              <Card className="text-center py-12">
                <Puzzle className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Integrations Found</h3>
                <p className="text-zinc-400">
                  Try adjusting your search or filter criteria
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sortedIntegrations.map((integration) => (
                  <Card
                    key={integration.id}
                    className="cursor-pointer hover:border-zinc-700 transition-colors"
                    onClick={() => {
                      setSelectedIntegration(integration);
                      setShowDetailModal(true);
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-4xl">{integration.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-white truncate">{integration.name}</h3>
                          {integration.verified && (
                            <Shield className="w-4 h-4 text-blue-400 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-zinc-400 line-clamp-2 mb-2">
                          {integration.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-zinc-500">
                          {renderStars(integration.rating)}
                          <span className="flex items-center gap-1">
                            <Download className="w-3 h-3" />
                            {integration.downloads.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {integration.installed && (
                        <div onClick={(e) => e.stopPropagation()}>
                          <Switch
                            checked={integration.enabled || false}
                            onChange={() => handleToggleEnabled(integration)}
                          />
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detail Modal */}
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={selectedIntegration?.name || ''}
          size="lg"
        >
          {selectedIntegration && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <span className="text-5xl">{selectedIntegration.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold text-white">{selectedIntegration.name}</h3>
                    {selectedIntegration.verified && (
                      <Badge variant="info" size="sm">
                        <Shield className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-zinc-400 mb-2">by {selectedIntegration.author}</p>
                  <div className="flex items-center gap-4">
                    {renderStars(selectedIntegration.rating)}
                    <span className="text-sm text-zinc-500">
                      {selectedIntegration.downloads.toLocaleString()} downloads
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-zinc-300">
                {selectedIntegration.longDescription || selectedIntegration.description}
              </p>

              <div>
                <h4 className="font-medium text-white mb-3">Features</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedIntegration.features.map((feature) => (
                    <Badge key={feature}>{feature}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-white mb-3">Required Permissions</h4>
                <div className="space-y-2">
                  {selectedIntegration.permissions.map((permission) => (
                    <div key={permission} className="flex items-center gap-2 text-sm text-zinc-400">
                      <Check className="w-4 h-4 text-green-400" />
                      <span className="capitalize">{permission.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-zinc-500">
                <span>Version {selectedIntegration.version}</span>
                <span>Updated {selectedIntegration.lastUpdated.toLocaleDateString()}</span>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                {selectedIntegration.installed ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowDetailModal(false);
                        setShowConfigModal(true);
                      }}
                      icon={<Settings className="w-4 h-4" />}
                    >
                      Configure
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => {
                        setShowDetailModal(false);
                        setShowUninstallConfirm(true);
                      }}
                      icon={<Trash2 className="w-4 h-4" />}
                    >
                      Uninstall
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => handleInstall(selectedIntegration)}
                    loading={loading}
                    icon={<Download className="w-4 h-4" />}
                  >
                    Install
                  </Button>
                )}
              </div>
            </div>
          )}
        </Modal>

        {/* Config Modal */}
        <Modal
          isOpen={showConfigModal}
          onClose={() => setShowConfigModal(false)}
          title={`Configure ${selectedIntegration?.name}`}
        >
          <div className="space-y-4">
            <Alert variant="info">
              Configuration options for this integration will appear here.
            </Alert>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowConfigModal(false)}>
                Close
              </Button>
              <Button>Save Configuration</Button>
            </div>
          </div>
        </Modal>

        {/* Uninstall Confirmation */}
        <Modal
          isOpen={showUninstallConfirm}
          onClose={() => setShowUninstallConfirm(false)}
          title="Uninstall Integration"
        >
          <div className="space-y-4">
            <Alert variant="warning">
              Are you sure you want to uninstall {selectedIntegration?.name}? This will remove all
              associated settings and data.
            </Alert>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowUninstallConfirm(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleUninstall} loading={loading}>
                Uninstall
              </Button>
            </div>
          </div>
        </Modal>
      </PageContainer>
    </ResponsiveLayout>
  );
}
