/* eslint-env node */
/* global require, process, console */

// Load database and models (env resolution handled by config/database)
const { sequelize, User, Role, UserRole, initializeAssociations } = require('../src/models');
const { register } = require('../src/services/authService');

async function adminExists() {
  initializeAssociations();
  // Ensure roles table checked first
  const adminRole = await Role.findOne({ where: { name: 'admin' } });
  if (adminRole) {
    const userRole = await UserRole.findOne({ where: { roleId: adminRole.id } });
    if (userRole) return true;
  }
  // Fallback: legacy users with role column set
  const legacyAdmin = await User.findOne({ where: { role: 'admin' } });
  return !!legacyAdmin;
}

async function ensureAdminRole() {
  const [role] = await Role.findOrCreate({
    where: { name: 'admin' },
    defaults: { description: 'Administrator role' },
  });
  return role;
}

async function assignAdminRole(user, adminRole) {
  // Set legacy role column for compatibility
  if (user.role !== 'admin') {
    await user.update({ role: 'admin' });
  }
  // Ensure many-to-many mapping exists
  const existing = await UserRole.findOne({
    where: { userId: user.id, roleId: adminRole.id },
  });
  if (!existing) {
    await UserRole.create({ userId: user.id, roleId: adminRole.id, assignedAt: new Date() });
  }
}

async function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check');
  try {
    const exists = await adminExists();
    if (checkOnly) {
      if (exists) {
        console.log('Admin user already exists.');
        process.exit(0);
      } else {
        console.log('No admin user found.');
        process.exit(2);
      }
    }

    if (exists) {
      console.log('Admin user already exists. Skipping creation.');
      return;
    }

    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const firstName = process.env.ADMIN_FIRST_NAME || 'Admin';
    const lastName = process.env.ADMIN_LAST_NAME || 'User';

    if (!email || !password) {
      console.error('Missing ADMIN_EMAIL or ADMIN_PASSWORD environment variables.');
      process.exit(1);
    }

    // Create user via auth service (enforces password strength and hooks)
    await register({ email, firstName, lastName, password });
    const createdUser = await User.findOne({ where: { email } });

    const adminRole = await ensureAdminRole();
    await assignAdminRole(createdUser, adminRole);

    console.log(`Admin user created: ${email}`);
  } catch (err) {
    console.error('Admin creation failed:', err && err.message ? err.message : err);
    process.exit(1);
  } finally {
    try {
      await sequelize.close();
    } catch {
      // ignore
    }
  }
}

main();