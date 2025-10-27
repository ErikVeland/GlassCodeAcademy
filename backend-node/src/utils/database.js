const sequelize = require('../config/database');
const { initializeAssociations } = require('../models');

const initializeDatabase = async () => {
  try {
    // Test the database connection
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Initialize model associations
    initializeAssociations();
    
    // Sync models with database
    // In production, rely on migrations by default to avoid destructive/locking changes.
    // Allow opt-in via env flags: DB_SYNC=true and optional DB_SYNC_ALTER=true.
    const nodeEnv = (process.env.NODE_ENV || '').toLowerCase();
    const isProd = nodeEnv === 'production';
    const dbSyncFlag = (process.env.DB_SYNC || '').toLowerCase() === 'true';
    const dbSyncAlterFlag = (process.env.DB_SYNC_ALTER || '').toLowerCase() === 'true';

    if (!isProd || dbSyncFlag) {
      const useAlter = !isProd || dbSyncAlterFlag; // alter in non-prod, opt-in in prod
      await sequelize.sync({ alter: useAlter });
      console.log(
        `Database models synchronized successfully (env="${nodeEnv}", alter=${useAlter}).`
      );
    } else {
      console.log('Skipping sequelize.sync in production; schema managed by migrations.');
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

module.exports = initializeDatabase;