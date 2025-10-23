#!/usr/bin/env node

/**
 * Test script for Content Validation Framework
 */

const ContentValidationFramework = require('./content-validation-framework.js');

// Test with default configuration
console.log('=== Testing Content Validation Framework ===\n');

// Test 1: Default configuration
console.log('Test 1: Default configuration');
const validator1 = new ContentValidationFramework();
validator1.run().then(() => {
  console.log('Test 1 completed\n');
  
  // Test 2: Strict mode configuration
  console.log('Test 2: Strict mode configuration');
  const validator2 = new ContentValidationFramework({ strictMode: true });
  validator2.run().then(() => {
    console.log('Test 2 completed\n');
    
    // Test 3: Custom configuration
    console.log('Test 3: Custom configuration');
    const validator3 = new ContentValidationFramework({ 
      minLessonIntroWords: 30,
      requiredQuizChoices: 4
    });
    validator3.run().then(() => {
      console.log('Test 3 completed\n');
      
      // Test 4: Generate report
      console.log('Test 4: Generate report');
      const validator4 = new ContentValidationFramework();
      console.log(validator4.generateReport('console'));
      console.log('Test 4 completed\n');
      
      console.log('All tests completed successfully!');
    });
  });
});