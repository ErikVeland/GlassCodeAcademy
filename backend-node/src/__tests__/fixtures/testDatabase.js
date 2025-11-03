// Test Database Utilities sourcing the same Sequelize instance as the models
// This ensures associations and model registrations are consistent in tests.

const { sequelize, initializeAssociations } = require('../../models');
const { createDefaultBadges } = require('../../utils/defaultBadges');

/**
 * Initialize and sync test database (sqlite::memory: when NODE_ENV=test)
 */
async function setupTestDb() {
  // Initialize associations once
  initializeAssociations();
  // Force sync to start with a clean schema per test suite
  await sequelize.sync({ force: true });
  // Seed default badges to satisfy badges-related integration tests
  await createDefaultBadges();
}

/**
 * Close test database connection
 */
async function teardownTestDb() {
  await sequelize.close();
}

/**
 * Clear all tables between tests
 */
async function clearDatabase() {
  const models = Object.keys(sequelize.models);
  for (const modelName of models) {
    await sequelize.models[modelName].destroy({
      where: {},
      force: true,
      truncate: true,
    });
  }
  // Reseed default badges so tests depending on them continue to pass
  await createDefaultBadges();
}

module.exports = {
  setupTestDb,
  teardownTestDb,
  clearDatabase,
};
