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
      console.log('Loading env from:', envPath);
      dotenv.config({ path: envPath });
      break;
    }
  }
  
  // Explicitly load .env.test if it exists
  const envTestPath = path.resolve(__dirname, '.env.test');
  if (fs.existsSync(envTestPath)) {
    console.log('Explicitly loading .env.test from:', envTestPath);
    dotenv.config({ path: envTestPath });
  }
})();

// Force NODE_ENV to 'test' for all Jest runs
process.env.NODE_ENV = 'test';

// Initialize models and database for tests
let sequelize;
try {
  const models = require('./src/models');
  sequelize = models.sequelize;
  // Associations are initialized in per-suite setup utilities to avoid duplicate registrations.
} catch (error) {
  console.warn('Models not available for tests:', error.message);
}

// Make models available globally for tests if they exist
if (sequelize) {
  global.sequelize = sequelize;
}