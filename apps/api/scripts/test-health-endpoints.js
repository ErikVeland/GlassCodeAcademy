#!/usr/bin/env node

/**
 * Script to test the new health endpoints
 */

const http = require('http');

// Test endpoints
const endpoints = ['/api/health', '/api/health/detailed', '/api/metrics'];

// Test function
async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 8081,
      path: endpoint,
      method: 'GET',
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          endpoint,
          statusCode: res.statusCode,
          success: res.statusCode >= 200 && res.statusCode < 300,
          data: data.substring(0, 200) + (data.length > 200 ? '...' : ''),
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        endpoint,
        success: false,
        error: error.message,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        endpoint,
        success: false,
        error: 'Request timeout',
      });
    });

    req.end();
  });
}

// Main test function
async function runTests() {
  console.log('Testing health endpoints...\n');

  const results = [];

  for (const endpoint of endpoints) {
    console.log(`Testing ${endpoint}...`);
    const result = await testEndpoint(endpoint);
    results.push(result);

    if (result.success) {
      console.log(`  ✅ Success (${result.statusCode})`);
    } else {
      console.log(
        `  ❌ Failed: ${result.error || 'Status ' + result.statusCode}`
      );
    }
  }

  console.log('\n--- Test Summary ---');
  let passed = 0;

  for (const result of results) {
    if (result.success) {
      passed++;
      console.log(`✅ ${result.endpoint}`);
    } else {
      console.log(`❌ ${result.endpoint} - ${result.error || 'Failed'}`);
    }
  }

  console.log(`\nPassed: ${passed}/${results.length}`);

  if (passed === results.length) {
    console.log('🎉 All health endpoints are working correctly!');
    process.exit(0);
  } else {
    console.log('⚠️  Some endpoints failed. Please check the API server.');
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Test failed with error:', error);
  process.exit(1);
});
