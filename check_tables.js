const { Sequelize } = require('./backend-node/node_modules/sequelize');

// Create a new Sequelize instance
const sequelize = new Sequelize('glasscode_dev', 'glasscode_user', 'secure_password_change_me', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false
});

async function checkTables() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    
    // Get all table names
    const queryInterface = sequelize.getQueryInterface();
    const tableNames = await queryInterface.showAllTables();
    console.log('All tables:');
    console.log(tableNames);
    
    // Check columns in courses table if it exists
    if (tableNames.includes('courses')) {
      const tableInfo = await queryInterface.describeTable('courses');
      console.log('Courses table columns:');
      console.log(tableInfo);
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

checkTables();