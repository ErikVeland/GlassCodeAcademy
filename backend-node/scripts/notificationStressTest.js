#!/usr/bin/env node

/**
 * Notification System Stress Test
 * Pushes the notification system to its limits to identify breaking points
 */

const { sendNotification } = require('../src/services/notificationService');
const { User } = require('../src/models');

// Configuration
const INITIAL_CONCURRENT_USERS = 10;
const MAX_CONCURRENT_USERS = 1000;
const NOTIFICATIONS_PER_USER = 5;
const STEP_SIZE = 10;
const STEP_DELAY = 1000; // ms

async function runStressTest() {
  console.log('Starting Notification System Stress Test...');
  console.log(`Configuration: Starting with ${INITIAL_CONCURRENT_USERS} users, increasing to ${MAX_CONCURRENT_USERS}`);
  
  // Get test users
  const allUsers = await User.findAll();
  if (allUsers.length === 0) {
    console.log('No users found for testing');
    return;
  }
  
  console.log(`Found ${allUsers.length} users for testing`);
  
  let currentUsers = INITIAL_CONCURRENT_USERS;
  const results = [];
  
  while (currentUsers <= MAX_CONCURRENT_USERS && currentUsers <= allUsers.length) {
    console.log(`\n--- Testing with ${currentUsers} concurrent users ---`);
    
    try {
      const testUsers = allUsers.slice(0, currentUsers);
      const result = await runTestWithUsers(testUsers);
      results.push({
        users: currentUsers,
        ...result
      });
      
      console.log(`Success: ${currentUsers} users, ${result.notificationsPerSecond.toFixed(2)} notifications/sec`);
      
      // Increase concurrency
      currentUsers += STEP_SIZE;
      
      // Brief pause between tests
      await new Promise(resolve => setTimeout(resolve, STEP_DELAY));
    } catch (error) {
      console.error(`Failed at ${currentUsers} users:`, error.message);
      break;
    }
  }
  
  // Print results summary
  printResultsSummary(results);
}

async function runTestWithUsers(users) {
  const startTime = Date.now();
  let successCount = 0;
  let failureCount = 0;
  
  try {
    // Create all promises
    const promises = [];
    for (const user of users) {
      for (let i = 0; i < NOTIFICATIONS_PER_USER; i++) {
        const promise = sendNotification(
          user.id,
          `Stress Test Notification ${i + 1}`,
          `This is stress test notification #${i + 1} for user ${user.email}`,
          {
            category: 'stress_test',
            type: 'info',
          }
        ).then(() => {
          successCount++;
        }).catch(error => {
          failureCount++;
          console.error(`Notification failed for user ${user.email}:`, error.message);
        });
        
        promises.push(promise);
      }
    }
    
    // Wait for all notifications to complete
    await Promise.all(promises);
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // seconds
    const totalNotifications = users.length * NOTIFICATIONS_PER_USER;
    
    return {
      duration,
      totalNotifications,
      successCount,
      failureCount,
      notificationsPerSecond: totalNotifications / duration,
      successRate: (successCount / totalNotifications) * 100,
    };
  } catch (error) {
    throw new Error(`Test failed: ${error.message}`);
  }
}

function printResultsSummary(results) {
  console.log('\n=== Stress Test Results Summary ===');
  
  if (results.length === 0) {
    console.log('No results to display');
    return;
  }
  
  console.log('Users\tNotifications\tDuration(s)\tSuccess\tFailures\tRate(/s)\tSuccess %');
  console.log('-----\t------------\t----------\t-------\t--------\t-------\t---------');
  
  for (const result of results) {
    console.log(
      `${result.users}\t${result.totalNotifications}\t\t${result.duration.toFixed(2)}\t\t${result.successCount}\t${result.failureCount}\t\t${result.notificationsPerSecond.toFixed(2)}\t${result.successRate.toFixed(1)}%`
    );
  }
  
  // Find peak performance
  const peak = results.reduce((max, current) => 
    current.notificationsPerSecond > max.notificationsPerSecond ? current : max
  );
  
  console.log(`\nPeak Performance: ${peak.users} users, ${peak.notificationsPerSecond.toFixed(2)} notifications/second`);
  
  // Find breaking point (if any)
  const lastResult = results[results.length - 1];
  console.log(`Final Test: ${lastResult.users} users, ${lastResult.notificationsPerSecond.toFixed(2)} notifications/second`);
}

// Run the stress test
if (require.main === module) {
  runStressTest().catch(error => {
    console.error('Stress test error:', error);
    process.exit(1);
  });
}

module.exports = {
  runStressTest,
};