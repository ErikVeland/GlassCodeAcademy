const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
(function loadEnv() {
  try {
    const isProd = process.env.NODE_ENV === 'production';
    const candidates = isProd
      ? [
        path.resolve(__dirname, '../.env.production'),
        path.resolve(__dirname, '../.env'),
      ]
      : [
        path.resolve(__dirname, '../.env'),
        path.resolve(__dirname, '../.env.production'),
      ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        dotenv.config({ path: p });
        return;
      }
    }
    dotenv.config();
  } catch (_error) {
    dotenv.config();
  }
})();

const DB_DIALECT = process.env.DB_DIALECT || 'postgres';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432;
const DB_NAME = process.env.DB_NAME;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_SSL = (process.env.DB_SSL || '').toLowerCase() === 'true';

// Sequelize CLI configuration
module.exports = {
  development: {
    username: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    host: DB_HOST,
    port: DB_PORT,
    dialect: DB_DIALECT,
    logging: console.log,
    dialectOptions: DB_SSL
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : undefined,
    define: {
      timestamps: true,
      underscored: true,
    },
  },
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
    },
  },
  production: {
    username: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    host: DB_HOST,
    port: DB_PORT,
    dialect: DB_DIALECT,
    logging: false,
    dialectOptions: DB_SSL
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : undefined,
    define: {
      timestamps: true,
      underscored: true,
    },
  },
};