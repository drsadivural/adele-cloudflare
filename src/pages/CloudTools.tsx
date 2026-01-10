import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Cloud,
  Server,
  Database,
  HardDrive,
  Cpu,
  Network,
  Shield,
  Key,
  RefreshCw,
  Plus,
  Trash2,
  Settings,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity,
  BarChart3,
  Layers,
  Globe,
  Lock,
  Terminal,
  Play,
  Square,
  Eye,
  EyeOff,
  Copy,
} from 'lucide-react';
import { ResponsiveLayout, PageContainer, PageHeader, Card } from '@/components/layout/ResponsiveLayout';
import { Button, Input, Select, Textarea, Badge, Modal, Alert, Tabs, Switch, Progress } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface CloudAccount {
  id: number;
  provider: 'aws' | 'azure' | 'gcp' | 'oracle';
  name: string;
  accountId: string;
  region: string;
  status: 'connected' | 'error' | 'syncing';
  lastSyncAt?: Date;
  resources: {
    compute: number;
    storage: number;
    databases: number;
    functions: number;
  };
}

interface CloudResource {
  id: string;
  accountId: number;
  type: 'ec2' | 'rds' | 's3' | 'lambda' | 'vm' | 'blob' | 'function' | 'compute' | 'storage' | 'database';
  name: string;
  status: 'running' | 'stopped' | 'available' | 'error';
  region: string;
  details: Record<string, any>;
  cost?: number;
  createdAt: Date;
}

interface ProviderConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  regions: { value: string; label: string }[];
  services: { id: string; name: string; icon: React.ElementType }[];
}

const providers: ProviderConfig[] = [
  {
    id: 'aws',
    name: 'Amazon Web Services',
    icon: '🔶',
    color: 'orange',
    regions: [
      { value: 'us-east-1', label: 'US East (N. Virginia)' },
      { value: 'us-west-2', label: 'US West (Oregon)' },
      { value: 'eu-west-1', label: 'EU (Ireland)' },
      { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
      { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
    ],
    services: [
      { id: 'ec2', name: 'EC2 Instances', icon: Server },
      { id: 's3', name: 'S3 Buckets', icon: HardDrive },
      { id: 'rds', name: 'RDS Databases', icon: Database },
      { id: 'lambda', name: 'Lambda Functions', icon: Cpu },
    ],
  },
  {
    id: 'azure',
    name: 'Microsoft Azure',
    icon: '🔷',
    color: 'blue',
    regions: [
      { value: 'eastus', label: 'East US' },
      { value: 'westus2', label: 'West US 2' },
      { value: 'westeurope', label: 'West Europe' },
      { value: 'southeastasia', label: 'Southeast Asia' },
      { value: 'japaneast', label: 'Japan East' },
    ],
    services: [
      { id: 'vm', name: 'Virtual Machines', icon: Server },
      { id: 'blob', name: 'Blob Storage', icon: HardDrive },
      { id: 'sql', name: 'SQL Databases', icon: Database },
      { id: 'function', name: 'Functions', icon: Cpu },
    ],
  },
  {
    id: 'gcp',
    name: 'Google Cloud Platform',
    icon: '🔴',
    color: 'red',
    regions: [
      { value: 'us-central1', label: 'US Central (Iowa)' },
      { value: 'us-east1', label: 'US East (South Carolina)' },
      { value: 'europe-west1', label: 'Europe West (Belgium)' },
      { value: 'asia-east1', label: 'Asia East (Taiwan)' },
      { value: 'asia-northeast1', label: 'Asia Northeast (Tokyo)' },
    ],
    services: [
      { id: 'compute', name: 'Compute Engine', icon: Server },
      { id: 'storage', name: 'Cloud Storage', icon: HardDrive },
      { id: 'sql', name: 'Cloud SQL', icon: Database },
      { id: 'function', name: 'Cloud Functions', icon: Cpu },
    ],
  },
  {
    id: 'oracle',
    name: 'Oracle Cloud',
    icon: '🟠',
    color: 'orange',
    regions: [
      { value: 'us-ashburn-1', label: 'US East (Ashburn)' },
      { value: 'us-phoenix-1', label: 'US West (Phoenix)' },
      { value: 'eu-frankfurt-1', label: 'Germany Central (Frankfurt)' },
      { value: 'ap-tokyo-1', label: 'Japan East (Tokyo)' },
      { value: 'ap-sydney-1', label: 'Australia East (Sydney)' },
    ],
    services: [
      { id: 'compute', name: 'Compute Instances', icon: Server },
      { id: 'storage', name: 'Object Storage', icon: HardDrive },
      { id: 'database', name: 'Autonomous Database', icon: Database },
      { id: 'function', name: 'Functions', icon: Cpu },
    ],
  },
];

export default function CloudTools() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('accounts');
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<CloudAccount[]>([]);
  const [resources, setResources] = useState<CloudResource[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<CloudAccount | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>('aws');
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [selectedResource, setSelectedResource] = useState<CloudResource | null>(null);
  const [showCredentials, setShowCredentials] = useState(false);

  const [connectForm, setConnectForm] = useState({
    name: '',
    accessKeyId: '',
    secretAccessKey: '',
    region: '',
    serviceAccount: '',
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      loadResources(selectedAccount.id);
    }
  }, [selectedAccount]);

  const loadAccounts = async () => {
    try {
      // Mock data
      setAccounts([
        {
          id: 1,
          provider: 'aws',
          name: 'Production AWS',
          accountId: '123456789012',
          region: 'us-east-1',
          status: 'connected',
          lastSyncAt: new Date(),
          resources: { compute: 5, storage: 12, databases: 3, functions: 8 },
        },
        {
          id: 2,
          provider: 'azure',
          name: 'Development Azure',
          accountId: 'dev-subscription',
          region: 'eastus',
          status: 'connected',
          lastSyncAt: new Date(Date.now() - 3600000),
          resources: { compute: 2, storage: 5, databases: 1, functions: 3 },
        },
        {
          id: 3,
          provider: 'oracle',
          name: 'Oracle Production',
          accountId: 'ocid1.tenancy.oc1...',
          region: 'ap-tokyo-1',
          status: 'error',
          lastSyncAt: new Date(Date.now() - 86400000),
          resources: { compute: 0, storage: 0, databases: 0, functions: 0 },
        },
      ]);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  };

  const loadResources = async (accountId: number) => {
    setLoading(true);
    try {
      // Mock resources
      setResources([
        {
          id: 'i-1234567890',
          accountId,
          type: 'ec2',
          name: 'web-server-1',
          status: 'running',
          region: 'us-east-1',
          details: { instanceType: 't3.medium', publicIp: '54.123.45.67' },
          cost: 45.50,
          createdAt: new Date(Date.now() - 86400000 * 30),
        },
        {
          id: 'i-0987654321',
          accountId,
          type: 'ec2',
          name: 'api-server-1',
          status: 'running',
          region: 'us-east-1',
          details: { instanceType: 't3.large', publicIp: '54.123.45.68' },
          cost: 78.20,
          createdAt: new Date(Date.now() - 86400000 * 60),
        },
        {
          id: 'my-bucket-prod',
          accountId,
          type: 's3',
          name: 'my-bucket-prod',
          status: 'available',
          region: 'us-east-1',
          details: { size: '125 GB', objects: 15420 },
          cost: 3.25,
          createdAt: new Date(Date.now() - 86400000 * 90),
        },
        {
          id: 'db-prod-1',
          accountId,
          type: 'rds',
          name: 'production-db',
          status: 'running',
          region: 'us-east-1',
          details: { engine: 'PostgreSQL 14', instanceClass: 'db.t3.medium' },
          cost: 125.00,
          createdAt: new Date(Date.now() - 86400000 * 120),
        },
      ]);
    } catch (error) {
      console.error('Failed to load resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const provider = providers.find((p) => p.id === selectedProvider);
      
      if (selectedProvider === 'aws') {
        await api.cloud.connect({
          provider: selectedProvider,
          name: connectForm.name,
          credentials: {
            accessKeyId: connectForm.accessKeyId,
            secretAccessKey: connectForm.secretAccessKey,
          },
          region: connectForm.region,
        });
      } else if (selectedProvider === 'gcp' || selectedProvider === 'oracle') {
        await api.cloud.connect({
          provider: selectedProvider,
          name: connectForm.name,
          credentials: {
            serviceAccount: connectForm.serviceAccount,
          },
          region: connectForm.region,
        });
      } else {
        // Azure uses OAuth
        const response = await api.cloud.initiateOAuth(selectedProvider);
        if (response.authUrl) {
          window.location.href = response.authUrl;
          return;
        }
      }

      toast.success(`${provider?.name} account connected`);
      setShowConnectModal(false);
      resetConnectForm();
      loadAccounts();
    } catch (error: any) {
      toast.error(error.message || 'Failed to connect account');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (account: CloudAccount) => {
    try {
      await api.cloud.disconnect(account.id);
      toast.success(`${account.name} disconnected`);
      setAccounts(accounts.filter((a) => a.id !== account.id));
      if (selectedAccount?.id === account.id) {
        setSelectedAccount(null);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to disconnect account');
    }
  };

  const handleSync = async (account: CloudAccount) => {
    try {
      setAccounts(accounts.map((a) =>
        a.id === account.id ? { ...a, status: 'syncing' } : a
      ));
      await api.cloud.sync(account.id);
      toast.success(`${account.name} synced`);
      loadAccounts();
      if (selectedAccount?.id === account.id) {
        loadResources(account.id);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to sync account');
    }
  };

  const handleResourceAction = async (resource: CloudResource, action: 'start' | 'stop' | 'restart') => {
    try {
      await api.cloud.resourceAction(resource.id, action);
      toast.success(`${resource.name} ${action}ed`);
      if (selectedAccount) {
        loadResources(selectedAccount.id);
      }
    } catch (error: any) {
      toast.error(error.message || `Failed to ${action} resource`);
    }
  };

  const resetConnectForm = () => {
    setConnectForm({
      name: '',
      accessKeyId: '',
      secretAccessKey: '',
      region: '',
      serviceAccount: '',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': case 'running': case 'available': return 'success';
      case 'syncing': return 'info';
      case 'stopped': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'ec2': case 'vm': case 'compute': return Server;
      case 's3': case 'blob': case 'storage': return HardDrive;
      case 'rds': case 'sql': case 'database': return Database;
      case 'lambda': case 'function': return Cpu;
      default: return Cloud;
    }
  };

  const totalCost = resources.reduce((sum, r) => sum + (r.cost || 0), 0);

  const tabs = [
    { id: 'accounts', label: 'Accounts', icon: <Cloud className="w-4 h-4" /> },
    { id: 'resources', label: 'Resources', icon: <Server className="w-4 h-4" /> },
    { id: 'costs', label: 'Costs', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <ResponsiveLayout>
      <PageContainer>
        <PageHeader
          title="Cloud Tools"
          description="Manage AWS, Azure, GCP, and Oracle Cloud resources"
          actions={
            <Button onClick={() => setShowConnectModal(true)} icon={<Plus className="w-4 h-4" />}>
              Connect Account
            </Button>
          }
        />

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

        {/* Accounts Tab */}
        {activeTab === 'accounts' && (
          <div className="space-y-6">
            {/* Provider Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {providers.map((provider) => {
                const providerAccounts = accounts.filter((a) => a.provider === provider.id);
                const connected = providerAccounts.filter((a) => a.status === 'connected').length;
                return (
                  <Card
                    key={provider.id}
                    className={cn(
                      'cursor-pointer transition-all hover:border-zinc-600',
                      selectedProvider === provider.id && 'border-blue-500'
                    )}
                    onClick={() => setSelectedProvider(provider.id)}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{provider.icon}</span>
                      <div>
                        <h3 className="font-medium text-white">{provider.name}</h3>
                        <p className="text-sm text-zinc-400">
                          {connected} connected
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Account List */}
            <Card>
              <h3 className="text-lg font-semibold text-white mb-4">Connected Accounts</h3>
              {accounts.length === 0 ? (
                <div className="text-center py-8">
                  <Cloud className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                  <p className="text-zinc-400">No cloud accounts connected</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {accounts.map((account) => {
                    const provider = providers.find((p) => p.id === account.provider);
                    return (
                      <div
                        key={account.id}
                        className={cn(
                          'flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl cursor-pointer transition-colors',
                          selectedAccount?.id === account.id && 'ring-2 ring-blue-500'
                        )}
                        onClick={() => setSelectedAccount(account)}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-2xl">{provider?.icon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-white">{account.name}</h4>
                              <Badge variant={getStatusColor(account.status) as any} size="sm">
                                {account.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-zinc-400">
                              {account.accountId} • {account.region}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right text-sm">
                            <p className="text-zinc-400">Resources</p>
                            <p className="text-white">
                              {account.resources.compute + account.resources.storage + account.resources.databases + account.resources.functions}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSync(account);
                              }}
                              icon={<RefreshCw className={cn('w-4 h-4', account.status === 'syncing' && 'animate-spin')} />}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDisconnect(account);
                              }}
                              icon={<Trash2 className="w-4 h-4 text-red-400" />}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <div className="space-y-6">
            {!selectedAccount ? (
              <Card className="text-center py-12">
                <Server className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Select an Account</h3>
                <p className="text-zinc-400">
                  Select a cloud account from the Accounts tab to view resources
                </p>
              </Card>
            ) : (
              <>
                {/* Resource Summary */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <Server className="w-8 h-8 text-blue-400" />
                      <div>
                        <p className="text-2xl font-bold text-white">{selectedAccount.resources.compute}</p>
                        <p className="text-sm text-zinc-400">Compute</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <HardDrive className="w-8 h-8 text-green-400" />
                      <div>
                        <p className="text-2xl font-bold text-white">{selectedAccount.resources.storage}</p>
                        <p className="text-sm text-zinc-400">Storage</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <Database className="w-8 h-8 text-purple-400" />
                      <div>
                        <p className="text-2xl font-bold text-white">{selectedAccount.resources.databases}</p>
                        <p className="text-sm text-zinc-400">Databases</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <Cpu className="w-8 h-8 text-orange-400" />
                      <div>
                        <p className="text-2xl font-bold text-white">{selectedAccount.resources.functions}</p>
                        <p className="text-sm text-zinc-400">Functions</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Resource List */}
                <Card>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Resources in {selectedAccount.name}
                  </h3>
                  {loading ? (
                    <div className="text-center py-8">
                      <RefreshCw className="w-8 h-8 text-zinc-600 mx-auto mb-4 animate-spin" />
                      <p className="text-zinc-400">Loading resources...</p>
                    </div>
                  ) : resources.length === 0 ? (
                    <div className="text-center py-8">
                      <Layers className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                      <p className="text-zinc-400">No resources found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {resources.map((resource) => {
                        const Icon = getResourceIcon(resource.type);
                        return (
                          <div
                            key={resource.id}
                            className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl"
                          >
                            <div className="flex items-center gap-4">
                              <div className="p-2 bg-zinc-700 rounded-lg">
                                <Icon className="w-5 h-5 text-zinc-300" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-white">{resource.name}</h4>
                                  <Badge variant={getStatusColor(resource.status) as any} size="sm">
                                    {resource.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-zinc-400">
                                  {resource.type.toUpperCase()} • {resource.region}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              {resource.cost && (
                                <div className="text-right">
                                  <p className="text-sm text-zinc-400">Est. Cost</p>
                                  <p className="text-white">${resource.cost.toFixed(2)}/mo</p>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                {(resource.type === 'ec2' || resource.type === 'vm' || resource.type === 'compute') && (
                                  <>
                                    {resource.status === 'running' ? (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleResourceAction(resource, 'stop')}
                                        icon={<Square className="w-4 h-4" />}
                                      />
                                    ) : (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleResourceAction(resource, 'start')}
                                        icon={<Play className="w-4 h-4" />}
                                      />
                                    )}
                                  </>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedResource(resource);
                                    setShowResourceModal(true);
                                  }}
                                  icon={<Eye className="w-4 h-4" />}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </>
            )}
          </div>
        )}

        {/* Costs Tab */}
        {activeTab === 'costs' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="p-6">
                <h3 className="text-sm text-zinc-400 mb-2">Total Monthly Cost</h3>
                <p className="text-3xl font-bold text-white">${totalCost.toFixed(2)}</p>
                <p className="text-sm text-green-400 mt-2">↓ 12% from last month</p>
              </Card>
              <Card className="p-6">
                <h3 className="text-sm text-zinc-400 mb-2">Compute Costs</h3>
                <p className="text-3xl font-bold text-white">
                  ${resources.filter((r) => ['ec2', 'vm', 'compute'].includes(r.type)).reduce((sum, r) => sum + (r.cost || 0), 0).toFixed(2)}
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="text-sm text-zinc-400 mb-2">Storage Costs</h3>
                <p className="text-3xl font-bold text-white">
                  ${resources.filter((r) => ['s3', 'blob', 'storage'].includes(r.type)).reduce((sum, r) => sum + (r.cost || 0), 0).toFixed(2)}
                </p>
              </Card>
            </div>

            <Card>
              <h3 className="text-lg font-semibold text-white mb-4">Cost Breakdown by Resource</h3>
              <div className="space-y-4">
                {resources.filter((r) => r.cost).sort((a, b) => (b.cost || 0) - (a.cost || 0)).map((resource) => (
                  <div key={resource.id} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white">{resource.name}</span>
                        <span className="text-white">${resource.cost?.toFixed(2)}</span>
                      </div>
                      <Progress value={resource.cost || 0} max={totalCost} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Connect Modal */}
        <Modal
          isOpen={showConnectModal}
          onClose={() => setShowConnectModal(false)}
          title="Connect Cloud Account"
          size="lg"
        >
          <form onSubmit={handleConnect} className="space-y-6">
            {/* Provider Selection */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-3">
                Select Provider
              </label>
              <div className="grid grid-cols-2 gap-3">
                {providers.map((provider) => (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => setSelectedProvider(provider.id)}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-xl border transition-colors',
                      selectedProvider === provider.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-zinc-700 hover:border-zinc-600'
                    )}
                  >
                    <span className="text-2xl">{provider.icon}</span>
                    <span className="text-white">{provider.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Account Name"
              value={connectForm.name}
              onChange={(e) => setConnectForm({ ...connectForm, name: e.target.value })}
              placeholder="Production AWS"
              required
            />

            {(selectedProvider === 'aws') && (
              <>
                <Input
                  label="Access Key ID"
                  value={connectForm.accessKeyId}
                  onChange={(e) => setConnectForm({ ...connectForm, accessKeyId: e.target.value })}
                  placeholder="AKIAIOSFODNN7EXAMPLE"
                  required
                />
                <div className="relative">
                  <Input
                    label="Secret Access Key"
                    type={showCredentials ? 'text' : 'password'}
                    value={connectForm.secretAccessKey}
                    onChange={(e) => setConnectForm({ ...connectForm, secretAccessKey: e.target.value })}
                    placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCredentials(!showCredentials)}
                    className="absolute right-3 top-9 text-zinc-500 hover:text-zinc-300"
                  >
                    {showCredentials ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </>
            )}

            {(selectedProvider === 'gcp' || selectedProvider === 'oracle') && (
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Service Account JSON
                </label>
                <textarea
                  value={connectForm.serviceAccount}
                  onChange={(e) => setConnectForm({ ...connectForm, serviceAccount: e.target.value })}
                  placeholder='{"type": "service_account", ...}'
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px] font-mono text-sm"
                  required
                />
              </div>
            )}

            {selectedProvider === 'azure' && (
              <Alert variant="info">
                You'll be redirected to Microsoft to authorize access to your Azure subscription.
              </Alert>
            )}

            <Select
              label="Default Region"
              options={providers.find((p) => p.id === selectedProvider)?.regions || []}
              value={connectForm.region}
              onChange={(value) => setConnectForm({ ...connectForm, region: value })}
            />

            <Alert variant="warning">
              We recommend using credentials with minimal required permissions. Never share your root account credentials.
            </Alert>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowConnectModal(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                {selectedProvider === 'azure' ? 'Continue with Azure' : 'Connect Account'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Resource Detail Modal */}
        <Modal
          isOpen={showResourceModal}
          onClose={() => setShowResourceModal(false)}
          title={selectedResource?.name || 'Resource Details'}
        >
          {selectedResource && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-zinc-500">Resource ID</span>
                  <p className="text-white font-mono text-sm">{selectedResource.id}</p>
                </div>
                <div>
                  <span className="text-sm text-zinc-500">Type</span>
                  <p className="text-white">{selectedResource.type.toUpperCase()}</p>
                </div>
                <div>
                  <span className="text-sm text-zinc-500">Status</span>
                  <Badge variant={getStatusColor(selectedResource.status) as any}>
                    {selectedResource.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm text-zinc-500">Region</span>
                  <p className="text-white">{selectedResource.region}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-white mb-2">Details</h4>
                <div className="p-4 bg-zinc-800 rounded-xl space-y-2">
                  {Object.entries(selectedResource.details).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-zinc-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="text-white">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowResourceModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </PageContainer>
    </ResponsiveLayout>
  );
}
