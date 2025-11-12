import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { incrementCounter, observeHistogram } from './prometheus-metrics';

// Interface for performance metrics
export interface PerformanceMetrics {
  route: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: string;
}

// Simple in-memory store for metrics (in production, use a proper metrics system like Prometheus)
const metricsStore: PerformanceMetrics[] = [];
const MAX_METRICS_STORED = 1000;

// Performance monitoring plugin
export async function performanceMonitor(app: FastifyInstance) {
  app.addHook(
    'onRequest',
    async (request: FastifyRequest, _reply: FastifyReply) => {
      // Add start time to request
      (request as any).startTime = process.hrtime.bigint();
    }
  );

  app.addHook(
    'onResponse',
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Calculate response time
      const startTime = (request as any).startTime;
      if (startTime) {
        const endTime = process.hrtime.bigint();
        const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds

        // Store metrics
        const metric: PerformanceMetrics = {
          route: request.routeOptions.url || request.url,
          method: request.method,
          responseTime: Number(responseTime.toFixed(2)),
          statusCode: reply.statusCode,
          timestamp: new Date().toISOString(),
        };

        // Add to store (keep only recent metrics)
        metricsStore.push(metric);
        if (metricsStore.length > MAX_METRICS_STORED) {
          metricsStore.shift();
        }

        // Update Prometheus metrics
        incrementCounter('http_requests_total', 1);
        observeHistogram('http_request_duration_seconds', responseTime / 1000); // Convert to seconds

        // Log slow requests (> 100ms)
        if (responseTime > 100) {
          app.log.warn(
            `Slow request: ${request.method} ${request.url} took ${responseTime.toFixed(2)}ms`
          );
        }
      }
    }
  );
}

// Get performance metrics
export function getPerformanceMetrics(
  limit: number = 50
): PerformanceMetrics[] {
  return metricsStore.slice(-limit);
}

// Get performance summary
export function getPerformanceSummary(): {
  totalRequests: number;
  avgResponseTime: number;
  slowRequests: number;
  errorRate: number;
} {
  if (metricsStore.length === 0) {
    return {
      totalRequests: 0,
      avgResponseTime: 0,
      slowRequests: 0,
      errorRate: 0,
    };
  }

  const totalRequests = metricsStore.length;
  const totalResponseTime = metricsStore.reduce(
    (sum, metric) => sum + metric.responseTime,
    0
  );
  const slowRequests = metricsStore.filter(
    (metric) => metric.responseTime > 100
  ).length;
  const errorRequests = metricsStore.filter(
    (metric) => metric.statusCode >= 500
  ).length;

  return {
    totalRequests,
    avgResponseTime: Number((totalResponseTime / totalRequests).toFixed(2)),
    slowRequests,
    errorRate: Number(((errorRequests / totalRequests) * 100).toFixed(2)),
  };
}
