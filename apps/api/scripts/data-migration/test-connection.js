const { sequelize } = require('../../src/config/database');

async function testConnection() {
  try {
    console.log('Testing database connection...');

    // Test the connection
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    // Get list of tables
    const tables = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
      { type: sequelize.QueryTypes.SELECT }
    );

    console.log('Tables in database:');
    console.log(tables);

    await sequelize.close();
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    await sequelize.close();
    process.exit(1);
  }
}

if (require.main === module) {
  testConnection();
}
