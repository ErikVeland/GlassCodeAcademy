const sequelize = require('../src/config/database');
const { initializeAssociations } = require('../src/models');

async function runMigrations() {
  try {
    // Initialize model associations
    initializeAssociations();
    
    // Sync all models
    await sequelize.sync({ alter: true });
    
    console.log('Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database migration failed:', error);
    process.exit(1);
  }
}

runMigrations();