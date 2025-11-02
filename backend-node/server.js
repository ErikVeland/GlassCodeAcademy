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

// Initialize OpenTelemetry (must be before other imports)
const { sdk } = require('./src/utils/opentelemetry');

// Start OpenTelemetry SDK
try {
  sdk.start();
  console.log('OpenTelemetry SDK started');
} catch (error) {
  console.error('Error starting OpenTelemetry SDK:', error);
}

// Database initialization
const initializeDatabase = require('./src/utils/database');
initializeDatabase();

// Create Express app
const createApp = require('./src/app');
const app = createApp();

// Start server
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    sdk
      .shutdown()
      .then(() => console.log('OpenTelemetry SDK shut down successfully'))
      .catch((error) =>
        console.error('Error shutting down OpenTelemetry SDK:', error)
      )
      .finally(() => process.exit(0));
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    sdk
      .shutdown()
      .then(() => console.log('OpenTelemetry SDK shut down successfully'))
      .catch((error) =>
        console.error('Error shutting down OpenTelemetry SDK:', error)
      )
      .finally(() => process.exit(0));
  });
});

// Export app for testing
module.exports = app;