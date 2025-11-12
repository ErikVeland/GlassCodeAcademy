#!/usr/bin/env node

/**
 * Notification System Load Test
 * Tests the notification system under concurrent load
 */

const { sendNotification } = require('../src/services/notificationService');
const { User } = require('../src/models');

// Configuration
const CONCURRENT_USERS = 50;
const NOTIFICATIONS_PER_USER = 10;
const BATCH_SIZE = 10;

async function runLoadTest() {
  console.log(`Starting Notification System Load Test...`);
  console.log(`Configuration: ${CONCURRENT_USERS} users, ${NOTIFICATIONS_PER_USER} notifications per user`);
  
  const startTime = Date.now();
  
  try {
    // Get test users
    const users = await User.findAll({ limit: CONCURRENT_USERS });
    if (users.length === 0) {
      console.log('No users found for testing');
      return;
    }
    
    console.log(`Found ${users.length} users for testing`);
    
    // Process users in batches to avoid overwhelming the system
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(users.length/BATCH_SIZE)}`);
      
      // Send notifications concurrently for this batch
      const batchPromises = batch.map(user => sendUserNotifications(user));
      await Promise.all(batchPromises);
    }
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`\nLoad test completed successfully!`);
    console.log(`Total time: ${duration.toFixed(2)} seconds`);
    console.log(`Total notifications sent: ${users.length * NOTIFICATIONS_PER_USER}`);
    console.log(`Average time per notification: ${(duration * 1000 / (users.length * NOTIFICATIONS_PER_USER)).toFixed(2)}ms`);
    console.log(`Notifications per second: ${(users.length * NOTIFICATIONS_PER_USER / duration).toFixed(2)}`);
  } catch (error) {
    console.error('Load test error:', error);
    process.exit(1);
  }
}

async function sendUserNotifications(user) {
  const userStartTime = Date.now();
  
  try {
    // Send multiple notifications to this user
    const promises = [];
    for (let i = 0; i < NOTIFICATIONS_PER_USER; i++) {
      const promise = sendNotification(
        user.id, 
        `Load Test Notification ${i + 1}`, 
        `This is load test notification #${i + 1} for user ${user.email}`, 
        {
          category: 'load_test',
          type: 'info',
        }
      );
      promises.push(promise);
    }
    
    await Promise.all(promises);
    
    const userEndTime = Date.now();
    const userDuration = (userEndTime - userStartTime) / 1000;
    
    console.log(`User ${user.email}: ${NOTIFICATIONS_PER_USER} notifications in ${userDuration.toFixed(2)}s`);
  } catch (error) {
    console.error(`Error sending notifications to user ${user.email}:`, error.message);
  }
}

// Run the load test
if (require.main === module) {
  runLoadTest().catch(error => {
    console.error('Load test error:', error);
    process.exit(1);
  });
}

module.exports = {
  runLoadTest,
};