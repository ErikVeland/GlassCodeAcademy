/* eslint-env node */
'use strict';

// Minimal Fastify server to satisfy local connectivity for frontend
const fastify = require('fastify');
const helmet = require('@fastify/helmet');
const cors = require('@fastify/cors');
const rateLimit = require('@fastify/rate-limit');

const PORT = Number(process.env.PORT || 8081);

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

app
  .listen({ port: PORT, host: '0.0.0.0' })
  .then(() => {
    app.log.info(`API server listening on http://localhost:${PORT}`);
  })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });