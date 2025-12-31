import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Database,
  Download,
  HardDrive,
  RefreshCw,
  Server,
  XCircle,
  Zap,
} from 'lucide-react';

interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  duration?: number;
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: HealthCheck[];
}

interface MetricsSummary {
  timestamp: string;
  uptime: number;
  counters: Record<string, number>;
  gauges: Record<string, number>;
  histograms: Record<string, {
    count: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  }>;
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

interface ErrorEntry {
  timestamp: string;
  error: {
    name: string;
    message: string;
  };
  context: Record<string, unknown>;
}

export default function Monitoring() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<'health' | 'metrics' | 'logs' | 'errors'>('health');
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      setLocation('/dashboard');
      return;
    }
    fetchData();
  }, [user, setLocation]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [healthRes, metricsRes, logsRes, errorsRes] = await Promise.all([
        fetch('/api/health').then(r => r.json()),
        fetch('/api/metrics').then(r => r.json()).catch(() => null),
        fetch('/api/logs?count=100').then(r => r.json()).catch(() => ({ logs: [] })),
        fetch('/api/errors?count=50').then(r => r.json()).catch(() => ({ errors: [] })),
      ]);
      
      setHealth(healthRes);
      if (metricsRes) setMetrics(metricsRes);
      if (logsRes?.logs) setLogs(logsRes.logs);
      if (errorsRes?.errors) setErrors(errorsRes.errors);
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'pass':
        return 'text-green-500';
      case 'degraded':
      case 'warn':
        return 'text-yellow-500';
      case 'unhealthy':
      case 'fail':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'degraded':
      case 'warn':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'unhealthy':
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'debug':
        return 'bg-gray-100 text-gray-700';
      case 'info':
        return 'bg-blue-100 text-blue-700';
      case 'warn':
        return 'bg-yellow-100 text-yellow-700';
      case 'error':
        return 'bg-red-100 text-red-700';
      case 'fatal':
        return 'bg-red-200 text-red-800';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const exportData = (type: 'logs' | 'errors' | 'metrics') => {
    let data: unknown;
    let filename: string;

    switch (type) {
      case 'logs':
        data = logs;
        filename = `adele-logs-${new Date().toISOString().split('T')[0]}.json`;
        break;
      case 'errors':
        data = errors;
        filename = `adele-errors-${new Date().toISOString().split('T')[0]}.json`;
        break;
      case 'metrics':
        data = metrics;
        filename = `adele-metrics-${new Date().toISOString().split('T')[0]}.json`;
        break;
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setLocation('/admin')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-3">
                <Activity className="w-6 h-6 text-indigo-600" />
                <h1 className="text-xl font-semibold text-gray-900">System Monitoring</h1>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Overview */}
        {health && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                {getStatusIcon(health.status)}
                <div>
                  <h2 className={`text-2xl font-bold capitalize ${getStatusColor(health.status)}`}>
                    {health.status}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Version {health.version} · Uptime {formatUptime(health.uptime)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Last checked</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(health.timestamp).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {health.checks.map((check) => (
                <div
                  key={check.name}
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg"
                >
                  {getStatusIcon(check.status)}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 capitalize">{check.name}</p>
                    {check.duration !== undefined && (
                      <p className="text-sm text-gray-500">{check.duration}ms</p>
                    )}
                    {check.message && (
                      <p className="text-sm text-red-500">{check.message}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'health', label: 'Health', icon: Server },
            { id: 'metrics', label: 'Metrics', icon: Zap },
            { id: 'logs', label: 'Logs', icon: Database },
            { id: 'errors', label: 'Errors', icon: AlertTriangle },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {id === 'errors' && errors.length > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                  {errors.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {activeTab === 'metrics' && metrics && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
                <button
                  onClick={() => exportData('metrics')}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>

              {/* Counters */}
              <div className="mb-8">
                <h4 className="text-sm font-medium text-gray-500 mb-4">Counters</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(metrics.counters).map(([key, value]) => (
                    <div key={key} className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">{key.replace(/\./g, ' ')}</p>
                      <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Histograms */}
              {Object.keys(metrics.histograms).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-4">Response Times</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Metric</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Count</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Avg</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">P50</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">P95</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">P99</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(metrics.histograms).map(([key, data]) => (
                          <tr key={key} className="border-b border-gray-100">
                            <td className="py-3 px-4 text-sm text-gray-900">{key.replace(/\./g, ' ')}</td>
                            <td className="py-3 px-4 text-sm text-gray-600 text-right">{data.count}</td>
                            <td className="py-3 px-4 text-sm text-gray-600 text-right">{data.avg?.toFixed(1)}ms</td>
                            <td className="py-3 px-4 text-sm text-gray-600 text-right">{data.p50?.toFixed(1)}ms</td>
                            <td className="py-3 px-4 text-sm text-gray-600 text-right">{data.p95?.toFixed(1)}ms</td>
                            <td className="py-3 px-4 text-sm text-gray-600 text-right">{data.p99?.toFixed(1)}ms</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recent Logs</h3>
                <button
                  onClick={() => exportData('logs')}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No logs available</p>
                ) : (
                  logs.map((log, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 rounded-lg font-mono text-sm"
                    >
                      <div className="flex items-start gap-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${getLevelColor(log.level)}`}>
                          {log.level}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-2 text-gray-900">{log.message}</p>
                      {log.context && Object.keys(log.context).length > 0 && (
                        <pre className="mt-2 text-xs text-gray-500 overflow-x-auto">
                          {JSON.stringify(log.context, null, 2)}
                        </pre>
                      )}
                      {log.error && (
                        <div className="mt-2 p-2 bg-red-50 rounded text-red-700 text-xs">
                          <p className="font-medium">{log.error.name}: {log.error.message}</p>
                          {log.error.stack && (
                            <pre className="mt-1 text-red-500 overflow-x-auto">{log.error.stack}</pre>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'errors' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recent Errors</h3>
                <button
                  onClick={() => exportData('errors')}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {errors.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-500">No errors recorded</p>
                  </div>
                ) : (
                  errors.map((error, index) => (
                    <div
                      key={index}
                      className="p-4 bg-red-50 border border-red-100 rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <XCircle className="w-5 h-5 text-red-500" />
                          <span className="font-medium text-red-700">{error.error.name}</span>
                        </div>
                        <span className="text-xs text-red-400">
                          {new Date(error.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-red-600 mb-2">{error.error.message}</p>
                      {Object.keys(error.context).length > 0 && (
                        <pre className="text-xs text-red-500 bg-red-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(error.context, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'health' && health && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">System Health Details</h3>
              
              <div className="space-y-6">
                {health.checks.map((check) => (
                  <div
                    key={check.name}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {check.name === 'database' && <Database className="w-5 h-5 text-gray-400" />}
                        {check.name === 'kv' && <HardDrive className="w-5 h-5 text-gray-400" />}
                        {check.name === 'r2' && <HardDrive className="w-5 h-5 text-gray-400" />}
                        <span className="font-medium text-gray-900 capitalize">{check.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(check.status)}
                        <span className={`font-medium capitalize ${getStatusColor(check.status)}`}>
                          {check.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Response Time</p>
                        <p className="font-medium text-gray-900">
                          {check.duration !== undefined ? `${check.duration}ms` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Status Message</p>
                        <p className="font-medium text-gray-900">
                          {check.message || 'OK'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
