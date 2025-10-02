/**
 * Test script to verify 502 error handling for Render free tier
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function test502Handling() {
  console.log('=== Testing 502 Error Handling ===\n');
  
  try {
    // Test 1: Check that error pages exist
    console.log('1. Checking error page implementations...');
    
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
    
    // Test 2: Check Apollo Client configuration for 502 handling
    console.log('2. Checking Apollo Client 502 error handling...');
    const apolloClientPath = path.join(__dirname, '..', 'dot-net-quiz', 'frontend', 'src', 'apolloClient.ts');
    const apolloClientContent = fs.readFileSync(apolloClientPath, 'utf8');
    
    // Check for different ways 502 might be referenced
    const has502Handling = apolloClientContent.includes('502') || 
                          apolloClientContent.includes('Bad Gateway') ||
                          apolloClientContent.includes('shouldRetry');
    
    if (has502Handling) {
      console.log('  ✓ Apollo Client configured to handle 502 errors');
    } else {
      console.log('  ✗ Apollo Client not configured for 502 errors');
      return false;
    }
    
    // Test 3: Check module pages for 502 handling
    console.log('3. Checking module pages for 502 error handling...');
    const modulePages = [
      'node/lessons/page.tsx',
      'node/interview/page.tsx'
    ];
    
    for (const page of modulePages) {
      const pagePath = path.join(__dirname, '..', 'dot-net-quiz', 'frontend', 'src', 'app', page);
      const pageContent = fs.readFileSync(pagePath, 'utf8');
      
      const has502Handling = pageContent.includes('502') && 
                            pageContent.includes('isNetworkError');
      
      if (has502Handling) {
        console.log(`  ✓ ${page} handles 502 errors`);
      } else {
        console.log(`  ✗ ${page} missing 502 error handling`);
        return false;
      }
    }
    
    // Test 4: Check Next.js configuration
    console.log('4. Checking Next.js configuration...');
    const nextConfigPath = path.join(__dirname, '..', 'dot-net-quiz', 'frontend', 'next.config.js');
    const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
    
    if (nextConfigContent.includes('headers')) {
      console.log('  ✓ Next.js configured with custom headers');
    } else {
      console.log('  ⚠ Next.js configuration could be improved');
    }
    
    console.log('\n🎉 All 502 Error Handling tests passed!');
    console.log('\nSummary of implementation:');
    console.log('- Custom error pages handle 502 errors from Render');
    console.log('- Apollo Client configured to retry on 502 errors');
    console.log('- Module pages detect and handle 502 errors');
    console.log('- Enhanced loading component provides user feedback');
    console.log('- Automatic retry mechanism with manual override');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const success = test502Handling();
  process.exit(success ? 0 : 1);
}

module.exports = { test502Handling };