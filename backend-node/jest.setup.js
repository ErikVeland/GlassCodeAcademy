/* eslint-env node, jest */
/* eslint-disable no-undef */
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

(function loadEnv() {
  const candidates = [
    path.resolve(__dirname, '.env'),
    path.resolve(__dirname, '.env.test'),
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '../.env.test'),
    path.resolve(__dirname, '../../.env'),
    path.resolve(__dirname, '../../.env.test')
  ];

  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      break;
    }
  }
})();

// Force NODE_ENV to 'test' for all Jest runs
process.env.NODE_ENV = 'test';

// Initialize models and database for tests
const { sequelize, initializeAssociations } = require('./src/models');

// Associations are initialized in per-suite setup utilities to avoid duplicate registrations.

// Make models available globally for tests
global.sequelize = sequelize;