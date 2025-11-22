#!/usr/bin/env node

/**
 * Combined seeding script for GlassCode Academy (backend-node version)
 * Runs both basic and content seeding in sequence
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runScript(scriptName) {
  return new Promise((resolve, reject) => {
    console.log(`🌱 Running ${scriptName}...`);

    const scriptPath = path.join(__dirname, scriptName);
    const child = spawn('node', [scriptPath], {
      stdio: 'inherit',
      env: process.env,
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${scriptName} completed successfully`);
        resolve();
      } else {
        console.error(`❌ ${scriptName} failed with exit code ${code}`);
        reject(new Error(`${scriptName} failed`));
      }
    });

    child.on('error', (error) => {
      console.error(`❌ Failed to start ${scriptName}:`, error.message);
      reject(error);
    });
  });
}

async function main() {
  try {
    console.log('🌱 Starting database seeding...');

    // Run basic seeding first (academy creation)
    await runScript('seed-academy.js');

    // Then run content seeding
    await runScript('seed-content.js');

    console.log('✅ All seeding completed successfully');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default main;
