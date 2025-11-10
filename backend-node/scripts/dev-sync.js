const sequelize = require('../src/config/database');
const { initializeAssociations } = require('../src/models');

async function main() {
  try {
    await sequelize.authenticate();
    console.log('DB connection OK');
    // Ensure all models are loaded and associations are initialized
    initializeAssociations();

    const nodeEnv = (process.env.NODE_ENV || '').toLowerCase();
    const useAlter = true; // safe for local dev, ensures columns are added
    await sequelize.sync({ alter: useAlter });
    console.log(`Sequelize sync completed (env="${nodeEnv}", alter=${useAlter}).`);

    // Print a quick summary of some key tables existing
    const [tables] = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
    );
    console.log('Tables present:', tables.map((t) => t.name).join(', '));
    process.exit(0);
  } catch (err) {
    console.error('Dev sync failed:', err);
    process.exit(1);
  }
}

main();