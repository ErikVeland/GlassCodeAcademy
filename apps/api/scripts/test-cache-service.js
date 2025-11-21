#!/usr/bin/env node

/**
 * Test script for cache service
 * Verifies that Redis caching is working properly
 */

const cacheService = require('../src/services/cacheService');

async function testCacheService() {
  console.log('Testing cache service...');

  // Wait a bit for Redis to be ready
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Test basic operations
  console.log('\n1. Testing basic cache operations...');

  const testKey = 'test:key';
  const testValue = { message: 'Hello from cache!', timestamp: Date.now() };

  // Test set
  const setSuccess = await cacheService.set(testKey, testValue, 60);
  console.log(`Set operation successful: ${setSuccess}`);

  // Test get
  const retrievedValue = await cacheService.get(testKey);
  console.log(`Retrieved value:`, retrievedValue);

  // Verify the value is correct
  if (retrievedValue && retrievedValue.message === testValue.message) {
    console.log('✓ Basic cache operations working correctly');
  } else {
    console.log('✗ Basic cache operations failed');
  }

  // Test delete
  const deleteSuccess = await cacheService.del(testKey);
  console.log(`Delete operation successful: ${deleteSuccess}`);

  // Verify deletion
  const deletedValue = await cacheService.get(testKey);
  if (deletedValue === null) {
    console.log('✓ Cache deletion working correctly');
  } else {
    console.log('✗ Cache deletion failed');
  }

  // Test academy settings cache
  console.log('\n2. Testing academy settings cache...');
  const academyId = 1;
  const settings = {
    name: 'Test Academy',
    theme: 'dark',
    features: ['forums', 'certificates'],
  };

  const setSettingsSuccess = await cacheService.setAcademySettings(
    academyId,
    settings,
    60
  );
  console.log(`Set academy settings successful: ${setSettingsSuccess}`);

  const retrievedSettings = await cacheService.getAcademySettings(academyId);
  console.log(`Retrieved academy settings:`, retrievedSettings);

  if (retrievedSettings && retrievedSettings.name === settings.name) {
    console.log('✓ Academy settings cache working correctly');
  } else {
    console.log('✗ Academy settings cache failed');
  }

  // Test user permissions cache
  console.log('\n3. Testing user permissions cache...');
  const userId = 123;
  const permissions = ['read', 'write', 'admin'];

  const setPermissionsSuccess = await cacheService.setUserPermissions(
    userId,
    academyId,
    permissions,
    60
  );
  console.log(`Set user permissions successful: ${setPermissionsSuccess}`);

  const retrievedPermissions = await cacheService.getUserPermissions(
    userId,
    academyId
  );
  console.log(`Retrieved user permissions:`, retrievedPermissions);

  if (
    retrievedPermissions &&
    retrievedPermissions.length === permissions.length
  ) {
    console.log('✓ User permissions cache working correctly');
  } else {
    console.log('✗ User permissions cache failed');
  }

  // Test membership cache
  console.log('\n4. Testing membership cache...');
  const membership = {
    role: 'student',
    joinedAt: new Date().toISOString(),
    isActive: true,
  };

  const setMembershipSuccess = await cacheService.setMembership(
    userId,
    academyId,
    membership,
    60
  );
  console.log(`Set membership successful: ${setMembershipSuccess}`);

  const retrievedMembership = await cacheService.getMembership(
    userId,
    academyId
  );
  console.log(`Retrieved membership:`, retrievedMembership);

  if (retrievedMembership && retrievedMembership.role === membership.role) {
    console.log('✓ Membership cache working correctly');
  } else {
    console.log('✗ Membership cache failed');
  }

  // Test course cache
  console.log('\n5. Testing course cache...');
  const courseId = 456;
  const courseData = {
    title: 'Test Course',
    description: 'A test course for caching',
    modules: 5,
  };

  const setCourseSuccess = await cacheService.setCourse(
    courseId,
    courseData,
    60
  );
  console.log(`Set course successful: ${setCourseSuccess}`);

  const retrievedCourse = await cacheService.getCourse(courseId);
  console.log(`Retrieved course:`, retrievedCourse);

  if (retrievedCourse && retrievedCourse.title === courseData.title) {
    console.log('✓ Course cache working correctly');
  } else {
    console.log('✗ Course cache failed');
  }

  // Display cache statistics
  console.log('\n6. Cache statistics:');
  const stats = cacheService.getStats();
  console.log(stats);

  console.log('\nCache service test completed!');
}

// Run the test
testCacheService().catch(console.error);
