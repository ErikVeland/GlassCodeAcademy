/* eslint-env node */
'use strict';

// Minimal Fastify server to satisfy local connectivity for frontend
import fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import process from 'process';
// Import route registration functions
import { registerAuthRoutes } from './src/routes/auth.js';
import { registerRegistryRoutes } from './src/routes/registry.js';
import { registerModuleRoutes } from './src/routes/modules.js';
import { registerLessonRoutes } from './src/routes/lessons.js';
import { registerQuizRoutes } from './src/routes/quizzes.js';
import { registerHealthRoutes } from './src/routes/health.js';

const PORT = Number(process.env.PORT || 8082);

const app = fastify({ logger: true, bodyLimit: 1_048_576, trustProxy: true });

// Security headers
app.register(helmet, { contentSecurityPolicy: false, crossOriginEmbedderPolicy: false });

// Strict CORS
app.register(cors, {
  origin: process.env.NODE_ENV === 'production' ? ['https://bet.glasscode.academy'] : true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  maxAge: 600,
});

// Rate limit
app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  keyGenerator: (req) => req.headers['x-forwarded-for'] || req.ip || 'unknown',
  skipOnError: true,
});

// Health endpoint used by frontend `/health`
app.get('/health', async () => ({ success: true, status: 'ok' }));

// Basic root for sanity
app.get('/', async () => ({ ok: true }));

// Register API routes
await registerAuthRoutes(app);
await registerRegistryRoutes(app);
await registerModuleRoutes(app);
await registerLessonRoutes(app);
await registerQuizRoutes(app);
await registerHealthRoutes(app);

app
  .listen({ port: PORT, host: '0.0.0.0' })
  .then(() => {
    app.log.info(`API server listening on http://localhost:${PORT}`);
  })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });