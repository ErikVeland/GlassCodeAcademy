const sequelize = require('../config/database');
const { initializeAssociations } = require('../models');
const { createDefaultBadges } = require('./defaultBadges');

const initializeDatabase = async () => {
  try {
    // Test the database connection
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Initialize model associations
    initializeAssociations();

    // Sync models with database
    // DISABLED: Relying on migrations only to avoid sync loop
    // In production, rely on migrations by default to avoid destructive/locking changes.
    // Allow opt-in via env flags: DB_SYNC=true and optional DB_SYNC_ALTER=true.
    const nodeEnv = (process.env.NODE_ENV || '').toLowerCase();
    const dbSyncFlag = (process.env.DB_SYNC || '').toLowerCase() === 'true';
    const dbSyncAlterFlag =
      (process.env.DB_SYNC_ALTER || '').toLowerCase() === 'true';

    if (dbSyncFlag) {
      // Only sync if explicitly enabled via DB_SYNC=true
      // Avoid destructive alter operations on SQLite (schema migration issues)
      const isSqlite = sequelize.getDialect() === 'sqlite';
      const useAlter = dbSyncAlterFlag && !isSqlite;
      await sequelize.sync({ alter: useAlter });
      console.log(
        `Database models synchronized successfully (env="${nodeEnv}", dialect=${sequelize.getDialect()}, alter=${useAlter}).`
      );
    } else {
      console.log('Skipping sequelize.sync; schema managed by migrations.');
    }
    // Create default badges
    await createDefaultBadges();
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

module.exports = initializeDatabase;
