/**
 * Fullstack Academy Test Runner
 * Runs all module tests
 */

const { testReactModule } = require('./test-react-module');
const { testLaravel } = require('./test-laravel-module');
const { testNodeModule } = require('./test-node-module');
const { testCssModules } = require('./test-css-modules');
const { testDesignSystem } = require('./test-design-system');

async function runAllTests() {
  console.log('🚀 Starting Fullstack Academy Test Suite\n');
  
  const results = [];
  
  // Run Design System tests
  try {
    console.log('1. Running Design System Tests...');
    const designResult = testDesignSystem();
    results.push({ module: 'Design System', passed: designResult });
  } catch (error) {
    console.error('Design System tests failed:', error.message);
    results.push({ module: 'Design System', passed: false });
  }
  
  // Run React module tests
  try {
    console.log('2. Running React Module Tests...');
    const reactResult = testReactModule();
    results.push({ module: 'React', passed: reactResult });
  } catch (error) {
    console.error('React module tests failed:', error.message);
    results.push({ module: 'React', passed: false });
  }
  
  // Run Laravel module tests
  try {
    console.log('3. Running Laravel Module Tests...');
    const laravelResult = testLaravel();
    results.push({ module: 'Laravel', passed: laravelResult });
  } catch (error) {
    console.error('Laravel module tests failed:', error.message);
    results.push({ module: 'Laravel', passed: false });
  }
  
  // Run Node.js module tests
  try {
    console.log('4. Running Node.js Module Tests...');
    const nodeResult = testNodeModule();
    results.push({ module: 'Node.js', passed: nodeResult });
  } catch (error) {
    console.error('Node.js module tests failed:', error.message);
    results.push({ module: 'Node.js', passed: false });
  }
  
  // Run CSS module tests
  try {
    console.log('5. Running CSS Module Tests...');
    const cssResult = testCssModules();
    results.push({ module: 'CSS', passed: cssResult });
  } catch (error) {
    console.error('CSS module tests failed:', error.message);
    results.push({ module: 'CSS', passed: false });
  }
  
  // Summary
  console.log('\n=== Test Results Summary ===');
  let allPassed = true;
  
  for (const result of results) {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`${result.module} Module: ${status}`);
    if (!result.passed) allPassed = false;
  }
  
  console.log('\n' + '='.repeat(30));
  if (allPassed) {
    console.log('🎉 All tests passed! The Fullstack Academy platform is ready for deployment.');
    return true;
  } else {
    console.log('❌ Some tests failed. Please review the output above and fix the issues.');
    return false;
  }
}

// Run all tests if this script is executed directly
if (require.main === module) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test runner failed:', error.message);
    process.exit(1);
  });
}

module.exports = { runAllTests };