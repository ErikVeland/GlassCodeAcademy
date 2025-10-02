/**
 * Script to verify Dockerfile configurations
 */

const fs = require('fs');
const path = require('path');

function verifyDockerfiles() {
  console.log('=== Verifying Dockerfile Configurations ===\n');
  
  try {
    const frontendDir = path.join(__dirname, '..', 'dot-net-quiz', 'frontend');
    const backendDir = path.join(__dirname, '..', 'dot-net-quiz', 'backend');
    
    let allChecksPassed = true;
    
    // Check frontend Dockerfiles
    console.log('1. Checking frontend Dockerfiles...');
    const frontendDockerfile = path.join(frontendDir, 'Dockerfile');
    const frontendAlternative = path.join(frontendDir, 'Dockerfile.alternative');
    
    if (fs.existsSync(frontendDockerfile)) {
      const content = fs.readFileSync(frontendDockerfile, 'utf8');
      console.log('  ✓ Frontend Dockerfile exists');
      
      // Check for common base images
      if (content.includes('FROM node:18-alpine')) {
        console.log('  ✓ Using node:18-alpine base image');
      } else if (content.includes('FROM node:')) {
        console.log('  ⚠ Using alternative Node.js base image');
      } else {
        console.log('  ✗ No Node.js base image found');
        allChecksPassed = false;
      }
    } else {
      console.log('  ✗ Frontend Dockerfile not found');
      allChecksPassed = false;
    }
    
    if (fs.existsSync(frontendAlternative)) {
      console.log('  ✓ Frontend alternative Dockerfile exists');
    }
    
    // Check backend Dockerfiles
    console.log('\n2. Checking backend Dockerfiles...');
    const backendDockerfile = path.join(backendDir, 'Dockerfile');
    const backendAlternative = path.join(backendDir, 'Dockerfile.alternative');
    
    if (fs.existsSync(backendDockerfile)) {
      const content = fs.readFileSync(backendDockerfile, 'utf8');
      console.log('  ✓ Backend Dockerfile exists');
      
      // Check for common base images
      if (content.includes('FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine')) {
        console.log('  ✓ Using .NET 8.0 Alpine base image');
      } else if (content.includes('FROM mcr.microsoft.com/dotnet/aspnet:')) {
        console.log('  ⚠ Using alternative .NET base image');
      } else {
        console.log('  ✗ No .NET base image found');
        allChecksPassed = false;
      }
    } else {
      console.log('  ✗ Backend Dockerfile not found');
      allChecksPassed = false;
    }
    
    if (fs.existsSync(backendAlternative)) {
      console.log('  ✓ Backend alternative Dockerfile exists');
    }
    
    // Summary
    console.log('\n=== Verification Summary ===');
    if (allChecksPassed) {
      console.log('🎉 All Dockerfile configurations verified successfully!');
      console.log('\nYour Dockerfiles are properly configured and should work with Render.');
      console.log('If you still encounter authentication issues, try switching to the alternative Dockerfiles:');
      console.log('  node scripts/switch-dockerfiles.js --alternative');
    } else {
      console.log('❌ Some Dockerfile configurations need attention.');
      console.log('Please check the issues listed above and fix them before deploying.');
    }
    
    return allChecksPassed;
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  }
}

// Run verification if this script is executed directly
if (require.main === module) {
  const success = verifyDockerfiles();
  process.exit(success ? 0 : 1);
}

module.exports = { verifyDockerfiles };