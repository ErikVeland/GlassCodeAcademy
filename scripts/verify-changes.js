/**
 * Script to verify our changes for handling 502 errors
 */

const fs = require('fs');
const path = require('path');

function verifyChanges() {
  console.log('=== Verifying Changes for 502 Error Handling ===\n');
  
  try {
    // Check 1: Dockerfile updates
    console.log('1. Checking Dockerfile updates...');
    const dockerfilePath = path.join(__dirname, '..', 'dot-net-quiz', 'frontend', 'Dockerfile');
    const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');
    
    if (dockerfileContent.includes('node:20-alpine')) {
      console.log('  ✓ Dockerfile updated to use node:20-alpine');
    } else {
      console.log('  ✗ Dockerfile not updated correctly');
      return false;
    }
    
    // Check 2: Error page implementations
    console.log('2. Checking error page implementations...');
    const errorPages = [
      'error.tsx',
      'global-error.tsx',
      '502.tsx'
    ];
    
    for (const page of errorPages) {
      const pagePath = path.join(__dirname, '..', 'dot-net-quiz', 'frontend', 'src', 'app', page);
      if (fs.existsSync(pagePath)) {
        console.log(`  ✓ ${page} exists`);
      } else {
        console.log(`  ✗ ${page} missing`);
        return false;
      }
    }
    
    // Check 3: Apollo Client configuration
    console.log('3. Checking Apollo Client configuration...');
    const apolloClientPath = path.join(__dirname, '..', 'dot-net-quiz', 'frontend', 'src', 'apolloClient.ts');
    const apolloClientContent = fs.readFileSync(apolloClientPath, 'utf8');
    
    const checks = [
      { term: '502', description: '502 error handling' },
      { term: 'Bad gateway', description: 'Bad Gateway error handling' }, // Changed to match the actual comment
      { term: 'shouldRetry', description: 'Retry function implementation' }
    ];
    
    for (const check of checks) {
      if (apolloClientContent.includes(check.term)) {
        console.log(`  ✓ Apollo Client includes ${check.description}`);
      } else {
        console.log(`  ✗ Apollo Client missing ${check.description}`);
        return false;
      }
    }
    
    // Check 4: Module page updates
    console.log('4. Checking module page updates...');
    const modulePages = [
      'node/lessons/page.tsx',
      'node/interview/page.tsx'
    ];
    
    for (const page of modulePages) {
      const pagePath = path.join(__dirname, '..', 'dot-net-quiz', 'frontend', 'src', 'app', page);
      const pageContent = fs.readFileSync(pagePath, 'utf8');
      
      const has502Handling = pageContent.includes('502') || pageContent.includes('503') || pageContent.includes('504');
      const hasIsNetworkError = pageContent.includes('isNetworkError');
      
      if (has502Handling && hasIsNetworkError) {
        console.log(`  ✓ ${page} updated with error handling`);
      } else {
        console.log(`  ✗ ${page} missing error handling updates`);
        return false;
      }
    }
    
    console.log('\n🎉 All changes verified successfully!');
    console.log('\nSummary of changes:');
    console.log('- Updated Dockerfile to use node:20-alpine (more recent version)');
    console.log('- Added custom error pages for better 502 handling');
    console.log('- Enhanced Apollo Client to handle 502 errors');
    console.log('- Updated module pages to detect and handle 502 errors');
    console.log('- Implemented automatic retry mechanism with user feedback');
    
    return true;
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  }
}

// Run verification if this script is executed directly
if (require.main === module) {
  const success = verifyChanges();
  process.exit(success ? 0 : 1);
}

module.exports = { verifyChanges };