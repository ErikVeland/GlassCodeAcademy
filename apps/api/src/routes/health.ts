import type { FastifyInstance } from 'fastify';
import { getCacheStats } from '../utils/optimized-content';
import {
  getPerformanceMetrics,
  getPerformanceSummary,
} from '../utils/monitoring';
import * as cacheService from '../services/cacheService.js';

interface CacheStats {
  enabled: boolean;
  connected: boolean;
  hits: number;
  misses: number;
  errors: number;
  hitRate: string;
}

// Simple health check
export async function registerHealthRoutes(app: FastifyInstance) {
  // Basic health check endpoint
  app.get('/api/health', async () => {
    const redisStats = cacheService.getStats() as CacheStats;
    const status = redisStats.connected ? 'healthy' : 'degraded';
    return {
      status,
      timestamp: new Date().toISOString(),
      redis: {
        enabled: redisStats.enabled,
        connected: redisStats.connected,
      },
    };
  });

  // Detailed health check with system metrics
  app.get('/api/health/detailed', async () => {
    const cacheStats = getCacheStats();
    const performanceSummary = getPerformanceSummary();
    const redisStats = cacheService.getStats() as CacheStats;

    // Check if Redis is properly connected for health status
    const overallStatus = redisStats.connected ? 'healthy' : 'degraded';

    return {
      status: overallStatus,
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
      redis: redisStats,
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
