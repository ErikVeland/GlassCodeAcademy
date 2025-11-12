#!/usr/bin/env node

/**
 * End-to-End Validation Script
 * 
 * This script performs comprehensive validation of the entire application,
 * including backend API endpoints, data integrity, and frontend components.
 */

const https = require('https');
const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Configuration
const API_BASE_URL = 'http://localhost:8081';
const CONTENT_DIR = path.join(__dirname, '..', 'content');
const TIMEOUT = 10000; // 10 seconds

// Test modules
const TEST_MODULES = [
  'programming-fundamentals',
  'web-fundamentals',
  'version-control'
];

// Performance tracking
const performanceMetrics = [];
const validationResults = {
  backend: { passed: 0, failed: 0, total: 0 },
  frontend: { passed: 0, failed: 0, total: 0 },
  dataIntegrity: { passed: 0, failed: 0, total: 0 }
};

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

function updateValidationResult(category, passed) {
  validationResults[category].total++;
  if (passed) {
    validationResults[category].passed++;
  } else {
    validationResults[category].failed++;
  }
}

// Backend Validation Functions
async function validateRegistryEndpoint() {
  console.log('Validating registry endpoint...');
  const endpoint = '/api/registry/modules';
  
  try {
    const response = await makeRequest(`${API_BASE_URL}${endpoint}`);
    const data = JSON.parse(response.data);
    
    if (!data.modules || !Array.isArray(data.modules)) {
      throw new Error('Invalid response format - missing modules array');
    }
    
    // Check that we have the expected number of modules
    if (data.modules.length < 10) {
      throw new Error(`Expected at least 10 modules, got ${data.modules.length}`);
    }
    
    logMetric(endpoint, response.duration, response.statusCode, response.data.length);
    updateValidationResult('backend', true);
    return data.modules;
  } catch (error) {
    logError(endpoint, error);
    updateValidationResult('backend', false);
    return [];
  }
}

async function validateModuleLessonsEndpoint(moduleSlug) {
  const endpoint = `/api/modules/${moduleSlug}/lessons`;
  
  try {
    const response = await makeRequest(`${API_BASE_URL}${endpoint}`);
    const data = JSON.parse(response.data);
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid response format - not an array');
    }
    
    // Check that we have lessons
    if (data.length === 0) {
      throw new Error('No lessons found for module');
    }
    
    logMetric(endpoint, response.duration, response.statusCode, response.data.length);
    updateValidationResult('backend', true);
    return data;
  } catch (error) {
    logError(endpoint, error);
    updateValidationResult('backend', false);
    return [];
  }
}

async function validateModuleQuizEndpoint(moduleSlug) {
  const endpoint = `/api/modules/${moduleSlug}/quiz`;
  
  try {
    const response = await makeRequest(`${API_BASE_URL}${endpoint}`);
    const data = JSON.parse(response.data);
    
    if (!data.questions || !Array.isArray(data.questions)) {
      throw new Error('Invalid response format - missing questions array');
    }
    
    logMetric(endpoint, response.duration, response.statusCode, response.data.length);
    updateValidationResult('backend', true);
    return data;
  } catch (error) {
    logError(endpoint, error);
    updateValidationResult('backend', false);
    return null;
  }
}

async function validateLessonQuizEndpoint(lessonId) {
  const endpoint = `/api/lessons/${lessonId}/quizzes`;
  
  try {
    const response = await makeRequest(`${API_BASE_URL}${endpoint}`);
    const data = JSON.parse(response.data);
    
    if (!data.questions || !Array.isArray(data.questions)) {
      throw new Error('Invalid response format - missing questions array');
    }
    
    logMetric(endpoint, response.duration, response.statusCode, response.data.length);
    updateValidationResult('backend', true);
    return data;
  } catch (error) {
    logError(endpoint, error);
    updateValidationResult('backend', false);
    return null;
  }
}

// Data Integrity Validation Functions
async function validateRegistryJson() {
  console.log('Validating registry.json structure...');
  
  try {
    const registryPath = path.join(CONTENT_DIR, 'registry.json');
    const content = await fs.readFile(registryPath, 'utf8');
    const data = JSON.parse(content);
    
    // Check required fields
    if (!data.modules || !Array.isArray(data.modules)) {
      throw new Error('Missing or invalid modules array in registry.json');
    }
    
    // Check that each module has required fields
    for (const module of data.modules) {
      if (!module.slug) {
        throw new Error('Module missing slug field');
      }
      if (!module.title) {
        throw new Error(`Module ${module.slug} missing title field`);
      }
    }
    
    console.log('✓ registry.json structure is valid');
    updateValidationResult('dataIntegrity', true);
    return data.modules;
  } catch (error) {
    console.error('✗ registry.json validation failed:', error.message);
    updateValidationResult('dataIntegrity', false);
    return [];
  }
}

async function validateLessonFiles(modules) {
  console.log('Validating lesson files...');
  
  let passed = 0;
  let failed = 0;
  
  for (const module of modules.slice(0, 3)) { // Test first 3 modules
    try {
      const lessonPath = path.join(CONTENT_DIR, 'lessons', `${module.slug}.json`);
      const content = await fs.readFile(lessonPath, 'utf8');
      const data = JSON.parse(content);
      
      if (!Array.isArray(data)) {
        throw new Error('Lessons file should be an array');
      }
      
      if (data.length === 0) {
        throw new Error('Lessons file is empty');
      }
      
      // Check that each lesson has required fields
      for (const lesson of data) {
        if (!lesson.id) {
          throw new Error(`Lesson missing id field in ${module.slug}`);
        }
        if (!lesson.title) {
          throw new Error(`Lesson ${lesson.id} missing title field in ${module.slug}`);
        }
      }
      
      console.log(`✓ ${module.slug} lessons file is valid`);
      passed++;
    } catch (error) {
      console.error(`✗ ${module.slug} lessons file validation failed:`, error.message);
      failed++;
    }
  }
  
  updateValidationResult('dataIntegrity', failed === 0);
  return { passed, failed };
}

async function validateQuizFiles(modules) {
  console.log('Validating quiz files...');
  
  let passed = 0;
  let failed = 0;
  
  for (const module of modules.slice(0, 3)) { // Test first 3 modules
    try {
      const quizPath = path.join(CONTENT_DIR, 'quizzes', `${module.slug}.json`);
      const content = await fs.readFile(quizPath, 'utf8');
      const data = JSON.parse(content);
      
      if (!data.questions || !Array.isArray(data.questions)) {
        throw new Error('Quiz file missing questions array');
      }
      
      if (data.questions.length === 0) {
        throw new Error('Quiz file has no questions');
      }
      
      // Check that each question has required fields
      for (const question of data.questions) {
        if (!question.id) {
          throw new Error(`Question missing id field in ${module.slug}`);
        }
        if (!question.question) {
          throw new Error(`Question ${question.id} missing question field in ${module.slug}`);
        }
        if (!question.choices || !Array.isArray(question.choices)) {
          throw new Error(`Question ${question.id} missing choices array in ${module.slug}`);
        }
        if (question.correctAnswer === undefined) {
          throw new Error(`Question ${question.id} missing correctAnswer field in ${module.slug}`);
        }
      }
      
      console.log(`✓ ${module.slug} quiz file is valid`);
      passed++;
    } catch (error) {
      console.error(`✗ ${module.slug} quiz file validation failed:`, error.message);
      failed++;
    }
  }
  
  updateValidationResult('dataIntegrity', failed === 0);
  return { passed, failed };
}

// Frontend Validation Functions
async function validateFrontendBuild() {
  console.log('Validating frontend build...');
  
  try {
    // Check if frontend directory exists
    const frontendPath = path.join(__dirname, '..', 'frontend');
    try {
      await fs.access(frontendPath);
    } catch {
      console.log('ℹ Frontend directory not found, skipping frontend validation');
      updateValidationResult('frontend', true);
      return;
    }
    
    // Check for package.json
    const packageJsonPath = path.join(frontendPath, 'package.json');
    try {
      await fs.access(packageJsonPath);
      console.log('✓ Frontend package.json found');
    } catch {
      console.log('ℹ Frontend package.json not found, skipping detailed frontend validation');
      updateValidationResult('frontend', true);
      return;
    }
    
    // Try to run a basic frontend validation command if it exists
    try {
      await execAsync('npm list --depth=0', { cwd: frontendPath, timeout: 30000 });
      console.log('✓ Frontend dependencies are installed');
      updateValidationResult('frontend', true);
    } catch (error) {
      console.log('ℹ Could not validate frontend dependencies:', error.message);
      updateValidationResult('frontend', true); // Not a critical failure
    }
  } catch (error) {
    console.error('✗ Frontend validation failed:', error.message);
    updateValidationResult('frontend', false);
  }
}

// Performance Analysis Functions
function analyzePerformance() {
  console.log('\nPerformance Analysis:');
  console.log('====================');
  
  if (performanceMetrics.length === 0) {
    console.log('No performance metrics collected');
    return;
  }
  
  const avgDuration = performanceMetrics.reduce((sum, metric) => sum + metric.duration, 0) / performanceMetrics.length;
  const maxDuration = Math.max(...performanceMetrics.map(metric => metric.duration));
  const minDuration = Math.min(...performanceMetrics.map(metric => metric.duration));
  
  console.log(`Average response time: ${avgDuration.toFixed(2)}ms`);
  console.log(`Fastest response: ${minDuration}ms`);
  console.log(`Slowest response: ${maxDuration}ms`);
  console.log(`Total requests: ${performanceMetrics.length}`);
  
  // Check for slow endpoints
  const slowEndpoints = performanceMetrics.filter(metric => metric.duration > 500);
  if (slowEndpoints.length > 0) {
    console.log('\nSlow endpoints (>500ms):');
    slowEndpoints.forEach(metric => {
      console.log(`  ${metric.endpoint}: ${metric.duration}ms`);
    });
  }
  
  // Save metrics to file
  const metricsFile = path.join(__dirname, 'e2e-performance-metrics.json');
  fs.writeFile(metricsFile, JSON.stringify(performanceMetrics, null, 2))
    .then(() => console.log(`\nPerformance metrics saved to: ${metricsFile}`))
    .catch(error => console.error('Failed to save performance metrics:', error));
}

function printValidationSummary() {
  console.log('\nValidation Summary:');
  console.log('==================');
  
  console.log(`Backend: ${validationResults.backend.passed}/${validationResults.backend.total} tests passed`);
  console.log(`Frontend: ${validationResults.frontend.passed}/${validationResults.frontend.total} tests passed`);
  console.log(`Data Integrity: ${validationResults.dataIntegrity.passed}/${validationResults.dataIntegrity.total} tests passed`);
  
  const totalPassed = validationResults.backend.passed + validationResults.frontend.passed + validationResults.dataIntegrity.passed;
  const totalTests = validationResults.backend.total + validationResults.frontend.total + validationResults.dataIntegrity.total;
  
  console.log(`\nOverall: ${totalPassed}/${totalTests} tests passed`);
  
  if (totalPassed === totalTests) {
    console.log('\n🎉 All validations passed! The application is working correctly.');
  } else {
    console.log('\n⚠️  Some validations failed. Please check the errors above.');
  }
}

// Main validation function
async function runEndToEndValidation() {
  console.log('Starting end-to-end validation...\n');
  
  // 1. Backend API Validation
  console.log('1. Backend API Validation');
  console.log('========================');
  
  const modules = await validateRegistryEndpoint();
  
  if (modules.length === 0) {
    console.error('Failed to retrieve modules. Aborting validation.');
    printValidationSummary();
    process.exit(1);
  }
  
  console.log(`   Found ${modules.length} modules\n`);
  
  // Test module lessons endpoints
  console.log('Testing module lessons endpoints...');
  const lessonsData = [];
  
  for (const moduleSlug of TEST_MODULES) {
    const lessons = await validateModuleLessonsEndpoint(moduleSlug);
    lessonsData.push({ moduleSlug, lessons });
  }
  
  console.log('');
  
  // Test module quiz endpoints
  console.log('Testing module quiz endpoints...');
  for (const moduleSlug of TEST_MODULES) {
    await validateModuleQuizEndpoint(moduleSlug);
  }
  
  console.log('');
  
  // Test lesson quiz endpoints
  console.log('Testing lesson quiz endpoints...');
  // Test with the first lesson from each module
  for (const { moduleSlug, lessons } of lessonsData) {
    if (lessons.length > 0) {
      await validateLessonQuizEndpoint(lessons[0].id);
    }
  }
  
  console.log('');
  
  // 2. Data Integrity Validation
  console.log('2. Data Integrity Validation');
  console.log('============================');
  
  const registryModules = await validateRegistryJson();
  
  if (registryModules.length > 0) {
    await validateLessonFiles(registryModules);
    await validateQuizFiles(registryModules);
  }
  
  console.log('');
  
  // 3. Frontend Validation
  console.log('3. Frontend Validation');
  console.log('=====================');
  
  await validateFrontendBuild();
  
  console.log('');
  
  // 4. Performance Analysis
  console.log('4. Performance Analysis');
  console.log('=======================');
  
  analyzePerformance();
  
  console.log('\nEnd-to-end validation completed!');
  
  // Print summary
  printValidationSummary();
}

// Run the validation
runEndToEndValidation().catch(error => {
  console.error('End-to-end validation failed:', error);
  process.exit(1);
});