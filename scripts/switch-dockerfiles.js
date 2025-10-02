/**
 * Script to switch between different Dockerfile versions
 */

const fs = require('fs');
const path = require('path');

function switchDockerfiles(useAlternative = false) {
  console.log(`Switching Dockerfiles to ${useAlternative ? 'alternative' : 'standard'} versions...`);
  
  try {
    const frontendDir = path.join(__dirname, '..', 'dot-net-quiz', 'frontend');
    const backendDir = path.join(__dirname, '..', 'dot-net-quiz', 'backend');
    
    // Handle frontend Dockerfiles
    const frontendStandard = path.join(frontendDir, 'Dockerfile');
    const frontendAlternative = path.join(frontendDir, 'Dockerfile.alternative');
    const frontendBackup = path.join(frontendDir, 'Dockerfile.backup');
    
    if (useAlternative) {
      // Backup current Dockerfile
      if (fs.existsSync(frontendStandard)) {
        fs.renameSync(frontendStandard, frontendBackup);
        console.log('  ✓ Backed up frontend Dockerfile');
      }
      
      // Use alternative Dockerfile
      if (fs.existsSync(frontendAlternative)) {
        fs.copyFileSync(frontendAlternative, frontendStandard);
        console.log('  ✓ Switched to alternative frontend Dockerfile');
      }
    } else {
      // Restore original Dockerfile
      if (fs.existsSync(frontendBackup)) {
        if (fs.existsSync(frontendStandard)) {
          fs.unlinkSync(frontendStandard);
        }
        fs.renameSync(frontendBackup, frontendStandard);
        console.log('  ✓ Restored original frontend Dockerfile');
      }
    }
    
    // Handle backend Dockerfiles
    const backendStandard = path.join(backendDir, 'Dockerfile');
    const backendAlternative = path.join(backendDir, 'Dockerfile.alternative');
    const backendBackup = path.join(backendDir, 'Dockerfile.backup');
    
    if (useAlternative) {
      // Backup current Dockerfile
      if (fs.existsSync(backendStandard)) {
        fs.renameSync(backendStandard, backendBackup);
        console.log('  ✓ Backed up backend Dockerfile');
      }
      
      // Use alternative Dockerfile
      if (fs.existsSync(backendAlternative)) {
        fs.copyFileSync(backendAlternative, backendStandard);
        console.log('  ✓ Switched to alternative backend Dockerfile');
      }
    } else {
      // Restore original Dockerfile
      if (fs.existsSync(backendBackup)) {
        if (fs.existsSync(backendStandard)) {
          fs.unlinkSync(backendStandard);
        }
        fs.renameSync(backendBackup, backendStandard);
        console.log('  ✓ Restored original backend Dockerfile');
      }
    }
    
    console.log('\n🎉 Dockerfile switching completed successfully!');
    console.log(`\nNext steps:`);
    console.log(`1. Commit and push the changes to your repository`);
    console.log(`2. Trigger a new deployment on Render`);
    console.log(`3. Monitor the deployment logs for success`);
    
    if (useAlternative) {
      console.log(`\n📝 Note: You're now using the alternative Dockerfiles which may resolve authentication issues.`);
    } else {
      console.log(`\n📝 Note: You're now using the standard Dockerfiles.`);
    }
    
  } catch (error) {
    console.error('❌ Error switching Dockerfiles:', error.message);
    process.exit(1);
  }
}

// Run the script if executed directly
if (require.main === module) {
  const useAlternative = process.argv.includes('--alternative') || process.argv.includes('-a');
  switchDockerfiles(useAlternative);
}

module.exports = { switchDockerfiles };