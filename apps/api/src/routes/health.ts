import { FastifyInstance } from 'fastify';
import { getCacheStats } from '../utils/optimized-content';
import {
  getPerformanceMetrics,
  getPerformanceSummary,
} from '../utils/monitoring';

// Simple health check
export async function registerHealthRoutes(app: FastifyInstance) {
  // Basic health check endpoint
  app.get('/api/health', async () => {
    return { status: 'healthy', timestamp: new Date().toISOString() };
  });

  // Detailed health check with system metrics
  app.get('/api/health/detailed', async () => {
    const cacheStats = getCacheStats();
    const performanceSummary = getPerformanceSummary();

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB',
        heapTotal:
          Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
        heapUsed:
          Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      },
      cache: cacheStats,
      performance: performanceSummary,
    };
  });

  // Performance metrics endpoint
  app.get('/api/metrics', async () => {
    const metrics = getPerformanceMetrics(100);
    const summary = getPerformanceSummary();

    return {
      summary,
      metrics,
    };
  });
}
