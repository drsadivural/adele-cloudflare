import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Rocket,
  Plus,
  Search,
  Play,
  Pause,
  Square,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  Settings,
  Trash2,
  GitBranch,
  Package,
  Server,
  Globe,
  Terminal,
  FileCode,
  Layers,
  Activity,
  Eye,
  Copy,
  Download,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { ResponsiveLayout, PageContainer, PageHeader, Card } from '@/components/layout/ResponsiveLayout';
import { Button, Input, Select, Textarea, Badge, Modal, Alert, Tabs, Switch, Progress } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Application {
  id: number;
  name: string;
  description: string;
  repository: string;
  branch: string;
  framework: 'react' | 'nextjs' | 'vue' | 'node' | 'python' | 'docker';
  provider: 'aws' | 'azure' | 'gcp' | 'vercel';
  environment: 'development' | 'staging' | 'production';
  status: 'idle' | 'building' | 'deploying' | 'running' | 'failed' | 'stopped';
  url?: string;
  lastDeployment?: Deployment;
  config: AppConfig;
  createdAt: Date;
  updatedAt: Date;
}

interface Deployment {
  id: number;
  appId: number;
  version: string;
  commit: string;
  commitMessage: string;
  status: 'pending' | 'building' | 'deploying' | 'success' | 'failed' | 'cancelled';
  progress: number;
  duration?: number;
  logs: string[];
  createdAt: Date;
  completedAt?: Date;
  triggeredBy: string;
}

interface AppConfig {
  buildCommand: string;
  outputDir: string;
  envVars: Record<string, string>;
  resources: {
    cpu: string;
    memory: string;
    instances: number;
  };
  domain?: string;
  ssl: boolean;
  autoDeploy: boolean;
}

const frameworkOptions = [
  { value: 'react', label: 'React', icon: '⚛️' },
  { value: 'nextjs', label: 'Next.js', icon: '▲' },
  { value: 'vue', label: 'Vue.js', icon: '💚' },
  { value: 'node', label: 'Node.js', icon: '🟢' },
  { value: 'python', label: 'Python', icon: '🐍' },
  { value: 'docker', label: 'Docker', icon: '🐳' },
];

const providerOptions = [
  { value: 'aws', label: 'AWS (ECS Fargate)', icon: '🔶' },
  { value: 'azure', label: 'Azure Container Apps', icon: '🔷' },
  { value: 'gcp', label: 'Google Cloud Run', icon: '🔴' },
  { value: 'vercel', label: 'Vercel', icon: '▲' },
];

const environmentOptions = [
  { value: 'development', label: 'Development' },
  { value: 'staging', label: 'Staging' },
  { value: 'production', label: 'Production' },
];

export default function AppDeploy() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('apps');
  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLogs, setExpandedLogs] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    repository: '',
    branch: 'main',
    framework: 'react',
    provider: 'aws',
    environment: 'development',
    buildCommand: 'npm run build',
    outputDir: 'dist',
    cpu: '0.25',
    memory: '512',
    instances: 1,
    autoDeploy: true,
  });

  const [envVars, setEnvVars] = useState<{ key: string; value: string }[]>([
    { key: '', value: '' },
  ]);

  useEffect(() => {
    loadApplications();
    loadDeployments();
  }, []);

  const loadApplications = async () => {
    try {
      // Mock data
      setApplications([
        {
          id: 1,
          name: 'Customer Portal',
          description: 'Main customer-facing web application',
          repository: 'github.com/company/customer-portal',
          branch: 'main',
          framework: 'nextjs',
          provider: 'aws',
          environment: 'production',
          status: 'running',
          url: 'https://portal.example.com',
          lastDeployment: {
            id: 1,
            appId: 1,
            version: 'v2.1.0',
            commit: 'abc123',
            commitMessage: 'Fix login issue',
            status: 'success',
            progress: 100,
            duration: 180,
            logs: [],
            createdAt: new Date(Date.now() - 3600000),
            completedAt: new Date(Date.now() - 3420000),
            triggeredBy: 'Auto Deploy',
          },
          config: {
            buildCommand: 'npm run build',
            outputDir: '.next',
            envVars: { NODE_ENV: 'production' },
            resources: { cpu: '0.5', memory: '1024', instances: 2 },
            domain: 'portal.example.com',
            ssl: true,
            autoDeploy: true,
          },
          createdAt: new Date(Date.now() - 86400000 * 30),
          updatedAt: new Date(Date.now() - 3600000),
        },
        {
          id: 2,
          name: 'API Backend',
          description: 'REST API service',
          repository: 'github.com/company/api-backend',
          branch: 'develop',
          framework: 'node',
          provider: 'aws',
          environment: 'staging',
          status: 'building',
          config: {
            buildCommand: 'npm run build',
            outputDir: 'dist',
            envVars: { NODE_ENV: 'staging' },
            resources: { cpu: '0.25', memory: '512', instances: 1 },
            ssl: true,
            autoDeploy: false,
          },
          createdAt: new Date(Date.now() - 86400000 * 14),
          updatedAt: new Date(),
        },
        {
          id: 3,
          name: 'ML Pipeline',
          description: 'Machine learning inference service',
          repository: 'github.com/company/ml-pipeline',
          branch: 'main',
          framework: 'python',
          provider: 'gcp',
          environment: 'production',
          status: 'failed',
          config: {
            buildCommand: 'pip install -r requirements.txt',
            outputDir: 'app',
            envVars: { PYTHON_ENV: 'production' },
            resources: { cpu: '1', memory: '2048', instances: 1 },
            ssl: true,
            autoDeploy: false,
          },
          createdAt: new Date(Date.now() - 86400000 * 7),
          updatedAt: new Date(Date.now() - 86400000),
        },
      ]);
    } catch (error) {
      console.error('Failed to load applications:', error);
    }
  };

  const loadDeployments = async () => {
    try {
      setDeployments([
        {
          id: 1,
          appId: 1,
          version: 'v2.1.0',
          commit: 'abc123',
          commitMessage: 'Fix login issue',
          status: 'success',
          progress: 100,
          duration: 180,
          logs: ['Building...', 'Installing dependencies...', 'Build complete', 'Deploying to AWS...', 'Deployment successful'],
          createdAt: new Date(Date.now() - 3600000),
          completedAt: new Date(Date.now() - 3420000),
          triggeredBy: 'Auto Deploy',
        },
        {
          id: 2,
          appId: 2,
          version: 'v1.5.2',
          commit: 'def456',
          commitMessage: 'Add new endpoint',
          status: 'building',
          progress: 45,
          logs: ['Building...', 'Installing dependencies...'],
          createdAt: new Date(),
          triggeredBy: user?.name || 'User',
        },
        {
          id: 3,
          appId: 3,
          version: 'v3.0.0',
          commit: 'ghi789',
          commitMessage: 'Update ML model',
          status: 'failed',
          progress: 75,
          duration: 240,
          logs: ['Building...', 'Installing dependencies...', 'Build complete', 'Deploying...', 'Error: Container failed to start'],
          createdAt: new Date(Date.now() - 86400000),
          completedAt: new Date(Date.now() - 86400000 + 240000),
          triggeredBy: user?.name || 'User',
        },
      ]);
    } catch (error) {
      console.error('Failed to load deployments:', error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.repository) {
      toast.error('Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      const envVarsObj: Record<string, string> = {};
      envVars.forEach((ev) => {
        if (ev.key && ev.value) {
          envVarsObj[ev.key] = ev.value;
        }
      });

      await api.apps.create({
        name: form.name,
        description: form.description,
        repository: form.repository,
        branch: form.branch,
        framework: form.framework,
        provider: form.provider,
        environment: form.environment,
        config: {
          buildCommand: form.buildCommand,
          outputDir: form.outputDir,
          envVars: envVarsObj,
          resources: {
            cpu: form.cpu,
            memory: form.memory,
            instances: form.instances,
          },
          ssl: true,
          autoDeploy: form.autoDeploy,
        },
      });
      toast.success('Application created');
      setShowCreateModal(false);
      resetForm();
      loadApplications();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create application');
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = async (app: Application) => {
    try {
      await api.apps.deploy(app.id);
      toast.success(`Deployment started for ${app.name}`);
      loadApplications();
      loadDeployments();
    } catch (error: any) {
      toast.error(error.message || 'Failed to start deployment');
    }
  };

  const handleStop = async (app: Application) => {
    try {
      await api.apps.stop(app.id);
      toast.success(`${app.name} stopped`);
      loadApplications();
    } catch (error: any) {
      toast.error(error.message || 'Failed to stop application');
    }
  };

  const handleDelete = async () => {
    if (!selectedApp) return;
    setLoading(true);
    try {
      await api.apps.delete(selectedApp.id);
      toast.success('Application deleted');
      setShowDeleteConfirm(false);
      setSelectedApp(null);
      loadApplications();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete application');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDeployment = async (deploymentId: number) => {
    try {
      await api.apps.cancelDeployment(deploymentId);
      toast.success('Deployment cancelled');
      loadDeployments();
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel deployment');
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      repository: '',
      branch: 'main',
      framework: 'react',
      provider: 'aws',
      environment: 'development',
      buildCommand: 'npm run build',
      outputDir: 'dist',
      cpu: '0.25',
      memory: '512',
      instances: 1,
      autoDeploy: true,
    });
    setEnvVars([{ key: '', value: '' }]);
  };

  const addEnvVar = () => {
    setEnvVars([...envVars, { key: '', value: '' }]);
  };

  const removeEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  const updateEnvVar = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...envVars];
    updated[index][field] = value;
    setEnvVars(updated);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': case 'success': return 'success';
      case 'building': case 'deploying': case 'pending': return 'info';
      case 'failed': return 'error';
      case 'stopped': case 'idle': case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const filteredApps = applications.filter((app) =>
    searchQuery === '' ||
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { id: 'apps', label: 'Applications', icon: <Package className="w-4 h-4" /> },
    { id: 'deployments', label: 'Deployments', icon: <Rocket className="w-4 h-4" /> },
  ];

  return (
    <ResponsiveLayout>
      <PageContainer>
        <PageHeader
          title="App Build & Deploy"
          description="Build and deploy applications to cloud providers"
          actions={
            <Button onClick={() => setShowCreateModal(true)} icon={<Plus className="w-4 h-4" />}>
              New Application
            </Button>
          }
        />

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

        {/* Applications Tab */}
        {activeTab === 'apps' && (
          <div className="space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search applications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Apps Grid */}
            {filteredApps.length === 0 ? (
              <Card className="text-center py-12">
                <Package className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Applications</h3>
                <p className="text-zinc-400 mb-6">
                  Create your first application to start deploying
                </p>
                <Button onClick={() => setShowCreateModal(true)} icon={<Plus className="w-4 h-4" />}>
                  New Application
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredApps.map((app) => (
                  <Card key={app.id}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {frameworkOptions.find((f) => f.value === app.framework)?.icon}
                        </span>
                        <div>
                          <h3 className="font-medium text-white">{app.name}</h3>
                          <p className="text-sm text-zinc-400">{app.description}</p>
                        </div>
                      </div>
                      <Badge variant={getStatusColor(app.status) as any}>
                        {app.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-zinc-500">Provider</span>
                        <p className="text-white">
                          {providerOptions.find((p) => p.value === app.provider)?.label}
                        </p>
                      </div>
                      <div>
                        <span className="text-zinc-500">Environment</span>
                        <p className="text-white capitalize">{app.environment}</p>
                      </div>
                      <div>
                        <span className="text-zinc-500">Branch</span>
                        <p className="text-white flex items-center gap-1">
                          <GitBranch className="w-4 h-4" />
                          {app.branch}
                        </p>
                      </div>
                      <div>
                        <span className="text-zinc-500">Last Deploy</span>
                        <p className="text-white">
                          {app.lastDeployment
                            ? app.lastDeployment.createdAt.toLocaleString()
                            : 'Never'}
                        </p>
                      </div>
                    </div>

                    {app.url && (
                      <a
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 mb-4"
                      >
                        <Globe className="w-4 h-4" />
                        {app.url}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                      <div className="flex items-center gap-2">
                        {app.status === 'running' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStop(app)}
                            icon={<Square className="w-4 h-4" />}
                          >
                            Stop
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleDeploy(app)}
                            icon={<Rocket className="w-4 h-4" />}
                            disabled={app.status === 'building' || app.status === 'deploying'}
                          >
                            Deploy
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedApp(app);
                            setShowConfigModal(true);
                          }}
                          icon={<Settings className="w-4 h-4" />}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedApp(app);
                            setShowDeleteConfirm(true);
                          }}
                          icon={<Trash2 className="w-4 h-4 text-red-400" />}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Deployments Tab */}
        {activeTab === 'deployments' && (
          <div className="space-y-4">
            {deployments.length === 0 ? (
              <Card className="text-center py-12">
                <Rocket className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Deployments</h3>
                <p className="text-zinc-400">
                  Deploy an application to see deployment history
                </p>
              </Card>
            ) : (
              deployments.map((deployment) => {
                const app = applications.find((a) => a.id === deployment.appId);
                return (
                  <Card key={deployment.id}>
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-white">{app?.name}</h3>
                          <Badge variant={getStatusColor(deployment.status) as any}>
                            {deployment.status}
                          </Badge>
                          <Badge size="sm">{deployment.version}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-zinc-400">
                          <span className="flex items-center gap-1">
                            <GitBranch className="w-4 h-4" />
                            {deployment.commit.substring(0, 7)}
                          </span>
                          <span>{deployment.commitMessage}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-zinc-500 mt-2">
                          <span>Triggered by {deployment.triggeredBy}</span>
                          <span>{deployment.createdAt.toLocaleString()}</span>
                          {deployment.duration && (
                            <span>Duration: {Math.floor(deployment.duration / 60)}m {deployment.duration % 60}s</span>
                          )}
                        </div>
                      </div>

                      {(deployment.status === 'building' || deployment.status === 'deploying') && (
                        <div className="lg:w-48">
                          <Progress value={deployment.progress} max={100} />
                          <p className="text-xs text-zinc-500 text-center mt-1">{deployment.progress}%</p>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedDeployment(deployment);
                            setShowLogsModal(true);
                          }}
                          icon={<Terminal className="w-4 h-4" />}
                        >
                          Logs
                        </Button>
                        {(deployment.status === 'building' || deployment.status === 'deploying') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelDeployment(deployment.id)}
                            icon={<XCircle className="w-4 h-4 text-red-400" />}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* Create Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="New Application"
          size="xl"
        >
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Application Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="my-app"
                required
              />
              <Input
                label="Repository URL"
                value={form.repository}
                onChange={(e) => setForm({ ...form, repository: e.target.value })}
                placeholder="github.com/user/repo"
                required
              />
            </div>

            <Textarea
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of the application"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Framework"
                options={frameworkOptions.map((f) => ({ value: f.value, label: `${f.icon} ${f.label}` }))}
                value={form.framework}
                onChange={(value) => setForm({ ...form, framework: value })}
              />
              <Select
                label="Cloud Provider"
                options={providerOptions.map((p) => ({ value: p.value, label: `${p.icon} ${p.label}` }))}
                value={form.provider}
                onChange={(value) => setForm({ ...form, provider: value })}
              />
              <Select
                label="Environment"
                options={environmentOptions}
                value={form.environment}
                onChange={(value) => setForm({ ...form, environment: value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Branch"
                value={form.branch}
                onChange={(e) => setForm({ ...form, branch: e.target.value })}
                placeholder="main"
              />
              <Input
                label="Build Command"
                value={form.buildCommand}
                onChange={(e) => setForm({ ...form, buildCommand: e.target.value })}
                placeholder="npm run build"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Environment Variables
              </label>
              <div className="space-y-2">
                {envVars.map((ev, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={ev.key}
                      onChange={(e) => updateEnvVar(index, 'key', e.target.value)}
                      placeholder="KEY"
                      className="flex-1"
                    />
                    <Input
                      value={ev.value}
                      onChange={(e) => updateEnvVar(index, 'value', e.target.value)}
                      placeholder="value"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEnvVar(index)}
                      icon={<Trash2 className="w-4 h-4" />}
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addEnvVar}
                  icon={<Plus className="w-4 h-4" />}
                >
                  Add Variable
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Resources
              </label>
              <div className="grid grid-cols-3 gap-4">
                <Select
                  label="CPU"
                  options={[
                    { value: '0.25', label: '0.25 vCPU' },
                    { value: '0.5', label: '0.5 vCPU' },
                    { value: '1', label: '1 vCPU' },
                    { value: '2', label: '2 vCPU' },
                  ]}
                  value={form.cpu}
                  onChange={(value) => setForm({ ...form, cpu: value })}
                />
                <Select
                  label="Memory"
                  options={[
                    { value: '512', label: '512 MB' },
                    { value: '1024', label: '1 GB' },
                    { value: '2048', label: '2 GB' },
                    { value: '4096', label: '4 GB' },
                  ]}
                  value={form.memory}
                  onChange={(value) => setForm({ ...form, memory: value })}
                />
                <Input
                  label="Instances"
                  type="number"
                  min={1}
                  max={10}
                  value={form.instances}
                  onChange={(e) => setForm({ ...form, instances: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <Switch
              checked={form.autoDeploy}
              onChange={(checked) => setForm({ ...form, autoDeploy: checked })}
              label="Auto Deploy"
              description="Automatically deploy when changes are pushed to the branch"
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                Create Application
              </Button>
            </div>
          </form>
        </Modal>

        {/* Logs Modal */}
        <Modal
          isOpen={showLogsModal}
          onClose={() => setShowLogsModal(false)}
          title="Deployment Logs"
          size="xl"
        >
          {selectedDeployment && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant={getStatusColor(selectedDeployment.status) as any}>
                    {selectedDeployment.status}
                  </Badge>
                  <span className="text-sm text-zinc-400">
                    {selectedDeployment.version} • {selectedDeployment.commit.substring(0, 7)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedDeployment.logs.join('\n'));
                    toast.success('Logs copied to clipboard');
                  }}
                  icon={<Copy className="w-4 h-4" />}
                >
                  Copy
                </Button>
              </div>

              <div className="bg-zinc-950 rounded-xl p-4 font-mono text-sm max-h-96 overflow-auto">
                {selectedDeployment.logs.map((log, index) => (
                  <div key={index} className="text-zinc-300 py-0.5">
                    <span className="text-zinc-600 mr-2">{String(index + 1).padStart(3, '0')}</span>
                    {log}
                  </div>
                ))}
                {(selectedDeployment.status === 'building' || selectedDeployment.status === 'deploying') && (
                  <div className="text-blue-400 animate-pulse">▌</div>
                )}
              </div>
            </div>
          )}
        </Modal>

        {/* Config Modal */}
        <Modal
          isOpen={showConfigModal}
          onClose={() => setShowConfigModal(false)}
          title={`${selectedApp?.name} Settings`}
          size="lg"
        >
          {selectedApp && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-zinc-500">Framework</span>
                  <p className="text-white">
                    {frameworkOptions.find((f) => f.value === selectedApp.framework)?.label}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-zinc-500">Provider</span>
                  <p className="text-white">
                    {providerOptions.find((p) => p.value === selectedApp.provider)?.label}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-zinc-500">Build Command</span>
                  <p className="text-white font-mono text-sm">{selectedApp.config.buildCommand}</p>
                </div>
                <div>
                  <span className="text-sm text-zinc-500">Output Directory</span>
                  <p className="text-white font-mono text-sm">{selectedApp.config.outputDir}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-white mb-2">Resources</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="p-3 bg-zinc-800 rounded-lg">
                    <span className="text-zinc-500">CPU</span>
                    <p className="text-white">{selectedApp.config.resources.cpu} vCPU</p>
                  </div>
                  <div className="p-3 bg-zinc-800 rounded-lg">
                    <span className="text-zinc-500">Memory</span>
                    <p className="text-white">{parseInt(selectedApp.config.resources.memory) / 1024} GB</p>
                  </div>
                  <div className="p-3 bg-zinc-800 rounded-lg">
                    <span className="text-zinc-500">Instances</span>
                    <p className="text-white">{selectedApp.config.resources.instances}</p>
                  </div>
                </div>
              </div>

              {Object.keys(selectedApp.config.envVars).length > 0 && (
                <div>
                  <h4 className="font-medium text-white mb-2">Environment Variables</h4>
                  <div className="space-y-1">
                    {Object.entries(selectedApp.config.envVars).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 text-sm font-mono">
                        <span className="text-zinc-400">{key}=</span>
                        <span className="text-white">••••••••</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowConfigModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Delete Confirmation */}
        <Modal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title="Delete Application"
        >
          <div className="space-y-4">
            <Alert variant="error">
              Are you sure you want to delete {selectedApp?.name}? This will also delete all
              deployment history and cannot be undone.
            </Alert>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete} loading={loading}>
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      </PageContainer>
    </ResponsiveLayout>
  );
}
