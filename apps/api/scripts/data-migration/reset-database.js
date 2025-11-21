const { sequelize } = require('../../src/config/database');
const { Course, Module, Lesson, Quiz } = require('../../src/models');

async function resetDatabase() {
  try {
    console.log('Resetting database tables...');

    // Drop all tables
    await sequelize.getQueryInterface().dropTable('quizzes', { cascade: true });
    await sequelize.getQueryInterface().dropTable('lessons', { cascade: true });
    await sequelize.getQueryInterface().dropTable('modules', { cascade: true });
    await sequelize.getQueryInterface().dropTable('courses', { cascade: true });

    console.log('All tables dropped successfully!');

    // Recreate tables based on models
    await sequelize.sync({ force: true });

    console.log('Database tables recreated successfully!');
    await sequelize.close();
  } catch (error) {
    console.error('Database reset failed:', error);
    await sequelize.close();
    process.exit(1);
  }
}

if (require.main === module) {
  resetDatabase();
}
