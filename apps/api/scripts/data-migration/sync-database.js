const { sequelize } = require('../../src/config/database');
const { Course, Module, Lesson, Quiz } = require('../../src/models');

async function syncDatabase() {
  try {
    console.log('Syncing database with models...');
    
    // Sync all models
    await sequelize.sync({ alter: true });
    
    console.log('Database synced successfully!');
    await sequelize.close();
  } catch (error) {
    console.error('Database sync failed:', error);
    await sequelize.close();
    process.exit(1);
  }
}

if (require.main === module) {
  syncDatabase();
}