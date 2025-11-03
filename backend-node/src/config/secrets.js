const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment-specific .env file
const loadEnvFile = () => {
  const env = process.env.NODE_ENV || 'development';
  const envFiles = [
    path.resolve(process.cwd(), `.env.${env}.local`),
    path.resolve(process.cwd(), `.env.${env}`),
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '.env'),
  ];

  for (const envFile of envFiles) {
    if (fs.existsSync(envFile)) {
      dotenv.config({ path: envFile });
      console.log(`✓ Loaded environment from: ${path.basename(envFile)}`);
      return;
    }
  }
};

loadEnvFile();

/**
 * Secret Configuration Manager
 * Validates and manages all application secrets
 */

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';
const isDevelopment = NODE_ENV === 'development';
const isTest = NODE_ENV === 'test';

/**
 * Secret definitions with validation rules
 */
const secretDefinitions = {
  // Authentication Secrets
  JWT_SECRET: {
    required: true,
    minLength: isProduction ? 32 : 8,
    description: 'Secret key for signing JWT tokens',
    generateCommand: 'openssl rand -base64 32',
  },

  // Database Secrets (optional if using DATABASE_URL)
  DATABASE_URL: {
    required: false,
    pattern: /^(postgres|postgresql):\/\/.+/,
    description: 'PostgreSQL connection string',
  },

  DB_PASSWORD: {
    required: false,
    minLength: isProduction ? 12 : 0,
    description: 'Database password (if not using DATABASE_URL)',
  },

  // Redis Secrets (optional - cache falls back gracefully)
  REDIS_URL: {
    required: false,
    pattern: /^redis:\/\/.+/,
    description: 'Redis connection string for caching',
  },

  // External Service Secrets
  SENTRY_DSN: {
    required: isProduction,
    pattern: /^https:\/\/.*@sentry\.io\/.+/,
    description: 'Sentry DSN for error tracking',
  },

  // OAuth Secrets (optional unless OAuth is enabled)
  GOOGLE_CLIENT_ID: {
    required: process.env.OAUTH_ENABLED === 'true',
    description: 'Google OAuth client ID',
  },

  GOOGLE_CLIENT_SECRET: {
    required: process.env.OAUTH_ENABLED === 'true',
    minLength: 20,
    description: 'Google OAuth client secret',
  },

  GITHUB_CLIENT_ID: {
    required: false,
    description: 'GitHub OAuth client ID',
  },

  GITHUB_CLIENT_SECRET: {
    required: false,
    minLength: 20,
    description: 'GitHub OAuth client secret',
  },

  // Email Service Secrets (optional)
  SMTP_PASSWORD: {
    required: false,
    description: 'SMTP server password',
  },

  // API Keys
  OPENAI_API_KEY: {
    required: false,
    pattern: /^sk-.+/,
    description: 'OpenAI API key (if AI features enabled)',
  },
};

/**
 * Validation errors collector
 */
const validationErrors = [];
const validationWarnings = [];

/**
 * Validate a single secret
 */
function validateSecret(name, definition) {
  const value = process.env[name];

  // Check if required
  if (definition.required && !value) {
    validationErrors.push({
      secret: name,
      error: `Missing required secret: ${name}`,
      description: definition.description,
      fix: definition.generateCommand
        ? `Generate with: ${definition.generateCommand}`
        : `Set ${name} in your environment or .env file`,
    });
    return false;
  }

  // If not set and not required, skip further validation
  if (!value) {
    return true;
  }

  // Check minimum length
  if (definition.minLength && value.length < definition.minLength) {
    const errorMsg = `${name} is too short (${value.length} chars, minimum ${definition.minLength})`;

    if (isProduction) {
      validationErrors.push({
        secret: name,
        error: errorMsg,
        description: definition.description,
        fix: definition.generateCommand || 'Use a longer, more secure value',
      });
      return false;
    } else {
      validationWarnings.push({
        secret: name,
        warning: errorMsg,
        description: definition.description,
      });
    }
  }

  // Check pattern
  if (definition.pattern && !definition.pattern.test(value)) {
    validationErrors.push({
      secret: name,
      error: `${name} format is invalid`,
      description: definition.description,
      expected: `Must match pattern: ${definition.pattern}`,
    });
    return false;
  }

  return true;
}

/**
 * Validate all secrets
 */
function validateAllSecrets() {
  console.log(`\n🔐 Validating secrets for environment: ${NODE_ENV}\n`);

  let allValid = true;

  for (const [name, definition] of Object.entries(secretDefinitions)) {
    const isValid = validateSecret(name, definition);
    if (!isValid) {
      allValid = false;
    }
  }

  // Display warnings
  if (validationWarnings.length > 0) {
    console.warn('⚠️  Configuration Warnings:');
    validationWarnings.forEach(({ secret, warning, description }) => {
      console.warn(`   • ${secret}: ${warning}`);
      if (description) {
        console.warn(`     ${description}`);
      }
    });
    console.warn('');
  }

  // Display errors
  if (validationErrors.length > 0) {
    console.error('❌ Secret Validation Errors:\n');
    validationErrors.forEach(({ secret, error, description, fix }) => {
      console.error(`   • ${error}`);
      console.error('     Secret: ' + secret);
      if (description) {
        console.error(`     Description: ${description}`);
      }
      if (fix) {
        console.error(`     Fix: ${fix}`);
      }
      console.error('');
    });

    if (isProduction) {
      throw new Error(
        'Secret validation failed in production. ' +
          'Application cannot start with missing or invalid secrets. ' +
          'See errors above.'
      );
    } else if (isDevelopment) {
      console.error(
        '⚠️  Starting anyway in development mode, but please fix these issues.\n'
      );
    }
  } else {
    console.log('✅ All required secrets validated successfully\n');
  }

  return allValid;
}

/**
 * Get secret value with fallback
 */
function getSecret(name, fallback = null) {
  const value = process.env[name];

  if (!value) {
    if (fallback !== null) {
      if (!isTest && !isDevelopment) {
        console.warn(`⚠️  Using fallback value for ${name}`);
      }
      return fallback;
    }

    const definition = secretDefinitions[name];
    if (definition && definition.required) {
      throw new Error(`Required secret ${name} is not available`);
    }
  }

  return value;
}

/**
 * Check if secret exists
 */
function hasSecret(name) {
  return !!process.env[name];
}

/**
 * Get configuration status for health checks
 */
function getConfigStatus() {
  const status = {
    environment: NODE_ENV,
    secretsConfigured: 0,
    secretsMissing: 0,
    secretsWithWarnings: validationWarnings.length,
    secrets: {},
  };

  for (const [name, definition] of Object.entries(secretDefinitions)) {
    const isSet = hasSecret(name);
    status.secrets[name] = {
      configured: isSet,
      required: definition.required,
    };

    if (isSet) {
      status.secretsConfigured++;
    } else if (definition.required) {
      status.secretsMissing++;
    }
  }

  return status;
}

// Run validation on module load
if (process.env.SKIP_SECRET_VALIDATION !== 'true') {
  validateAllSecrets();
}

module.exports = {
  // Environment info
  NODE_ENV,
  isProduction,
  isDevelopment,
  isTest,

  // Secret access
  getSecret,
  hasSecret,

  // Validation
  validateAllSecrets,
  getConfigStatus,
  validationErrors,
  validationWarnings,
};
