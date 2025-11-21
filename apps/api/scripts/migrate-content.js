const { exec } = require('child_process');
const path = require('path');

// Run the content migration script
const migrationScript = path.join(
  __dirname,
  '../../scripts/migration/importer.js'
);

console.log('🔄 Starting content migration to Node.js backend database...');

exec(`node ${migrationScript}`, (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Migration failed: ${error.message}`);
    console.error(`stderr: ${stderr}`);
    process.exit(1);
  }

  if (stderr) {
    console.error(`⚠️  Migration warnings: ${stderr}`);
  }

  console.log(`✅ Migration output:\n${stdout}`);
  console.log('✅ Content migration completed successfully!');
});
