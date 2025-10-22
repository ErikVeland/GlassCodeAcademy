const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const isTest = process.env.NODE_ENV === 'test';
const databaseUrl = process.env.DATABASE_URL;

let sequelize;

if (isTest && !databaseUrl) {
  // Use in-memory SQLite for tests when DATABASE_URL is not provided
  sequelize = new Sequelize('sqlite::memory:', {
    dialect: 'sqlite',
    logging: false,
    define: {
      timestamps: true,
      underscored: true
    }
  });
} else {
  // Default to PostgreSQL using DATABASE_URL
  sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true
    }
  });
}

module.exports = sequelize;