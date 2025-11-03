#!/usr/bin/env node

/**
 * GlassCode Academy Backend Server
 * 
 * This file handles:
 * - Environment variable loading
 * - Database initialization
 * - OpenTelemetry SDK initialization
 * - Server startup and lifecycle management
 * 
 * The Express app is defined in src/app.js for better testability
 */

const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables with a safe default to production when available
(function loadEnv() {
  try {
    const prodPath = path.resolve(__dirname, '.env.production');
    const devPath = path.resolve(__dirname, '.env');
    // Prefer .env.production whenever it exists to avoid accidental dev overrides in prod
    if (fs.existsSync(prodPath)) {
      dotenv.config({ path: prodPath });
      return;
    }
    if (fs.existsSync(devPath)) {
      dotenv.config({ path: devPath });
      return;
    }
    dotenv.config();
  } catch (error) {
    dotenv.config();
  }
})();

// Determine environment and invocation mode
const isTest = (process.env.NODE_ENV || '').toLowerCase() === 'test';
const runningUnderJest = !!process.env.JEST_WORKER_ID;
const isMain = require.main === module;

// Initialize OpenTelemetry (must be before other imports) - skip in test env
let sdk;
if (!isTest && isMain) {
  try {
    ({ sdk } = require('./src/utils/opentelemetry'));
    // Start OpenTelemetry SDK
    sdk.start();
    console.log('OpenTelemetry SDK started');
  } catch (error) {
    console.error('Error starting OpenTelemetry SDK:', error);
  }
}

// Database initialization - skip in test env (tests manage their own DB)
const initializeDatabase = require('./src/utils/database');
if (!isTest && isMain) {
  initializeDatabase();
}

// Create Express app
const createApp = require('./src/app');
// Disable rate limiting during tests/Jest to avoid 429s in integration runs
const app = createApp({ disableRateLimit: isTest || runningUnderJest });

// Start server
let server;
if (isMain) {
  const PORT = process.env.PORT || 8080;
  server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  if (server) server.close(() => {
    console.log('HTTP server closed');
    // Shutdown telemetry only if initialized
    if (!isTest && isMain && sdk && typeof sdk.shutdown === 'function') {
      sdk
        .shutdown()
        .then(() => console.log('OpenTelemetry SDK shut down successfully'))
        .catch((error) =>
          console.error('Error shutting down OpenTelemetry SDK:', error)
        )
        .finally(() => process.exit(0));
    } else {
      process.exit(0);
    }
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  if (server) server.close(() => {
    console.log('HTTP server closed');
    // Shutdown telemetry only if initialized
    if (!isTest && isMain && sdk && typeof sdk.shutdown === 'function') {
      sdk
        .shutdown()
        .then(() => console.log('OpenTelemetry SDK shut down successfully'))
        .catch((error) =>
          console.error('Error shutting down OpenTelemetry SDK:', error)
        )
        .finally(() => process.exit(0));
    } else {
      process.exit(0);
    }
  });
});

// Export app for testing
module.exports = app;