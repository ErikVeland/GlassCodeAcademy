// Simple health check
export async function registerHealthRoutes(app) {
  // Basic health check endpoint
  app.get('/api/health', async () => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  });

  // Detailed health check with system metrics
  app.get('/api/health/detailed', async () => {
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
    };
  });

  // Performance metrics endpoint
  app.get('/api/metrics', async () => {
    return {
      message: 'Metrics endpoint not implemented in this version',
    };
  });
}
