/* eslint-env node */
/* global require, __dirname, process, console */
const fs = require('fs');
const path = require('path');
const sequelize = require('../src/config/database');

async function runMigrations() {
  try {
    // Authenticate database connection
    await sequelize.authenticate();
    console.log('Database connection established');

    // Get list of migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort();

    console.log(`Found ${migrationFiles.length} migrations`);

    // Run each migration
    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      const migration = require(path.join(migrationsDir, file));
      
      // Run the up function
      if (migration.up) {
        const queryInterface = sequelize.getQueryInterface();
        try {
          await migration.up({ queryInterface, Sequelize: sequelize.constructor });
          console.log(`Migration ${file} completed successfully`);
        } catch (error) {
          // If it's a duplicate index/column or unique constraint error, continue
          const code = error.parent && error.parent.code;
          if (code === '42P07' || code === '42701' || code === '23505' || code === '42710') {
            console.log(`Migration ${file} skipped for existing objects (code ${code})`);
          } else {
            throw error;
          }
        }
      }
    }

    console.log('All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();