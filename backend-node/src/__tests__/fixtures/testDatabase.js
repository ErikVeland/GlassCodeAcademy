// Test Database Utilities sourcing the same Sequelize instance as the models
// This ensures associations and model registrations are consistent in tests.

const { sequelize, initializeAssociations, User, Role, UserRole } = require('../../models');
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
  /**
   * Seed a user with a named role via the join table
   * Ensures the user exists, the role exists, and the relationship is created.
   */
  async seedUserWithRole(userId, roleName, userDefaults = {}) {
    const [user] = await User.findOrCreate({
      where: { id: userId },
      defaults: {
        id: userId,
        email: `user${userId}@example.com`,
        firstName: 'Test',
        lastName: 'User',
        passwordHash: 'hashedpassword',
        isActive: true,
        ...userDefaults,
      },
    });

    const [role] = await Role.findOrCreate({
      where: { name: roleName },
      defaults: { description: `${roleName} role`, isActive: true },
    });

    // Ensure association exists; use raw insert for SQLite reliability
    const existing = await UserRole.findOne({
      where: { userId: user.id, roleId: role.id },
    });
    if (!existing) {
      const assignedAt = new Date().toISOString();
      await sequelize.query(
        'INSERT INTO user_roles (user_id, role_id, assigned_at, created_at, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
        { replacements: [user.id, role.id, assignedAt] }
      );
    }

    return { user, role };
  },
};
