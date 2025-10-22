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
    await sequelize.sync({ alter: true });
    console.log('Database models synchronized successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

module.exports = initializeDatabase;