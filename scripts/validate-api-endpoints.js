#!/usr/bin/env node

/**
 * API Endpoint Validation Script
 * 
 * This script validates all API endpoints and measures their performance
 * to identify optimization opportunities.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:8081';
const TIMEOUT = 10000; // 10 seconds

// Test modules
const TEST_MODULES = [
  'programming-fundamentals',
  'web-fundamentals',
  'version-control'
];

// Performance tracking
const performanceMetrics = [];

// Utility functions
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          duration: duration
        });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.setTimeout(TIMEOUT);
  });
}

function logMetric(endpoint, duration, statusCode, dataSize) {
  const metric = {
    endpoint,
    duration,
    statusCode,
    dataSize,
    timestamp: new Date().toISOString()
  };
  
  performanceMetrics.push(metric);
  console.log(`✓ ${endpoint} - ${duration}ms - ${dataSize} bytes - Status: ${statusCode}`);
}

function logError(endpoint, error) {
  console.error(`✗ ${endpoint} - ERROR: ${error.message}`);
}

async function validateRegistryEndpoint() {
  const endpoint = '/api/registry/modules';
  try {
    const response = await makeRequest(`${BASE_URL}${endpoint}`);
    const data = JSON.parse(response.data);
    
    if (!data.modules || !Array.isArray(data.modules)) {
      throw new Error('Invalid response format - missing modules array');
    }
    
    logMetric(endpoint, response.duration, response.statusCode, response.data.length);
    return data.modules;
  } catch (error) {
    logError(endpoint, error);
    return [];
  }
}

async function validateModuleLessonsEndpoint(moduleSlug) {
  const endpoint = `/api/modules/${moduleSlug}/lessons`;
  try {
    const response = await makeRequest(`${BASE_URL}${endpoint}`);
    const data = JSON.parse(response.data);
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid response format - not an array');
    }
    
    logMetric(endpoint, response.duration, response.statusCode, response.data.length);
    return data;
  } catch (error) {
    logError(endpoint, error);
    return [];
  }
}

async function validateModuleQuizEndpoint(moduleSlug) {
  const endpoint = `/api/modules/${moduleSlug}/quiz`;
  try {
    const response = await makeRequest(`${BASE_URL}${endpoint}`);
    const data = JSON.parse(response.data);
    
    if (!data.questions || !Array.isArray(data.questions)) {
      throw new Error('Invalid response format - missing questions array');
    }
    
    logMetric(endpoint, response.duration, response.statusCode, response.data.length);
    return data;
  } catch (error) {
    logError(endpoint, error);
    return null;
  }
}

async function validateLessonQuizEndpoint(lessonId) {
  const endpoint = `/api/lessons/${lessonId}/quizzes`;
  try {
    const response = await makeRequest(`${BASE_URL}${endpoint}`);
    const data = JSON.parse(response.data);
    
    if (!data.questions || !Array.isArray(data.questions)) {
      throw new Error('Invalid response format - missing questions array');
    }
    
    logMetric(endpoint, response.duration, response.statusCode, response.data.length);
    return data;
  } catch (error) {
    logError(endpoint, error);
    return null;
  }
}

async function runValidation() {
  console.log('Starting API endpoint validation...\n');
  
  // Test 1: Registry endpoint
  console.log('1. Testing registry endpoint...');
  const modules = await validateRegistryEndpoint();
  
  if (modules.length === 0) {
    console.error('Failed to retrieve modules. Aborting validation.');
    process.exit(1);
  }
  
  console.log(`   Found ${modules.length} modules\n`);
  
  // Test 2: Module lessons endpoints
  console.log('2. Testing module lessons endpoints...');
  const lessonsData = [];
  
  for (const moduleSlug of TEST_MODULES) {
    const lessons = await validateModuleLessonsEndpoint(moduleSlug);
    lessonsData.push({ moduleSlug, lessons });
  }
  
  console.log('');
  
  // Test 3: Module quiz endpoints
  console.log('3. Testing module quiz endpoints...');
  for (const moduleSlug of TEST_MODULES) {
    await validateModuleQuizEndpoint(moduleSlug);
  }
  
  console.log('');
  
  // Test 4: Lesson quiz endpoints
  console.log('4. Testing lesson quiz endpoints...');
  // Test with the first lesson from each module
  for (const { moduleSlug, lessons } of lessonsData) {
    if (lessons.length > 0) {
      await validateLessonQuizEndpoint(lessons[0].id);
    }
  }
  
  console.log('\nValidation completed!\n');
  
  // Performance summary
  console.log('Performance Summary:');
  console.log('===================');
  
  const avgDuration = performanceMetrics.reduce((sum, metric) => sum + metric.duration, 0) / performanceMetrics.length;
  const maxDuration = Math.max(...performanceMetrics.map(metric => metric.duration));
  const minDuration = Math.min(...performanceMetrics.map(metric => metric.duration));
  
  console.log(`Average response time: ${avgDuration.toFixed(2)}ms`);
  console.log(`Fastest response: ${minDuration}ms`);
  console.log(`Slowest response: ${maxDuration}ms`);
  console.log(`Total requests: ${performanceMetrics.length}`);
  
  // Save metrics to file
  const metricsFile = path.join(__dirname, 'api-performance-metrics.json');
  fs.writeFileSync(metricsFile, JSON.stringify(performanceMetrics, null, 2));
  console.log(`\nPerformance metrics saved to: ${metricsFile}`);
  
  // Check for slow endpoints
  const slowEndpoints = performanceMetrics.filter(metric => metric.duration > 1000);
  if (slowEndpoints.length > 0) {
    console.log('\nSlow endpoints (>1000ms):');
    slowEndpoints.forEach(metric => {
      console.log(`  ${metric.endpoint}: ${metric.duration}ms`);
    });
  }
  
  console.log('\nValidation script completed successfully!');
}

// Run the validation
runValidation().catch(error => {
  console.error('Validation failed:', error);
  process.exit(1);
});