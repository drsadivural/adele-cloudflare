import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Plug,
  Plus,
  Search,
  Check,
  X,
  ExternalLink,
  Settings,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Key,
  Globe,
  Database,
  Cloud,
  MessageSquare,
  Mail,
  Calendar,
  FileText,
  Code,
  GitBranch,
  Webhook,
  Zap,
} from 'lucide-react';
import { ResponsiveLayout, PageContainer, PageHeader, Card } from '@/components/layout/ResponsiveLayout';
import { Button, Input, Select, Badge, Modal, Alert, Tabs, Switch } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Connector {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  status: 'connected' | 'disconnected' | 'error';
  authType: 'oauth' | 'api_key' | 'credentials';
  config?: Record<string, any>;
  lastSyncAt?: Date;
  features: string[];
}

interface ConnectorCategory {
  id: string;
  name: string;
  icon: React.ElementType;
}

const categories: ConnectorCategory[] = [
  { id: 'all', name: 'All', icon: Plug },
  { id: 'cloud', name: 'Cloud Providers', icon: Cloud },
  { id: 'storage', name: 'Storage', icon: Database },
  { id: 'communication', name: 'Communication', icon: MessageSquare },
  { id: 'productivity', name: 'Productivity', icon: Calendar },
  { id: 'development', name: 'Development', icon: Code },
];

const availableConnectors: Omit<Connector, 'status' | 'config' | 'lastSyncAt'>[] = [
  // Cloud Providers
  {
    id: 'aws',
    name: 'Amazon Web Services',
    description: 'Connect to AWS services including S3, EC2, Lambda, and more',
    category: 'cloud',
    icon: '🔶',
    authType: 'credentials',
    features: ['S3 Storage', 'EC2 Instances', 'Lambda Functions', 'RDS Databases'],
  },
  {
    id: 'azure',
    name: 'Microsoft Azure',
    description: 'Connect to Azure services including Blob Storage, VMs, and Functions',
    category: 'cloud',
    icon: '🔷',
    authType: 'oauth',
    features: ['Blob Storage', 'Virtual Machines', 'Azure Functions', 'Cosmos DB'],
  },
  {
    id: 'gcp',
    name: 'Google Cloud Platform',
    description: 'Connect to GCP services including Cloud Storage, Compute Engine, and BigQuery',
    category: 'cloud',
    icon: '🔴',
    authType: 'credentials',
    features: ['Cloud Storage', 'Compute Engine', 'BigQuery', 'Cloud Functions'],
  },
  {
    id: 'oracle',
    name: 'Oracle Cloud',
    description: 'Connect to Oracle Cloud Infrastructure services',
    category: 'cloud',
    icon: '🟠',
    authType: 'credentials',
    features: ['Object Storage', 'Compute', 'Autonomous Database', 'Functions'],
  },
  // Storage
  {
    id: 'dropbox',
    name: 'Dropbox',
    description: 'Connect to Dropbox for file storage and sharing',
    category: 'storage',
    icon: '📦',
    authType: 'oauth',
    features: ['File Storage', 'File Sharing', 'Team Folders'],
  },
  {
    id: 'google_drive',
    name: 'Google Drive',
    description: 'Connect to Google Drive for file storage and collaboration',
    category: 'storage',
    icon: '📁',
    authType: 'oauth',
    features: ['File Storage', 'Google Docs', 'Shared Drives'],
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    description: 'Connect to Microsoft OneDrive for file storage',
    category: 'storage',
    icon: '☁️',
    authType: 'oauth',
    features: ['File Storage', 'SharePoint', 'Office Integration'],
  },
  // Communication
  {
    id: 'slack',
    name: 'Slack',
    description: 'Connect to Slack for messaging and notifications',
    category: 'communication',
    icon: '💬',
    authType: 'oauth',
    features: ['Send Messages', 'Channel Management', 'File Sharing'],
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'Connect to Discord for messaging and bot integration',
    category: 'communication',
    icon: '🎮',
    authType: 'api_key',
    features: ['Send Messages', 'Bot Commands', 'Webhooks'],
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    description: 'Connect to Microsoft Teams for collaboration',
    category: 'communication',
    icon: '👥',
    authType: 'oauth',
    features: ['Send Messages', 'Meetings', 'File Sharing'],
  },
  // Productivity
  {
    id: 'notion',
    name: 'Notion',
    description: 'Connect to Notion for notes and documentation',
    category: 'productivity',
    icon: '📝',
    authType: 'oauth',
    features: ['Pages', 'Databases', 'Blocks'],
  },
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    description: 'Connect to Google Calendar for scheduling',
    category: 'productivity',
    icon: '📅',
    authType: 'oauth',
    features: ['Events', 'Reminders', 'Scheduling'],
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'Connect to Jira for project management',
    category: 'productivity',
    icon: '🎯',
    authType: 'oauth',
    features: ['Issues', 'Projects', 'Sprints'],
  },
  // Development
  {
    id: 'github',
    name: 'GitHub',
    description: 'Connect to GitHub for code repositories and CI/CD',
    category: 'development',
    icon: '🐙',
    authType: 'oauth',
    features: ['Repositories', 'Issues', 'Pull Requests', 'Actions'],
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    description: 'Connect to GitLab for code repositories and DevOps',
    category: 'development',
    icon: '🦊',
    authType: 'oauth',
    features: ['Repositories', 'CI/CD', 'Issues'],
  },
  {
    id: 'vercel',
    name: 'Vercel',
    description: 'Connect to Vercel for deployment and hosting',
    category: 'development',
    icon: '▲',
    authType: 'api_key',
    features: ['Deployments', 'Domains', 'Edge Functions'],
  },
];

export default function Connectors() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  // Connection form state
  const [connectionForm, setConnectionForm] = useState<Record<string, string>>({});

  useEffect(() => {
    loadConnectors();
  }, []);

  const loadConnectors = async () => {
    try {
      // Mock connected connectors
      const connected: Connector[] = [
        {
          ...availableConnectors.find((c) => c.id === 'github')!,
          status: 'connected',
          lastSyncAt: new Date(),
          config: { username: 'user' },
        },
        {
          ...availableConnectors.find((c) => c.id === 'slack')!,
          status: 'connected',
          lastSyncAt: new Date(Date.now() - 3600000),
          config: { workspace: 'myworkspace' },
        },
        {
          ...availableConnectors.find((c) => c.id === 'aws')!,
          status: 'error',
          lastSyncAt: new Date(Date.now() - 86400000),
          config: { region: 'us-east-1' },
        },
      ];
      setConnectors(connected);
    } catch (error) {
      console.error('Failed to load connectors:', error);
    }
  };

  const handleConnect = async (connector: Omit<Connector, 'status' | 'config' | 'lastSyncAt'>) => {
    setSelectedConnector(connector as Connector);
    setConnectionForm({});
    setShowConnectModal(true);
  };

  const handleSubmitConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConnector) return;
    setLoading(true);
    try {
      if (selectedConnector.authType === 'oauth') {
        // Initiate OAuth flow
        const response = await api.connectors.initiateOAuth(selectedConnector.id);
        if (response.authUrl) {
          window.location.href = response.authUrl;
        }
      } else {
        // API key or credentials
        await api.connectors.connect(selectedConnector.id, connectionForm);
        toast.success(`${selectedConnector.name} connected successfully`);
        setShowConnectModal(false);
        loadConnectors();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to connect');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!selectedConnector) return;
    setLoading(true);
    try {
      await api.connectors.disconnect(selectedConnector.id);
      toast.success(`${selectedConnector.name} disconnected`);
      setShowDisconnectConfirm(false);
      setSelectedConnector(null);
      loadConnectors();
    } catch (error: any) {
      toast.error(error.message || 'Failed to disconnect');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (connector: Connector) => {
    try {
      await api.connectors.sync(connector.id);
      toast.success(`${connector.name} synced`);
      loadConnectors();
    } catch (error: any) {
      toast.error(error.message || 'Failed to sync');
    }
  };

  const getConnectorStatus = (connectorId: string): 'connected' | 'disconnected' | 'error' => {
    const connected = connectors.find((c) => c.id === connectorId);
    return connected?.status || 'disconnected';
  };

  const filteredConnectors = availableConnectors.filter((connector) => {
    const matchesCategory = activeCategory === 'all' || connector.category === activeCategory;
    const matchesSearch =
      searchQuery === '' ||
      connector.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      connector.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const connectedCount = connectors.filter((c) => c.status === 'connected').length;

  const renderConnectionForm = () => {
    if (!selectedConnector) return null;

    if (selectedConnector.authType === 'oauth') {
      return (
        <div className="text-center py-8">
          <Globe className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400 mb-4">
            You'll be redirected to {selectedConnector.name} to authorize access.
          </p>
          <Button onClick={handleSubmitConnection} loading={loading}>
            Continue with {selectedConnector.name}
          </Button>
        </div>
      );
    }

    if (selectedConnector.authType === 'api_key') {
      return (
        <form onSubmit={handleSubmitConnection} className="space-y-4">
          <Input
            label="API Key"
            type="password"
            value={connectionForm.apiKey || ''}
            onChange={(e) => setConnectionForm({ ...connectionForm, apiKey: e.target.value })}
            placeholder="Enter your API key"
            required
          />
          <Alert variant="info">
            You can find your API key in the {selectedConnector.name} dashboard settings.
          </Alert>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowConnectModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Connect
            </Button>
          </div>
        </form>
      );
    }

    // Credentials (AWS, GCP, etc.)
    if (selectedConnector.id === 'aws') {
      return (
        <form onSubmit={handleSubmitConnection} className="space-y-4">
          <Input
            label="Access Key ID"
            value={connectionForm.accessKeyId || ''}
            onChange={(e) => setConnectionForm({ ...connectionForm, accessKeyId: e.target.value })}
            placeholder="AKIAIOSFODNN7EXAMPLE"
            required
          />
          <Input
            label="Secret Access Key"
            type="password"
            value={connectionForm.secretAccessKey || ''}
            onChange={(e) => setConnectionForm({ ...connectionForm, secretAccessKey: e.target.value })}
            placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
            required
          />
          <Select
            label="Default Region"
            options={[
              { value: 'us-east-1', label: 'US East (N. Virginia)' },
              { value: 'us-west-2', label: 'US West (Oregon)' },
              { value: 'eu-west-1', label: 'EU (Ireland)' },
              { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
              { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
            ]}
            value={connectionForm.region || 'us-east-1'}
            onChange={(value) => setConnectionForm({ ...connectionForm, region: value })}
          />
          <Alert variant="warning">
            We recommend using IAM credentials with minimal required permissions.
          </Alert>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowConnectModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Connect
            </Button>
          </div>
        </form>
      );
    }

    if (selectedConnector.id === 'gcp' || selectedConnector.id === 'oracle') {
      return (
        <form onSubmit={handleSubmitConnection} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Service Account JSON
            </label>
            <textarea
              value={connectionForm.serviceAccount || ''}
              onChange={(e) => setConnectionForm({ ...connectionForm, serviceAccount: e.target.value })}
              placeholder='{"type": "service_account", ...}'
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px] font-mono text-sm"
              required
            />
          </div>
          <Alert variant="info">
            Paste your service account JSON key file contents here.
          </Alert>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowConnectModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Connect
            </Button>
          </div>
        </form>
      );
    }

    return null;
  };

  return (
    <ResponsiveLayout>
      <PageContainer>
        <PageHeader
          title="Connectors"
          description="Connect external services and tools to ADELE"
        />

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Check className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{connectedCount}</p>
                <p className="text-sm text-zinc-400">Connected</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Plug className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{availableConnectors.length}</p>
                <p className="text-sm text-zinc-400">Available</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {connectors.filter((c) => c.status === 'error').length}
                </p>
                <p className="text-sm text-zinc-400">Errors</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search connectors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors',
                  activeCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                )}
              >
                <category.icon className="w-4 h-4" />
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Connectors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredConnectors.map((connector) => {
            const status = getConnectorStatus(connector.id);
            const connectedData = connectors.find((c) => c.id === connector.id);

            return (
              <Card key={connector.id}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{connector.icon}</span>
                    <div>
                      <h3 className="font-medium text-white">{connector.name}</h3>
                      <Badge
                        variant={
                          status === 'connected'
                            ? 'success'
                            : status === 'error'
                            ? 'error'
                            : 'default'
                        }
                        size="sm"
                      >
                        {status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-zinc-400 mb-4">{connector.description}</p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {connector.features.slice(0, 3).map((feature) => (
                    <Badge key={feature} size="sm" variant="default">
                      {feature}
                    </Badge>
                  ))}
                  {connector.features.length > 3 && (
                    <Badge size="sm" variant="default">
                      +{connector.features.length - 3}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  {status === 'connected' || status === 'error' ? (
                    <>
                      <span className="text-xs text-zinc-500">
                        {connectedData?.lastSyncAt
                          ? `Synced ${connectedData.lastSyncAt.toLocaleString()}`
                          : 'Never synced'}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSync(connectedData!)}
                          icon={<RefreshCw className="w-4 h-4" />}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedConnector(connectedData!);
                            setShowConfigModal(true);
                          }}
                          icon={<Settings className="w-4 h-4" />}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedConnector(connectedData!);
                            setShowDisconnectConfirm(true);
                          }}
                          icon={<X className="w-4 h-4 text-red-400" />}
                        />
                      </div>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleConnect(connector)}
                      className="w-full"
                    >
                      Connect
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Connect Modal */}
        <Modal
          isOpen={showConnectModal}
          onClose={() => setShowConnectModal(false)}
          title={`Connect ${selectedConnector?.name}`}
          size="lg"
        >
          {renderConnectionForm()}
        </Modal>

        {/* Config Modal */}
        <Modal
          isOpen={showConfigModal}
          onClose={() => setShowConfigModal(false)}
          title={`${selectedConnector?.name} Settings`}
        >
          <div className="space-y-4">
            <div className="p-4 bg-zinc-800 rounded-xl">
              <h4 className="font-medium text-white mb-2">Connection Details</h4>
              {selectedConnector?.config && (
                <div className="space-y-2 text-sm">
                  {Object.entries(selectedConnector.config).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-zinc-400 capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="text-white">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-zinc-800 rounded-xl">
              <h4 className="font-medium text-white mb-2">Available Features</h4>
              <div className="flex flex-wrap gap-2">
                {selectedConnector?.features.map((feature) => (
                  <Badge key={feature}>{feature}</Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowConfigModal(false)}>
                Close
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setShowConfigModal(false);
                  setShowDisconnectConfirm(true);
                }}
              >
                Disconnect
              </Button>
            </div>
          </div>
        </Modal>

        {/* Disconnect Confirmation */}
        <Modal
          isOpen={showDisconnectConfirm}
          onClose={() => setShowDisconnectConfirm(false)}
          title="Disconnect Connector"
        >
          <div className="space-y-4">
            <Alert variant="warning">
              Are you sure you want to disconnect {selectedConnector?.name}? This will remove all
              associated credentials and stop any automated tasks using this connector.
            </Alert>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDisconnectConfirm(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDisconnect} loading={loading}>
                Disconnect
              </Button>
            </div>
          </div>
        </Modal>
      </PageContainer>
    </ResponsiveLayout>
  );
}
