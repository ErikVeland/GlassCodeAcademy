#!/usr/bin/env node

/**
 * Cross-environment database operations test script
 * This script tests database connectivity and basic operations across different environments
 */

const https = require('https');
const http = require('http');

// Configuration for different environments
const environments = {
  local: {
    baseUrl: 'http://localhost:8080',
    name: 'Local Development'
  },
  staging: {
    baseUrl: 'https://staging.glasscode.academy',
    name: 'Staging Environment'
  },
  production: {
    baseUrl: 'https://glasscode.academy',
    name: 'Production Environment'
  }
};

// Test functions
async function testEndpoint(url, endpoint) {
  return new Promise((resolve) => {
    const fullUrl = `${url}${endpoint}`;
    console.log(`  Testing: ${fullUrl}`);
    
    const protocol = url.startsWith('https') ? https : http;
    
    const request = protocol.get(fullUrl, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        resolve({
          status: response.statusCode,
          success: response.statusCode >= 200 && response.statusCode < 300,
          data: data.substring(0, 200) + (data.length > 200 ? '...' : '')
        });
      });
    });
    
    request.on('error', (error) => {
      resolve({
        status: 'ERROR',
        success: false,
        error: error.message
      });
    });
    
    request.setTimeout(5000, () => {
      request.destroy();
      resolve({
        status: 'TIMEOUT',
        success: false,
        error: 'Request timeout'
      });
    });
  });
}

async function runEnvironmentTests(environment) {
  console.log(`\n🧪 Testing ${environment.name} (${environment.baseUrl})`);
  console.log('=' .repeat(50));
  
  const endpoints = [
    '/api/health',
    '/api/lessons-db',
    '/api/LessonQuiz',
    '/api/modules-db'
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      const result = await testEndpoint(environment.baseUrl, endpoint);
      results.push({ endpoint, ...result });
      
      if (result.success) {
        console.log(`  ✅ ${endpoint} - Status: ${result.status}`);
      } else {
        console.log(`  ❌ ${endpoint} - Status: ${result.status}`);
        if (result.error) {
          console.log(`     Error: ${result.error}`);
        }
      }
    } catch (error) {
      console.log(`  ❌ ${endpoint} - Error: ${error.message}`);
      results.push({ endpoint, status: 'EXCEPTION', success: false, error: error.message });
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\n📊 Results: ${successCount}/${results.length} endpoints successful`);
  
  return {
    environment: environment.name,
    successRate: `${successCount}/${results.length}`,
    allPassed: successCount === results.length
  };
}

async function main() {
  console.log('🚀 GlassCode Academy - Cross-Environment Database Operations Test');
  console.log('====================================================================');
  
  // Check if specific environment is requested
  const targetEnv = process.argv[2];
  const results = [];
  
  if (targetEnv && environments[targetEnv]) {
    // Test specific environment
    const result = await runEnvironmentTests(environments[targetEnv]);
    results.push(result);
  } else if (targetEnv === 'all') {
    // Test all environments
    for (const [key, env] of Object.entries(environments)) {
      const result = await runEnvironmentTests(env);
      results.push(result);
    }
  } else {
    // Default to local environment
    const result = await runEnvironmentTests(environments.local);
    results.push(result);
  }
  
  // Summary
  console.log('\n📋 EXECUTION SUMMARY');
  console.log('=' .repeat(30));
  
  let allEnvironmentsPassed = true;
  
  for (const result of results) {
    const status = result.allPassed ? '✅ PASSED' : '❌ FAILED';
    console.log(`${result.environment}: ${status} (${result.successRate})`);
    if (!result.allPassed) {
      allEnvironmentsPassed = false;
    }
  }
  
  console.log('\n🏁 Overall Status:', allEnvironmentsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  
  process.exit(allEnvironmentsPassed ? 0 : 1);
}

// Run the tests
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { runEnvironmentTests, testEndpoint };