/* eslint-env node */
/* global require, process, console */

// Update a user's password via Sequelize so model hooks re-hash correctly
(async () => {
  try {
    const args = process.argv.slice(2);
    const emailArgIndex = args.findIndex((a) => a === '--email');
    const passwordArgIndex = args.findIndex((a) => a === '--password');

    const cliEmail = emailArgIndex !== -1 ? args[emailArgIndex + 1] : undefined;
    const cliPassword = passwordArgIndex !== -1 ? args[passwordArgIndex + 1] : undefined;

    const targetEmail = (process.env.TARGET_EMAIL || cliEmail || '').trim();
    const targetPassword = (process.env.TARGET_PASSWORD || cliPassword || '').trim();

    if (!targetEmail || !targetPassword) {
      console.error('Missing target email or password. Provide via TARGET_EMAIL/TARGET_PASSWORD env or --email/--password CLI args.');
      process.exit(1);
    }

    const { sequelize, User, initializeAssociations } = require('../src/models');
    initializeAssociations();

    const user = await User.findOne({ where: { email: targetEmail } });
    if (!user) {
      console.error(`User not found: ${targetEmail}`);
      process.exit(2);
    }

    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(targetPassword, salt);
    // Save pre-hashed password and disable hooks to avoid double hashing
    user.passwordHash = hashed;
    await user.save({ hooks: false });

    console.log(`Password updated for: ${targetEmail}`);

    await sequelize.close();
  } catch (err) {
    console.error('Update failed:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();