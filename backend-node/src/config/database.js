const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Prefer .env.production when NODE_ENV=production; otherwise fall back to .env
(function loadEnv() {
  try {
    const isProd = process.env.NODE_ENV === 'production';
    const candidates = isProd
      ? [
          path.resolve(__dirname, '../../.env.production'),
          path.resolve(__dirname, '../../.env'),
        ]
      : [
          path.resolve(__dirname, '../../.env'),
          path.resolve(__dirname, '../../.env.production'),
        ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        dotenv.config({ path: p });
        return;
      }
    }
    // Fallback to default behavior
    dotenv.config();
  } catch {
    dotenv.config();
  }
})();

const isTest = process.env.NODE_ENV === 'test';
let databaseUrl = process.env.DATABASE_URL;

// Normalize sqlite path to absolute, anchored at backend-node directory
if (databaseUrl && databaseUrl.startsWith('sqlite:')) {
  const rawPath = databaseUrl.replace(/^sqlite:/, '');
  if (rawPath && !rawPath.startsWith('/') && rawPath !== ':memory:') {
    const anchorDir = path.resolve(__dirname, '../../');
    const resolved = path.resolve(anchorDir, rawPath);
    databaseUrl = `sqlite:${resolved}`;
  }
}

// Discrete env vars fallback
const DB_DIALECT = process.env.DB_DIALECT || 'postgres';
const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined;
const DB_NAME = process.env.DB_NAME;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_SSL = (process.env.DB_SSL || '').toLowerCase() === 'true';

let sequelize;

if (isTest) {
  const useRealDb =
    (process.env.USE_REAL_DB_FOR_TESTS || '').toLowerCase() === 'true';
  const testDatabaseUrl = process.env.TEST_DATABASE_URL || databaseUrl;

  if (useRealDb && testDatabaseUrl) {
    sequelize = new Sequelize(testDatabaseUrl, {
      dialect: DB_DIALECT,
      logging: false,
      define: {
        timestamps: true,
        underscored: true,
      },
      dialectOptions: DB_SSL
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : undefined,
    });
  } else {
    // Default to in-memory SQLite for unit tests
    sequelize = new Sequelize('sqlite::memory:', {
      dialect: 'sqlite',
      logging: false,
      define: {
        timestamps: true,
        underscored: true,
      },
    });
  }
} else if (databaseUrl) {
  // Prefer DATABASE_URL when provided (e.g., postgresql://user:pass@host:port/db)
  const inferredDialect = databaseUrl.startsWith('sqlite:')
    ? 'sqlite'
    : DB_DIALECT;
  sequelize = new Sequelize(databaseUrl, {
    dialect: inferredDialect,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
    },
    dialectOptions: DB_SSL
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : undefined,
  });
  // Development-time visibility into DB configuration
  if (process.env.NODE_ENV === 'development') {
    try {
      const info = {
        dialect: inferredDialect,
        url: databaseUrl,
        storage:
          inferredDialect === 'sqlite'
            ? databaseUrl.replace(/^sqlite:/, '')
            : undefined,
      };
      console.log('[DB Config]', info);
    } catch {
      // ignore logging errors
    }
  }
} else if (DB_HOST && DB_NAME && DB_USER) {
  // Fallback to discrete env configuration when DATABASE_URL is missing
  sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: DB_DIALECT,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
    },
    dialectOptions: DB_SSL
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : undefined,
  });
} else {
  // Provide a clear error message instead of crashing on undefined URL
  throw new Error(
    'DATABASE_URL is not set and discrete DB_* variables are incomplete.\n' +
      'Configure one of the following:\n' +
      '1) Set DATABASE_URL (e.g., postgresql://user:pass@host:5432/dbname)\n' +
      '2) Set DB_DIALECT, DB_HOST, DB_PORT, DB_NAME, DB_USER, and DB_PASSWORD.'
  );
}

module.exports = sequelize;
