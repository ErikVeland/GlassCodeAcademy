const { rollbackMigration } = require('./robust-migrate-content');

async function testRollback() {
  console.log('Testing rollback functionality...');
  
  try {
    await rollbackMigration();
    console.log('Rollback test completed successfully!');
  } catch (error) {
    console.error('Rollback test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  testRollback();
}