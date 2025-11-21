#!/usr/bin/env node

// Wrapper script for database migrations
// This script exists to maintain compatibility with scripts that expect run-migrations.js
// It simply delegates to the actual migrate.js script

const { spawn } = require('child_process');
const path = require('path');

// Get the directory of this script
const scriptDir = path.dirname(__filename);

// Path to the actual migrate.js script
const migrateScript = path.join(scriptDir, 'migrate.js');

// Spawn the migrate.js script with the same arguments
const child = spawn('node', [migrateScript, ...process.argv.slice(2)], {
  stdio: 'inherit',
});

// Handle exit codes
child.on('close', (code) => {
  process.exit(code);
});

// Handle errors
child.on('error', (error) => {
  console.error('Failed to start migrate script:', error);
  process.exit(1);
});
