import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Zap,
  MessageSquare,
  HardDrive,
  Play,
  Download,
  Calendar,
  Filter,
  ChevronDown,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { ResponsiveLayout, PageContainer, PageHeader, Card } from '@/components/layout/ResponsiveLayout';
import { Button, Select, Tabs, Badge, Progress } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface UsageStats {
  credits: { used: number; limit: number; trend: number };
  tokens: { used: number; limit: number; trend: number };
  toolCalls: { used: number; limit: number; trend: number };
  storage: { used: number; limit: number; trend: number };
  runs: { used: number; limit: number; trend: number };
}

interface UsageRecord {
  date: string;
  credits: number;
  tokens: number;
  toolCalls: number;
  storage: number;
  runs: number;
}

interface ProjectUsage {
  id: number;
  name: string;
  credits: number;
  tokens: number;
  runs: number;
  percentage: number;
}

const COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6366F1'];

export default function Usage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UsageStats>({
    credits: { used: 0, limit: 1000, trend: 0 },
    tokens: { used: 0, limit: 1000000, trend: 0 },
    toolCalls: { used: 0, limit: 10000, trend: 0 },
    storage: { used: 0, limit: 5, trend: 0 },
    runs: { used: 0, limit: 100, trend: 0 },
  });
  const [usageHistory, setUsageHistory] = useState<UsageRecord[]>([]);
  const [projectUsage, setProjectUsage] = useState<ProjectUsage[]>([]);

  useEffect(() => {
    loadUsageData();
  }, [timeRange]);

  const loadUsageData = async () => {
    setLoading(true);
    try {
      // Mock data - in production, this would come from the API
      setStats({
        credits: { used: 743, limit: 1000, trend: 12.5 },
        tokens: { used: 524000, limit: 1000000, trend: -5.2 },
        toolCalls: { used: 3420, limit: 10000, trend: 8.3 },
        storage: { used: 2.4, limit: 5, trend: 15.0 },
        runs: { used: 47, limit: 100, trend: 22.1 },
      });

      // Generate mock history data
      const history: UsageRecord[] = [];
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        history.push({
          date: date.toISOString().split('T')[0],
          credits: Math.floor(Math.random() * 50) + 10,
          tokens: Math.floor(Math.random() * 50000) + 10000,
          toolCalls: Math.floor(Math.random() * 200) + 50,
          storage: Math.random() * 0.1,
          runs: Math.floor(Math.random() * 5) + 1,
        });
      }
      setUsageHistory(history);

      // Mock project usage
      setProjectUsage([
        { id: 1, name: 'E-commerce Platform', credits: 245, tokens: 180000, runs: 15, percentage: 33 },
        { id: 2, name: 'Dashboard App', credits: 189, tokens: 140000, runs: 12, percentage: 25 },
        { id: 3, name: 'API Backend', credits: 156, tokens: 110000, runs: 10, percentage: 21 },
        { id: 4, name: 'Mobile App', credits: 98, tokens: 60000, runs: 6, percentage: 13 },
        { id: 5, name: 'Other Projects', credits: 55, tokens: 34000, runs: 4, percentage: 8 },
      ]);
    } catch (error) {
      console.error('Failed to load usage data:', error);
      toast.error('Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const csvContent = [
        ['Date', 'Credits', 'Tokens', 'Tool Calls', 'Storage (GB)', 'Runs'].join(','),
        ...usageHistory.map((record) =>
          [
            record.date,
            record.credits,
            record.tokens,
            record.toolCalls,
            record.storage.toFixed(2),
            record.runs,
          ].join(',')
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `adele-usage-${timeRange}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Usage data exported');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const StatCard = ({
    title,
    icon: Icon,
    used,
    limit,
    trend,
    unit = '',
    format = (v: number) => v.toLocaleString(),
  }: {
    title: string;
    icon: React.ElementType;
    used: number;
    limit: number;
    trend: number;
    unit?: string;
    format?: (v: number) => string;
  }) => {
    const percentage = (used / limit) * 100;
    const isWarning = percentage > 80;
    const isCritical = percentage > 95;

    return (
      <Card>
        <div className="flex items-start justify-between mb-4">
          <div className="p-2 bg-zinc-800 rounded-lg">
            <Icon className="w-5 h-5 text-blue-400" />
          </div>
          <div className={`flex items-center gap-1 text-sm ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {Math.abs(trend)}%
          </div>
        </div>
        <h3 className="text-sm text-zinc-400 mb-1">{title}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white">{format(used)}</span>
          <span className="text-sm text-zinc-500">/ {format(limit)} {unit}</span>
        </div>
        <Progress
          value={used}
          max={limit}
          variant={isCritical ? 'error' : isWarning ? 'warning' : 'default'}
          className="mt-3"
        />
      </Card>
    );
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'projects', label: 'By Project', icon: <Filter className="w-4 h-4" /> },
    { id: 'history', label: 'History', icon: <Calendar className="w-4 h-4" /> },
  ];

  const timeRangeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
  ];

  return (
    <ResponsiveLayout>
      <PageContainer>
        <PageHeader
          title="Usage"
          description="Monitor your resource consumption and usage patterns"
          actions={
            <div className="flex items-center gap-3">
              <Select
                options={timeRangeOptions}
                value={timeRange}
                onChange={setTimeRange}
                className="w-40"
              />
              <Button variant="outline" onClick={handleExportCSV} icon={<Download className="w-4 h-4" />}>
                Export CSV
              </Button>
            </div>
          }
        />

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <StatCard
                title="Credits Used"
                icon={Zap}
                used={stats.credits.used}
                limit={stats.credits.limit}
                trend={stats.credits.trend}
              />
              <StatCard
                title="Tokens"
                icon={MessageSquare}
                used={stats.tokens.used}
                limit={stats.tokens.limit}
                trend={stats.tokens.trend}
                format={(v) => `${(v / 1000).toFixed(0)}K`}
              />
              <StatCard
                title="Tool Calls"
                icon={Play}
                used={stats.toolCalls.used}
                limit={stats.toolCalls.limit}
                trend={stats.toolCalls.trend}
              />
              <StatCard
                title="Storage"
                icon={HardDrive}
                used={stats.storage.used}
                limit={stats.storage.limit}
                trend={stats.storage.trend}
                unit="GB"
                format={(v) => v.toFixed(1)}
              />
              <StatCard
                title="Agent Runs"
                icon={Play}
                used={stats.runs.used}
                limit={stats.runs.limit}
                trend={stats.runs.trend}
              />
            </div>

            {/* Usage Chart */}
            <Card>
              <h3 className="text-lg font-semibold text-white mb-6">Usage Over Time</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={usageHistory}>
                    <defs>
                      <linearGradient id="colorCredits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis
                      dataKey="date"
                      stroke="#71717a"
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis stroke="#71717a" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        border: '1px solid #27272a',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="credits"
                      stroke="#3B82F6"
                      fillOpacity={1}
                      fill="url(#colorCredits)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Distribution Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-lg font-semibold text-white mb-6">Usage by Project</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={projectUsage}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="credits"
                      >
                        {projectUsage.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#18181b',
                          border: '1px solid #27272a',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {projectUsage.slice(0, 5).map((project, index) => (
                    <div key={project.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-zinc-300">{project.name}</span>
                      </div>
                      <span className="text-zinc-400">{project.percentage}%</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-white mb-6">Daily Breakdown</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={usageHistory.slice(-7)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis
                        dataKey="date"
                        stroke="#71717a"
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'short' })}
                      />
                      <YAxis stroke="#71717a" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#18181b',
                          border: '1px solid #27272a',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="credits" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <Card>
            <h3 className="text-lg font-semibold text-white mb-6">Usage by Project</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Project</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-zinc-400">Credits</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-zinc-400">Tokens</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-zinc-400">Runs</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-zinc-400">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {projectUsage.map((project) => (
                    <tr key={project.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                      <td className="py-4 px-4">
                        <span className="font-medium text-white">{project.name}</span>
                      </td>
                      <td className="py-4 px-4 text-right text-zinc-300">{project.credits.toLocaleString()}</td>
                      <td className="py-4 px-4 text-right text-zinc-300">{(project.tokens / 1000).toFixed(0)}K</td>
                      <td className="py-4 px-4 text-right text-zinc-300">{project.runs}</td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Progress value={project.percentage} max={100} className="w-20" />
                          <span className="text-zinc-400 text-sm w-12 text-right">{project.percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <Card>
            <h3 className="text-lg font-semibold text-white mb-6">Usage History</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Date</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-zinc-400">Credits</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-zinc-400">Tokens</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-zinc-400">Tool Calls</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-zinc-400">Storage</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-zinc-400">Runs</th>
                  </tr>
                </thead>
                <tbody>
                  {usageHistory.slice().reverse().map((record) => (
                    <tr key={record.date} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                      <td className="py-4 px-4">
                        <span className="text-white">
                          {new Date(record.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right text-zinc-300">{record.credits}</td>
                      <td className="py-4 px-4 text-right text-zinc-300">{(record.tokens / 1000).toFixed(1)}K</td>
                      <td className="py-4 px-4 text-right text-zinc-300">{record.toolCalls}</td>
                      <td className="py-4 px-4 text-right text-zinc-300">{record.storage.toFixed(2)} GB</td>
                      <td className="py-4 px-4 text-right text-zinc-300">{record.runs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </PageContainer>
    </ResponsiveLayout>
  );
}
