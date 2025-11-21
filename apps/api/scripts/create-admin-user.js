/* eslint-env node */
/* global require, process, console */

// Load database and models (env resolution handled by config/database)
import {
  sequelize,
  User,
  Role,
  UserRole,
  initializeAssociations,
} from '../src/models/index.js';
import { register } from '../src/services/authService.js';

async function adminExists() {
  initializeAssociations();
  // Ensure roles table checked first
  const adminRole = await Role.findOne({ where: { name: 'admin' } });
  if (adminRole) {
    const userRole = await UserRole.findOne({
      where: { roleId: adminRole.id },
    });
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
  if (!user || !user.id) {
    throw new Error('Cannot assign admin role: user is missing or has no id');
  }
  if (!adminRole || !adminRole.id) {
    throw new Error('Cannot assign admin role: role is missing or has no id');
  }
  // Set legacy role column for compatibility
  if (user.role !== 'admin') {
    await user.update({ role: 'admin' });
  }
  // Ensure many-to-many mapping exists
  const existing = await UserRole.findOne({
    where: { userId: user.id, roleId: adminRole.id },
  });
  if (!existing) {
    await UserRole.create({
      userId: user.id,
      roleId: adminRole.id,
      assignedAt: new Date(),
    });
  }
}

async function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check');
  const forceReplace = args.includes('--force-replace');
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

    if (exists && !forceReplace) {
      console.log('Admin user already exists.');
      // Check if we're in a non-interactive environment
      if (!process.stdin.isTTY) {
        console.log('Skipping creation (non-interactive mode).');
        return;
      }

      // Interactive prompt to replace existing admin
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const answer = await new Promise((resolve) => {
        rl.question(
          'Would you like to replace the existing admin user with a new one? (y/N): ',
          (answer) => {
            rl.close();
            resolve(answer.toLowerCase());
          }
        );
      });

      if (answer !== 'y' && answer !== 'yes') {
        console.log('Keeping existing admin user.');
        return;
      }

      // Delete existing admin users
      console.log('Removing existing admin users...');
      const adminRole = await Role.findOne({ where: { name: 'admin' } });
      if (adminRole) {
        // Remove user role associations first
        await UserRole.destroy({ where: { roleId: adminRole.id } });
        // Update legacy admin users
        await User.update({ role: 'student' }, { where: { role: 'admin' } });
      }
    }

    const email = (process.env.ADMIN_EMAIL || '').trim();
    const password = (process.env.ADMIN_PASSWORD || '').trim();
    const firstName = (process.env.ADMIN_FIRST_NAME || 'Admin').trim();
    const lastName = (process.env.ADMIN_LAST_NAME || 'User').trim();

    if (!email || !password) {
      console.error(
        'Missing ADMIN_EMAIL or ADMIN_PASSWORD environment variables.'
      );
      process.exit(1);
    }

    // If user already exists, update details; otherwise register
    let createdUser = await User.findOne({ where: { email } });
    if (createdUser) {
      await createdUser.update({ firstName, lastName, passwordHash: password });
    } else {
      // Create user via auth service (enforces password strength and hooks)
      const regResult = await register({
        email,
        firstName,
        lastName,
        password,
      });
      // Load a full Sequelize instance using the returned id to avoid any lookup mismatch
      createdUser = await User.findByPk(regResult.user.id);
      if (!createdUser) {
        throw new Error(
          `User creation succeeded but lookup failed for email ${email}`
        );
      }
    }

    const adminRole = await ensureAdminRole();
    await assignAdminRole(createdUser, adminRole);

    console.log(`Admin user created: ${email}`);
  } catch (err) {
    console.error(
      'Admin creation failed:',
      err && err.message ? err.message : err
    );
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
