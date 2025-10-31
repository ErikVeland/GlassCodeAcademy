#!/usr/bin/env node

/**
 * Notification System Performance Test
 * Tests the performance of the notification system under load
 */

const { performance } = require('perf_hooks');
const { sendNotification } = require('../src/services/notificationService');
const { processDigests } = require('../src/services/notificationDigestService');
const { User } = require('../src/models');

async function runPerformanceTests() {
  console.log('Starting Notification System Performance Tests...');
  
  // Test 1: Single notification send performance
  console.log('\n=== Test 1: Single Notification Send Performance ===');
  await testSingleNotificationPerformance();
  
  // Test 2: Batch notification send performance
  console.log('\n=== Test 2: Batch Notification Send Performance ===');
  await testBatchNotificationPerformance();
  
  // Test 3: Digest processing performance
  console.log('\n=== Test 3: Digest Processing Performance ===');
  await testDigestProcessingPerformance();
  
  console.log('\nPerformance tests completed.');
}

async function testSingleNotificationPerformance() {
  try {
    // Get a test user
    const user = await User.findOne();
    if (!user) {
      console.log('No users found for testing');
      return;
    }
    
    const startTime = performance.now();
    
    // Send a single notification
    await sendNotification(user.id, 'Performance Test', 'This is a performance test notification', {
      category: 'performance_test',
      type: 'info',
    });
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`Single notification send time: ${duration.toFixed(2)}ms`);
    
    // Test with different notification types
    const testCases = [
      { title: 'Info Notification', type: 'info' },
      { title: 'Success Notification', type: 'success' },
      { title: 'Warning Notification', type: 'warning' },
      { title: 'Error Notification', type: 'error' },
    ];
    
    let totalDuration = 0;
    for (const testCase of testCases) {
      const start = performance.now();
      await sendNotification(user.id, testCase.title, 'Test message content', {
        category: 'performance_test',
        type: testCase.type,
      });
      const end = performance.now();
      const caseDuration = end - start;
      totalDuration += caseDuration;
      console.log(`${testCase.title} send time: ${caseDuration.toFixed(2)}ms`);
    }
    
    console.log(`Average notification send time: ${(totalDuration / testCases.length).toFixed(2)}ms`);
  } catch (error) {
    console.error('Error in single notification performance test:', error.message);
  }
}

async function testBatchNotificationPerformance() {
  try {
    // Get test users
    const users = await User.findAll({ limit: 10 });
    if (users.length === 0) {
      console.log('No users found for testing');
      return;
    }
    
    console.log(`Testing batch notifications for ${users.length} users`);
    
    const startTime = performance.now();
    
    // Send notifications to all users
    const promises = users.map(user => 
      sendNotification(user.id, 'Batch Performance Test', 'This is a batch performance test notification', {
        category: 'performance_test',
        type: 'info',
      })
    );
    
    await Promise.all(promises);
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`Batch notification send time for ${users.length} users: ${duration.toFixed(2)}ms`);
    console.log(`Average per notification: ${(duration / users.length).toFixed(2)}ms`);
  } catch (error) {
    console.error('Error in batch notification performance test:', error.message);
  }
}

async function testDigestProcessingPerformance() {
  try {
    console.log('Testing digest processing performance');
    
    const startTime = performance.now();
    
    // Test hourly digest processing
    await processDigests('hourly');
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`Hourly digest processing time: ${duration.toFixed(2)}ms`);
    
    // Test daily digest processing
    const start2 = performance.now();
    await processDigests('daily');
    const end2 = performance.now();
    const duration2 = end2 - start2;
    
    console.log(`Daily digest processing time: ${duration2.toFixed(2)}ms`);
  } catch (error) {
    console.error('Error in digest processing performance test:', error.message);
  }
}

// Run the tests
if (require.main === module) {
  runPerformanceTests().catch(error => {
    console.error('Performance test error:', error);
    process.exit(1);
  });
}

module.exports = {
  runPerformanceTests,
  testSingleNotificationPerformance,
  testBatchNotificationPerformance,
  testDigestProcessingPerformance,
};