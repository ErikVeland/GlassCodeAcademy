const { Sequelize } = require('sequelize');
const path = require('path');

/**
 * Test Database Utilities
 * Creates an in-memory SQLite database for testing
 */

let sequelize = null;

/**
 * Initialize test database
 * @returns {Promise<Sequelize>}
 */
async function initTestDatabase() {
  // Use SQLite in-memory database for tests
  sequelize = new Sequelize('sqlite::memory:', {
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
    },
  });

  // Import models
  const db = require('../../models');
  
  // Sync all models
  await db.sequelize.sync({ force: true });

  return sequelize;
}

/**
 * Close test database connection
 * @returns {Promise<void>}
 */
async function closeTestDatabase() {
  if (sequelize) {
    await sequelize.close();
    sequelize = null;
  }
}

/**
 * Clear all tables in the test database
 * @returns {Promise<void>}
 */
async function clearDatabase() {
  if (!sequelize) {
    throw new Error('Database not initialized');
  }

  const models = Object.keys(sequelize.models);
  
  for (const modelName of models) {
    await sequelize.models[modelName].destroy({
      where: {},
      force: true,
      truncate: true,
    });
  }
}

/**
 * Get test database instance
 * @returns {Sequelize}
 */
function getTestDatabase() {
  return sequelize;
}

module.exports = {
  initTestDatabase,
  closeTestDatabase,
  clearDatabase,
  getTestDatabase,
};
