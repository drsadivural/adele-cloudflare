import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Calendar,
  Clock,
  Plus,
  Play,
  Pause,
  Trash2,
  Edit2,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MoreVertical,
  ChevronRight,
  History,
  Repeat,
} from 'lucide-react';
import { ResponsiveLayout, PageContainer, PageHeader, Card } from '@/components/layout/ResponsiveLayout';
import { Button, Input, Select, Textarea, Badge, Modal, Alert, Tabs, Switch } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ScheduledWork {
  id: number;
  name: string;
  description: string;
  type: 'cron' | 'interval' | 'one-time';
  schedule: string;
  prompt: string;
  status: 'active' | 'paused' | 'completed' | 'failed';
  lastRunAt?: Date;
  nextRunAt?: Date;
  lastRunStatus?: 'success' | 'failure';
  runCount: number;
  createdAt: Date;
}

interface WorkRun {
  id: number;
  scheduledWorkId: number;
  startedAt: Date;
  completedAt?: Date;
  status: 'running' | 'success' | 'failure';
  output?: string;
  error?: string;
  duration?: number;
}

const scheduleTypeOptions = [
  { value: 'cron', label: 'Cron Expression' },
  { value: 'interval', label: 'Fixed Interval' },
  { value: 'one-time', label: 'One-time (Scheduled)' },
];

const intervalOptions = [
  { value: '300', label: 'Every 5 minutes' },
  { value: '900', label: 'Every 15 minutes' },
  { value: '1800', label: 'Every 30 minutes' },
  { value: '3600', label: 'Every hour' },
  { value: '21600', label: 'Every 6 hours' },
  { value: '43200', label: 'Every 12 hours' },
  { value: '86400', label: 'Every day' },
  { value: '604800', label: 'Every week' },
];

const commonCronPresets = [
  { value: '0 0 * * * *', label: 'Every hour' },
  { value: '0 0 9 * * *', label: 'Daily at 9 AM' },
  { value: '0 0 9 * * 1-5', label: 'Weekdays at 9 AM' },
  { value: '0 0 0 * * 0', label: 'Weekly on Sunday' },
  { value: '0 0 0 1 * *', label: 'Monthly on 1st' },
];

export default function ScheduledWorks() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('scheduled');
  const [loading, setLoading] = useState(false);
  const [works, setWorks] = useState<ScheduledWork[]>([]);
  const [runs, setRuns] = useState<WorkRun[]>([]);
  const [selectedWork, setSelectedWork] = useState<ScheduledWork | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'interval',
    schedule: '3600',
    cronExpression: '0 0 9 * * *',
    scheduledTime: '',
    prompt: '',
    enabled: true,
  });

  useEffect(() => {
    loadScheduledWorks();
  }, []);

  const loadScheduledWorks = async () => {
    setLoading(true);
    try {
      // Mock data
      setWorks([
        {
          id: 1,
          name: 'Daily Report Generation',
          description: 'Generate and email daily sales report',
          type: 'cron',
          schedule: '0 0 9 * * 1-5',
          prompt: 'Generate a sales report for yesterday and email it to the team',
          status: 'active',
          lastRunAt: new Date(Date.now() - 86400000),
          nextRunAt: new Date(Date.now() + 43200000),
          lastRunStatus: 'success',
          runCount: 45,
          createdAt: new Date(Date.now() - 86400000 * 45),
        },
        {
          id: 2,
          name: 'Database Backup',
          description: 'Backup production database to S3',
          type: 'interval',
          schedule: '21600',
          prompt: 'Create a backup of the production database and upload to S3',
          status: 'active',
          lastRunAt: new Date(Date.now() - 3600000),
          nextRunAt: new Date(Date.now() + 18000000),
          lastRunStatus: 'success',
          runCount: 120,
          createdAt: new Date(Date.now() - 86400000 * 30),
        },
        {
          id: 3,
          name: 'Weekly Analytics',
          description: 'Compile weekly analytics summary',
          type: 'cron',
          schedule: '0 0 0 * * 0',
          prompt: 'Compile analytics for the past week and create a summary report',
          status: 'paused',
          lastRunAt: new Date(Date.now() - 604800000),
          lastRunStatus: 'failure',
          runCount: 8,
          createdAt: new Date(Date.now() - 86400000 * 60),
        },
      ]);
    } catch (error) {
      console.error('Failed to load scheduled works:', error);
      toast.error('Failed to load scheduled works');
    } finally {
      setLoading(false);
    }
  };

  const loadWorkHistory = async (workId: number) => {
    try {
      // Mock run history
      setRuns([
        {
          id: 1,
          scheduledWorkId: workId,
          startedAt: new Date(Date.now() - 86400000),
          completedAt: new Date(Date.now() - 86400000 + 120000),
          status: 'success',
          output: 'Report generated and sent successfully',
          duration: 120,
        },
        {
          id: 2,
          scheduledWorkId: workId,
          startedAt: new Date(Date.now() - 172800000),
          completedAt: new Date(Date.now() - 172800000 + 95000),
          status: 'success',
          output: 'Report generated and sent successfully',
          duration: 95,
        },
        {
          id: 3,
          scheduledWorkId: workId,
          startedAt: new Date(Date.now() - 259200000),
          completedAt: new Date(Date.now() - 259200000 + 150000),
          status: 'failure',
          error: 'Failed to connect to email server',
          duration: 150,
        },
      ]);
    } catch (error) {
      console.error('Failed to load work history:', error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.prompt) {
      toast.error('Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      let schedule = form.schedule;
      if (form.type === 'cron') {
        schedule = form.cronExpression;
      } else if (form.type === 'one-time') {
        schedule = form.scheduledTime;
      }

      await api.scheduledWorks.create({
        name: form.name,
        description: form.description,
        type: form.type,
        schedule,
        prompt: form.prompt,
        enabled: form.enabled,
      });

      toast.success('Scheduled work created');
      setShowCreateModal(false);
      resetForm();
      loadScheduledWorks();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create scheduled work');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWork) return;
    setLoading(true);
    try {
      let schedule = form.schedule;
      if (form.type === 'cron') {
        schedule = form.cronExpression;
      } else if (form.type === 'one-time') {
        schedule = form.scheduledTime;
      }

      await api.scheduledWorks.update(selectedWork.id, {
        name: form.name,
        description: form.description,
        type: form.type,
        schedule,
        prompt: form.prompt,
        enabled: form.enabled,
      });

      toast.success('Scheduled work updated');
      setShowEditModal(false);
      loadScheduledWorks();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update scheduled work');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedWork) return;
    setLoading(true);
    try {
      await api.scheduledWorks.delete(selectedWork.id);
      toast.success('Scheduled work deleted');
      setShowDeleteConfirm(false);
      setSelectedWork(null);
      loadScheduledWorks();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete scheduled work');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (work: ScheduledWork) => {
    try {
      const newStatus = work.status === 'active' ? 'paused' : 'active';
      await api.scheduledWorks.updateStatus(work.id, newStatus);
      setWorks(works.map((w) => (w.id === work.id ? { ...w, status: newStatus } : w)));
      toast.success(`Work ${newStatus === 'active' ? 'resumed' : 'paused'}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const handleRunNow = async (work: ScheduledWork) => {
    try {
      await api.scheduledWorks.runNow(work.id);
      toast.success('Work triggered');
      loadScheduledWorks();
    } catch (error: any) {
      toast.error(error.message || 'Failed to trigger work');
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      type: 'interval',
      schedule: '3600',
      cronExpression: '0 0 9 * * *',
      scheduledTime: '',
      prompt: '',
      enabled: true,
    });
  };

  const openEditModal = (work: ScheduledWork) => {
    setSelectedWork(work);
    setForm({
      name: work.name,
      description: work.description,
      type: work.type,
      schedule: work.type === 'interval' ? work.schedule : '3600',
      cronExpression: work.type === 'cron' ? work.schedule : '0 0 9 * * *',
      scheduledTime: work.type === 'one-time' ? work.schedule : '',
      prompt: work.prompt,
      enabled: work.status === 'active',
    });
    setShowEditModal(true);
  };

  const openHistoryModal = (work: ScheduledWork) => {
    setSelectedWork(work);
    loadWorkHistory(work.id);
    setShowHistoryModal(true);
  };

  const formatSchedule = (work: ScheduledWork) => {
    if (work.type === 'interval') {
      const seconds = parseInt(work.schedule);
      if (seconds < 3600) return `Every ${seconds / 60} minutes`;
      if (seconds < 86400) return `Every ${seconds / 3600} hours`;
      return `Every ${seconds / 86400} days`;
    }
    if (work.type === 'cron') {
      return work.schedule;
    }
    return new Date(work.schedule).toLocaleString();
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const tabs = [
    { id: 'scheduled', label: 'Scheduled Works', icon: <Calendar className="w-4 h-4" /> },
    { id: 'history', label: 'Run History', icon: <History className="w-4 h-4" /> },
  ];

  return (
    <ResponsiveLayout>
      <PageContainer>
        <PageHeader
          title="Scheduled Works"
          description="Automate recurring tasks with ADELE"
          actions={
            <Button onClick={() => setShowCreateModal(true)} icon={<Plus className="w-4 h-4" />}>
              Create Schedule
            </Button>
          }
        />

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

        {activeTab === 'scheduled' && (
          <div className="space-y-4">
            {works.length === 0 ? (
              <Card className="text-center py-12">
                <Calendar className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Scheduled Works</h3>
                <p className="text-zinc-400 mb-6">
                  Create your first scheduled work to automate recurring tasks
                </p>
                <Button onClick={() => setShowCreateModal(true)} icon={<Plus className="w-4 h-4" />}>
                  Create Schedule
                </Button>
              </Card>
            ) : (
              works.map((work) => (
                <Card key={work.id}>
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{work.name}</h3>
                        <Badge
                          variant={
                            work.status === 'active'
                              ? 'success'
                              : work.status === 'paused'
                              ? 'warning'
                              : work.status === 'failed'
                              ? 'error'
                              : 'default'
                          }
                        >
                          {work.status}
                        </Badge>
                        {work.lastRunStatus && (
                          <Badge
                            variant={work.lastRunStatus === 'success' ? 'success' : 'error'}
                            size="sm"
                          >
                            Last: {work.lastRunStatus}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-zinc-400 mb-3">{work.description}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500">
                        <div className="flex items-center gap-1">
                          <Repeat className="w-4 h-4" />
                          <span>{formatSchedule(work)}</span>
                        </div>
                        {work.nextRunAt && work.status === 'active' && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>Next: {work.nextRunAt.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          <span>{work.runCount} runs</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRunNow(work)}
                        icon={<Play className="w-4 h-4" />}
                      >
                        Run Now
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(work)}
                        icon={work.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      >
                        {work.status === 'active' ? 'Pause' : 'Resume'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openHistoryModal(work)}
                        icon={<History className="w-4 h-4" />}
                      >
                        History
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(work)}
                        icon={<Edit2 className="w-4 h-4" />}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedWork(work);
                          setShowDeleteConfirm(true);
                        }}
                        icon={<Trash2 className="w-4 h-4 text-red-400" />}
                      />
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <Card>
            <h3 className="text-lg font-semibold text-white mb-6">Recent Runs</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Work</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Started</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Duration</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Output</th>
                  </tr>
                </thead>
                <tbody>
                  {works.flatMap((work) =>
                    [1, 2, 3].map((i) => (
                      <tr key={`${work.id}-${i}`} className="border-b border-zinc-800/50">
                        <td className="py-4 px-4 text-white">{work.name}</td>
                        <td className="py-4 px-4 text-zinc-300">
                          {new Date(Date.now() - 86400000 * i).toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-zinc-300">{formatDuration(60 + Math.random() * 120)}</td>
                        <td className="py-4 px-4">
                          <Badge variant={i === 3 ? 'error' : 'success'}>
                            {i === 3 ? 'Failed' : 'Success'}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-zinc-400 max-w-xs truncate">
                          {i === 3 ? 'Connection timeout' : 'Completed successfully'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Create Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            resetForm();
          }}
          title="Create Scheduled Work"
          size="lg"
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Daily Report"
              required
            />
            <Input
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Generate and send daily sales report"
            />

            <Select
              label="Schedule Type"
              options={scheduleTypeOptions}
              value={form.type}
              onChange={(value) => setForm({ ...form, type: value })}
            />

            {form.type === 'interval' && (
              <Select
                label="Interval"
                options={intervalOptions}
                value={form.schedule}
                onChange={(value) => setForm({ ...form, schedule: value })}
              />
            )}

            {form.type === 'cron' && (
              <div className="space-y-2">
                <Input
                  label="Cron Expression"
                  value={form.cronExpression}
                  onChange={(e) => setForm({ ...form, cronExpression: e.target.value })}
                  placeholder="0 0 9 * * *"
                  hint="Format: seconds minutes hours day-of-month month day-of-week"
                />
                <div className="flex flex-wrap gap-2">
                  {commonCronPresets.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setForm({ ...form, cronExpression: preset.value })}
                      className="px-2 py-1 text-xs bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {form.type === 'one-time' && (
              <Input
                label="Scheduled Time"
                type="datetime-local"
                value={form.scheduledTime}
                onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })}
                required
              />
            )}

            <Textarea
              label="Prompt"
              value={form.prompt}
              onChange={(e) => setForm({ ...form, prompt: e.target.value })}
              placeholder="What should ADELE do when this schedule runs?"
              className="min-h-[100px]"
              required
            />

            <Switch
              checked={form.enabled}
              onChange={(checked) => setForm({ ...form, enabled: checked })}
              label="Enable immediately"
              description="Start running on schedule after creation"
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                Create Schedule
              </Button>
            </div>
          </form>
        </Modal>

        {/* Edit Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Scheduled Work"
          size="lg"
        >
          <form onSubmit={handleUpdate} className="space-y-4">
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            <Select
              label="Schedule Type"
              options={scheduleTypeOptions}
              value={form.type}
              onChange={(value) => setForm({ ...form, type: value })}
            />

            {form.type === 'interval' && (
              <Select
                label="Interval"
                options={intervalOptions}
                value={form.schedule}
                onChange={(value) => setForm({ ...form, schedule: value })}
              />
            )}

            {form.type === 'cron' && (
              <Input
                label="Cron Expression"
                value={form.cronExpression}
                onChange={(e) => setForm({ ...form, cronExpression: e.target.value })}
              />
            )}

            {form.type === 'one-time' && (
              <Input
                label="Scheduled Time"
                type="datetime-local"
                value={form.scheduledTime}
                onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })}
              />
            )}

            <Textarea
              label="Prompt"
              value={form.prompt}
              onChange={(e) => setForm({ ...form, prompt: e.target.value })}
              className="min-h-[100px]"
              required
            />

            <Switch
              checked={form.enabled}
              onChange={(checked) => setForm({ ...form, enabled: checked })}
              label="Enabled"
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>

        {/* History Modal */}
        <Modal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          title={`Run History: ${selectedWork?.name}`}
          size="lg"
        >
          <div className="space-y-4">
            {runs.map((run) => (
              <div
                key={run.id}
                className={cn(
                  'p-4 rounded-xl border',
                  run.status === 'success'
                    ? 'border-green-500/20 bg-green-500/5'
                    : run.status === 'failure'
                    ? 'border-red-500/20 bg-red-500/5'
                    : 'border-blue-500/20 bg-blue-500/5'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {run.status === 'success' && <CheckCircle className="w-5 h-5 text-green-400" />}
                    {run.status === 'failure' && <XCircle className="w-5 h-5 text-red-400" />}
                    {run.status === 'running' && <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />}
                    <span className="font-medium text-white capitalize">{run.status}</span>
                  </div>
                  {run.duration && (
                    <span className="text-sm text-zinc-400">{formatDuration(run.duration)}</span>
                  )}
                </div>
                <p className="text-sm text-zinc-400 mb-1">
                  Started: {run.startedAt.toLocaleString()}
                </p>
                {run.output && (
                  <p className="text-sm text-zinc-300 mt-2">{run.output}</p>
                )}
                {run.error && (
                  <p className="text-sm text-red-400 mt-2">{run.error}</p>
                )}
              </div>
            ))}
          </div>
        </Modal>

        {/* Delete Confirmation */}
        <Modal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title="Delete Scheduled Work"
        >
          <div className="space-y-4">
            <Alert variant="warning">
              Are you sure you want to delete "{selectedWork?.name}"? This action cannot be undone.
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
