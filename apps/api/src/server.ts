import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import compress from '@fastify/compress';
import { randomBytes } from 'crypto';
import { registerRegistryRoutes } from './routes/registry';
import { registerModuleRoutes } from './routes/modules';
import { registerLessonRoutes } from './routes/lessons';
import { registerQuizRoutes } from './routes/quizzes';
import { registerHealthRoutes } from './routes/health';
import { registerSearchRoutes } from './routes/search';
import { registerVersioningRoutes } from './routes/versioning';
import { performanceMonitor } from './utils/monitoring';
import { scheduleCacheWarming } from './utils/cache-warmer';
import { registerMetricsEndpoint } from './utils/prometheus-metrics';

// Generate random ID for correlation
function cryptoRandomId() {
  return randomBytes(16).toString('hex');
}

export async function buildServer() {
  const app = Fastify({
    logger: true,
    bodyLimit: 1_048_576, // ~1MB global limit
    trustProxy: true,
  });

  // Register Prometheus metrics endpoint
  await registerMetricsEndpoint(app);

  // Request compression
  await app.register(compress, {
    threshold: 1024, // Only compress responses larger than 1KB
    zlibOptions: {
      level: 6, // Compression level (0-9)
    },
  });

  // Security headers via Helmet with enhanced configuration
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", 'https:', 'data:'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    frameguard: {
      action: 'deny',
    },
    hidePoweredBy: true,
    noSniff: true,
    xssFilter: true,
  });

  // Strict CORS: allow only production domain; allow all in non-prod for dev convenience
  await app.register(cors, {
    origin:
      process.env.NODE_ENV === 'production'
        ? ['https://bet.glasscode.academy']
        : true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
    maxAge: 600,
  });

  // Global rate limiting (no Redis for now to avoid complications)
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    cache: 10000,
    keyGenerator: (req) =>
      (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown',
    allowList: (req) => Boolean(req.headers['x-internal-allow']),
    skipOnError: true,
  });

  // Performance monitoring
  await performanceMonitor(app);

  // Correlation ID propagation
  app.addHook('onRequest', async (req, reply) => {
    const cid = (req.headers['x-correlation-id'] as string) || cryptoRandomId();
    reply.header('x-correlation-id', cid);
    (req as any).correlationId = cid;
  });

  // Register all routes
  await registerRegistryRoutes(app);
  await registerModuleRoutes(app);
  await registerLessonRoutes(app);
  await registerQuizRoutes(app);
  await registerHealthRoutes(app);
  await registerSearchRoutes(app);
  await registerVersioningRoutes(app);

  // Schedule cache warming (every 30 minutes)
  scheduleCacheWarming(30);

  return app;
}

async function start() {
  const app = await buildServer();
  const port = Number(process.env.PORT || 8081);
  const host = process.env.HOST || '0.0.0.0';

  // Gracefully shutdown OpenTelemetry on exit
  const shutdownHandler = async () => {
    console.log('Shutting down server...');
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdownHandler);
  process.on('SIGTERM', shutdownHandler);

  await app.listen({ port, host });
}

start().catch((err) => {
  console.error('Failed to start TS server:', err);
  process.exit(1);
});