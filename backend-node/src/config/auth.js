const dotenv = require('dotenv');

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// JWT Secret validation
let jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  if (isProduction) {
    // FAIL LOUDLY in production - this is a critical security issue
    throw new Error(
      'CRITICAL SECURITY ERROR: JWT_SECRET environment variable is not set in production!\n' +
        'Application cannot start without a secure JWT secret.\n' +
        'Set JWT_SECRET in your environment variables or .env.production file.'
    );
  } else if (isDevelopment) {
    // Warn in development but allow with insecure fallback
    console.warn(
      '⚠️  WARNING: JWT_SECRET not set. Using insecure development fallback.\n' +
        '   This is ONLY acceptable in development. Set JWT_SECRET in .env file.'
    );
    jwtSecret = 'dev-insecure-secret-' + Date.now();
  } else if (isTest) {
    // Use a consistent test secret for reproducible tests
    jwtSecret = 'test-secret-key-do-not-use-in-production';
  } else {
    // Unknown environment - fail safe
    throw new Error(
      'JWT_SECRET is not set and NODE_ENV is not recognized.\n' +
        'Set JWT_SECRET environment variable or configure NODE_ENV properly.'
    );
  }
}

// Validate JWT secret strength in production
if (isProduction && jwtSecret.length < 32) {
  throw new Error(
    'SECURITY ERROR: JWT_SECRET must be at least 32 characters long in production.\n' +
      'Current length: ' +
      jwtSecret.length +
      ' characters.\n' +
      'Generate a strong secret: openssl rand -base64 32'
  );
}

module.exports = {
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  // Expose environment for other modules
  isProduction,
  isDevelopment,
  isTest,
};
