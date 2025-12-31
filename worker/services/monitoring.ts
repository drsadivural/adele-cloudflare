/**
 * Monitoring & Logging Service for ADELE
 * Structured logging, error tracking, and performance metrics
 */

// Log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

// Log entry structure
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  request?: {
    method: string;
    url: string;
    userAgent?: string;
    ip?: string;
    userId?: number;
  };
  performance?: {
    duration: number;
    memoryUsed?: number;
  };
  tags?: string[];
}

// Metrics types
export interface Metric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  tags?: Record<string, string>;
}

export interface PerformanceMetrics {
  requestCount: number;
  errorCount: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
}

// Alert configuration
export interface AlertConfig {
  name: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  metric: string;
  webhookUrl?: string;
  email?: string;
}

// Logger class
export class Logger {
  private serviceName: string;
  private environment: string;
  private minLevel: LogLevel;
  private buffer: LogEntry[] = [];
  private maxBufferSize = 100;

  constructor(config: {
    serviceName: string;
    environment: string;
    minLevel?: LogLevel;
  }) {
    this.serviceName = config.serviceName;
    this.environment = config.environment;
    this.minLevel = config.minLevel || LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private createEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...context,
        service: this.serviceName,
        environment: this.environment
      }
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }

    return entry;
  }

  private log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    // Add to buffer
    this.buffer.push(entry);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }

    // Console output with structured format
    const output = JSON.stringify(entry);
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(output);
        break;
      case LogLevel.INFO:
        console.info(output);
        break;
      case LogLevel.WARN:
        console.warn(output);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(output);
        break;
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log(this.createEntry(LogLevel.DEBUG, message, context));
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log(this.createEntry(LogLevel.INFO, message, context));
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log(this.createEntry(LogLevel.WARN, message, context));
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log(this.createEntry(LogLevel.ERROR, message, context, error));
  }

  fatal(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log(this.createEntry(LogLevel.FATAL, message, context, error));
  }

  // Get recent logs
  getRecentLogs(count = 50): LogEntry[] {
    return this.buffer.slice(-count);
  }

  // Clear buffer
  clearBuffer(): void {
    this.buffer = [];
  }
}

// Metrics collector
export class MetricsCollector {
  private metrics: Map<string, number[]> = new Map();
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();

  // Increment a counter
  increment(name: string, value = 1): void {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + value);
  }

  // Set a gauge value
  gauge(name: string, value: number): void {
    this.gauges.set(name, value);
  }

  // Record a timing/histogram value
  timing(name: string, value: number): void {
    const values = this.metrics.get(name) || [];
    values.push(value);
    // Keep last 1000 values
    if (values.length > 1000) {
      values.shift();
    }
    this.metrics.set(name, values);
  }

  // Get counter value
  getCounter(name: string): number {
    return this.counters.get(name) || 0;
  }

  // Get gauge value
  getGauge(name: string): number | undefined {
    return this.gauges.get(name);
  }

  // Get percentile for a metric
  getPercentile(name: string, percentile: number): number | undefined {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return undefined;

    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  // Get average for a metric
  getAverage(name: string): number | undefined {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return undefined;

    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  // Get all metrics summary
  getSummary(): Record<string, unknown> {
    const summary: Record<string, unknown> = {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: {} as Record<string, unknown>
    };

    for (const [name] of this.metrics) {
      (summary.histograms as Record<string, unknown>)[name] = {
        count: this.metrics.get(name)?.length || 0,
        avg: this.getAverage(name),
        p50: this.getPercentile(name, 50),
        p95: this.getPercentile(name, 95),
        p99: this.getPercentile(name, 99)
      };
    }

    return summary;
  }

  // Reset all metrics
  reset(): void {
    this.metrics.clear();
    this.counters.clear();
    this.gauges.clear();
  }
}

// Error tracker for Sentry-like functionality
export class ErrorTracker {
  private dsn?: string;
  private errors: Array<{
    timestamp: string;
    error: Error;
    context: Record<string, unknown>;
  }> = [];
  private maxErrors = 100;

  constructor(dsn?: string) {
    this.dsn = dsn;
  }

  async capture(error: Error, context: Record<string, unknown> = {}): Promise<void> {
    const entry = {
      timestamp: new Date().toISOString(),
      error,
      context
    };

    // Store locally
    this.errors.push(entry);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Send to external service if configured
    if (this.dsn) {
      try {
        await this.sendToSentry(entry);
      } catch (e) {
        console.error('Failed to send error to Sentry:', e);
      }
    }
  }

  private async sendToSentry(entry: {
    timestamp: string;
    error: Error;
    context: Record<string, unknown>;
  }): Promise<void> {
    if (!this.dsn) return;

    // Parse DSN to get project info
    const url = new URL(this.dsn);
    const projectId = url.pathname.replace('/', '');
    const publicKey = url.username;

    const sentryUrl = `https://${url.host}/api/${projectId}/store/`;

    await fetch(sentryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${publicKey}`
      },
      body: JSON.stringify({
        event_id: crypto.randomUUID().replace(/-/g, ''),
        timestamp: entry.timestamp,
        platform: 'javascript',
        exception: {
          values: [{
            type: entry.error.name,
            value: entry.error.message,
            stacktrace: {
              frames: this.parseStackTrace(entry.error.stack)
            }
          }]
        },
        extra: entry.context
      })
    });
  }

  private parseStackTrace(stack?: string): Array<{ filename: string; function: string; lineno: number }> {
    if (!stack) return [];

    return stack.split('\n').slice(1).map(line => {
      const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):\d+\)/);
      if (match) {
        return {
          function: match[1],
          filename: match[2],
          lineno: parseInt(match[3], 10)
        };
      }
      return { filename: 'unknown', function: 'unknown', lineno: 0 };
    });
  }

  getRecentErrors(count = 20): Array<{
    timestamp: string;
    error: { name: string; message: string };
    context: Record<string, unknown>;
  }> {
    return this.errors.slice(-count).map(e => ({
      timestamp: e.timestamp,
      error: { name: e.error.name, message: e.error.message },
      context: e.context
    }));
  }
}

// Request/Response middleware for monitoring
export interface RequestMetrics {
  startTime: number;
  method: string;
  path: string;
  userId?: number;
}

export function createRequestMiddleware(logger: Logger, metrics: MetricsCollector) {
  return {
    onRequest(request: Request, userId?: number): RequestMetrics {
      const url = new URL(request.url);
      const reqMetrics: RequestMetrics = {
        startTime: Date.now(),
        method: request.method,
        path: url.pathname,
        userId
      };

      metrics.increment('requests.total');
      metrics.increment(`requests.${request.method.toLowerCase()}`);

      logger.info('Request started', {
        method: request.method,
        path: url.pathname,
        userId
      });

      return reqMetrics;
    },

    onResponse(reqMetrics: RequestMetrics, status: number): void {
      const duration = Date.now() - reqMetrics.startTime;

      metrics.timing('response.time', duration);
      metrics.increment(`responses.${Math.floor(status / 100)}xx`);

      if (status >= 400) {
        metrics.increment('requests.errors');
      }

      logger.info('Request completed', {
        method: reqMetrics.method,
        path: reqMetrics.path,
        status,
        duration,
        userId: reqMetrics.userId
      });
    },

    onError(reqMetrics: RequestMetrics, error: Error): void {
      const duration = Date.now() - reqMetrics.startTime;

      metrics.increment('requests.errors');
      metrics.timing('response.time', duration);

      logger.error('Request failed', error, {
        method: reqMetrics.method,
        path: reqMetrics.path,
        duration,
        userId: reqMetrics.userId
      });
    }
  };
}

// Health check endpoint data
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message?: string;
    duration?: number;
  }[];
}

export function createHealthCheck(
  startTime: number,
  version: string,
  checks: Array<{ name: string; check: () => Promise<boolean> }>
): () => Promise<HealthStatus> {
  return async () => {
    const results = await Promise.all(
      checks.map(async ({ name, check }) => {
        const start = Date.now();
        try {
          const passed = await check();
          return {
            name,
            status: passed ? 'pass' as const : 'fail' as const,
            duration: Date.now() - start
          };
        } catch (error) {
          return {
            name,
            status: 'fail' as const,
            message: error instanceof Error ? error.message : 'Unknown error',
            duration: Date.now() - start
          };
        }
      })
    );

    const hasFailure = results.some(r => r.status === 'fail');
    const hasWarning = results.some(r => r.status === 'warn');

    return {
      status: hasFailure ? 'unhealthy' : hasWarning ? 'degraded' : 'healthy',
      timestamp: new Date().toISOString(),
      version,
      uptime: Date.now() - startTime,
      checks: results
    };
  };
}

// Export singleton instances
let loggerInstance: Logger | null = null;
let metricsInstance: MetricsCollector | null = null;
let errorTrackerInstance: ErrorTracker | null = null;

export function initMonitoring(config: {
  serviceName: string;
  environment: string;
  sentryDsn?: string;
  logLevel?: LogLevel;
}): { logger: Logger; metrics: MetricsCollector; errorTracker: ErrorTracker } {
  loggerInstance = new Logger({
    serviceName: config.serviceName,
    environment: config.environment,
    minLevel: config.logLevel
  });

  metricsInstance = new MetricsCollector();
  errorTrackerInstance = new ErrorTracker(config.sentryDsn);

  return {
    logger: loggerInstance,
    metrics: metricsInstance,
    errorTracker: errorTrackerInstance
  };
}

export function getLogger(): Logger {
  if (!loggerInstance) {
    throw new Error('Monitoring not initialized. Call initMonitoring first.');
  }
  return loggerInstance;
}

export function getMetrics(): MetricsCollector {
  if (!metricsInstance) {
    throw new Error('Monitoring not initialized. Call initMonitoring first.');
  }
  return metricsInstance;
}

export function getErrorTracker(): ErrorTracker {
  if (!errorTrackerInstance) {
    throw new Error('Monitoring not initialized. Call initMonitoring first.');
  }
  return errorTrackerInstance;
}
