/* eslint-env node */
'use strict';

// Minimal Fastify server to satisfy local connectivity for frontend
const fastify = require('fastify');

const PORT = Number(process.env.PORT || 8081);

const app = fastify({ logger: true });

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