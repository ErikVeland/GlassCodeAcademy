import type { FastifyInstance } from 'fastify';

// Simple in-memory metrics storage
interface CounterMetric {
  type: 'counter';
  value: number;
  labels: Record<string, string>;
  help: string;
}

interface GaugeMetric {
  type: 'gauge';
  value: number;
  labels: Record<string, string>;
  help: string;
}

interface HistogramMetric {
  type: 'histogram';
  values: Record<string, number>;
  sum: number;
  count: number;
  labels: Record<string, string>;
  help: string;
}

type Metric = CounterMetric | GaugeMetric | HistogramMetric;

// Metrics storage
const metricsStore = new Map<string, Metric>();

// Helper functions to create metrics
export function createCounter(
  name: string,
  help: string,
  labels: Record<string, string> = {}
): void {
  metricsStore.set(name, {
    type: 'counter',
    value: 0,
    labels,
    help,
  });
}

export function createGauge(
  name: string,
  help: string,
  labels: Record<string, string> = {}
): void {
  metricsStore.set(name, {
    type: 'gauge',
    value: 0,
    labels,
    help,
  });
}

export function createHistogram(
  name: string,
  help: string,
  labels: Record<string, string> = {}
): void {
  metricsStore.set(name, {
    type: 'histogram',
    values: {},
    sum: 0,
    count: 0,
    labels,
    help,
  });
}

// Helper functions to update metrics
export function incrementCounter(name: string, value: number = 1): void {
  const metric = metricsStore.get(name);
  if (metric && metric.type === 'counter') {
    metric.value += value;
  }
}

export function setGauge(name: string, value: number): void {
  const metric = metricsStore.get(name);
  if (metric && metric.type === 'gauge') {
    metric.value = value;
  }
}

export function observeHistogram(name: string, value: number): void {
  const metric = metricsStore.get(name);
  if (metric && metric.type === 'histogram') {
    metric.sum += value;
    metric.count += 1;

    // Simple bucketing for histogram
    const buckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];
    for (const bucket of buckets) {
      const bucketKey = `le_${bucket}`;
      if (value <= bucket) {
        metric.values[bucketKey] = (metric.values[bucketKey] || 0) + 1;
      }
    }
    // +Inf bucket
    metric.values['le_inf'] = (metric.values['le_inf'] || 0) + 1;
  }
}

// Format metrics for Prometheus
function formatMetrics(): string {
  const lines: string[] = [];

  for (const [name, metric] of metricsStore) {
    // Add help text
    lines.push(`# HELP ${name} ${metric.help}`);

    if (metric.type === 'counter') {
      lines.push(`# TYPE ${name} counter`);
      const labelStr = Object.entries(metric.labels)
        .map(([key, value]) => `${key}="${value}"`)
        .join(',');
      lines.push(`${name}{${labelStr}} ${metric.value}`);
    } else if (metric.type === 'gauge') {
      lines.push(`# TYPE ${name} gauge`);
      const labelStr = Object.entries(metric.labels)
        .map(([key, value]) => `${key}="${value}"`)
        .join(',');
      lines.push(`${name}{${labelStr}} ${metric.value}`);
    } else if (metric.type === 'histogram') {
      lines.push(`# TYPE ${name} histogram`);

      // Output bucket values
      for (const [bucket, count] of Object.entries(metric.values)) {
        const bucketValue =
          bucket === 'le_inf' ? '+Inf' : bucket.replace('le_', '');
        const labelStr = Object.entries(metric.labels)
          .map(([key, value]) => `${key}="${value}"`)
          .join(',');
        lines.push(`${name}_bucket{${labelStr},le="${bucketValue}"} ${count}`);
      }

      // Output sum and count
      const labelStr = Object.entries(metric.labels)
        .map(([key, value]) => `${key}="${value}"`)
        .join(',');
      lines.push(`${name}_sum{${labelStr}} ${metric.sum}`);
      lines.push(`${name}_count{${labelStr}} ${metric.count}`);
    }

    lines.push(''); // Empty line between metrics
  }

  return lines.join('\n');
}

// Initialize default metrics
function initializeDefaultMetrics(): void {
  // HTTP request metrics
  createCounter('http_requests_total', 'Total number of HTTP requests', {
    method: '',
    route: '',
    status_code: '',
  });

  createHistogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    {
      method: '',
      route: '',
    }
  );

  // Cache metrics
  createGauge('cache_size', 'Current cache size');
  createCounter('cache_hits_total', 'Total cache hits');
  createCounter('cache_misses_total', 'Total cache misses');

  // System metrics
  createGauge(
    'nodejs_heap_size_total_bytes',
    'Process heap size from node.js in bytes'
  );
  createGauge(
    'nodejs_heap_size_used_bytes',
    'Process heap size used from node.js in bytes'
  );
  createGauge(
    'nodejs_external_memory_bytes',
    'Nodejs external memory in bytes'
  );
  createGauge(
    'nodejs_process_cpu_usage_percentage',
    'Process CPU usage percentage'
  );
  createGauge(
    'nodejs_process_memory_usage_bytes',
    'Process memory usage in bytes'
  );
}

// Update system metrics periodically
function updateSystemMetrics(): void {
  const memUsage = process.memoryUsage();
  setGauge('nodejs_heap_size_total_bytes', memUsage.heapTotal);
  setGauge('nodejs_heap_size_used_bytes', memUsage.heapUsed);
  setGauge('nodejs_external_memory_bytes', memUsage.external);
  setGauge('nodejs_process_memory_usage_bytes', process.memoryUsage().rss);

  // CPU usage estimation
  const cpuUsage = process.cpuUsage();
  const cpuPercent = cpuUsage.user / 1000000; // Convert microseconds to percentage
  setGauge('nodejs_process_cpu_usage_percentage', cpuPercent);
}

// Register metrics endpoint
export async function registerMetricsEndpoint(
  app: FastifyInstance
): Promise<void> {
  // Initialize default metrics
  initializeDefaultMetrics();

  // Update system metrics periodically
  setInterval(updateSystemMetrics, 5000); // Update every 5 seconds
  updateSystemMetrics(); // Initial update

  // Expose metrics endpoint
  app.get('/metrics', async (request, reply) => {
    reply.header('Content-Type', 'text/plain; version=0.0.4');
    return formatMetrics();
  });
}

// Export metric update functions for use in other modules
// (Functions are already exported individually above)
