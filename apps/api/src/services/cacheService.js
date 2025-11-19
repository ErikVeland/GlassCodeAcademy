/**
 * Redis Cache Service
 * 
 * Provides caching functionality for academy settings, user permissions,
 * memberships, and course content with automatic reconnection and
 * graceful degradation.
 */

import { createClient } from 'redis';

// Configuration
const REDIS_ENABLED = process.env.REDIS_ENABLED === 'true';
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_URL = process.env.REDIS_URL || `redis://${REDIS_HOST}:${REDIS_PORT}`;
const DEFAULT_TTL = parseInt(process.env.REDIS_TTL) || 3600; // 1 hour default

// Cache statistics
let cacheStats = {
  hits: 0,
  misses: 0,
  errors: 0
};

// Redis client
let redisClient = null;
let isConnected = false;

/**
 * Initialize Redis client
 */
function initializeRedis() {
  if (!REDIS_ENABLED) {
    console.log('Redis caching is disabled');
    return null;
  }

  try {
    console.log(`Connecting to Redis at ${REDIS_URL}`);
    redisClient = createClient({
      url: REDIS_URL
    });

    redisClient.on('connect', () => {
      console.log('Redis client connected');
      isConnected = true;
    });

    redisClient.on('ready', () => {
      console.log('Redis client ready');
      isConnected = true;
    });

    redisClient.on('error', (err) => {
      console.error('Redis client error:', err);
      cacheStats.errors++;
      isConnected = false;
    });

    redisClient.on('reconnecting', () => {
      console.log('Redis client reconnecting');
      isConnected = false;
    });

    redisClient.on('end', () => {
      console.log('Redis client disconnected');
      isConnected = false;
    });

    // Connect immediately
    redisClient.connect().catch(err => {
      console.error('Failed to connect to Redis:', err);
      isConnected = false;
    });

    return redisClient;
  } catch (err) {
    console.error('Failed to initialize Redis client:', err);
    return null;
  }
}

// Initialize Redis client
initializeRedis();

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @returns {Promise<any>} Cached value or null if not found
 */
async function get(key) {
  console.log(`Cache get: enabled=${REDIS_ENABLED}, connected=${isConnected}, hasClient=${!!redisClient}`);
  if (!REDIS_ENABLED || !isConnected || !redisClient) {
    cacheStats.misses++;
    return null;
  }

  try {
    const value = await redisClient.get(key);
    if (value !== null) {
      cacheStats.hits++;
      return JSON.parse(value);
    } else {
      cacheStats.misses++;
      return null;
    }
  } catch (err) {
    console.error('Cache get error:', err);
    cacheStats.errors++;
    return null;
  }
}

/**
 * Set value in cache
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds (optional)
 * @returns {Promise<boolean>} Success status
 */
async function set(key, value, ttl = DEFAULT_TTL) {
  console.log(`Cache set: enabled=${REDIS_ENABLED}, connected=${isConnected}, hasClient=${!!redisClient}`);
  if (!REDIS_ENABLED || !isConnected || !redisClient) {
    return false;
  }

  try {
    const stringValue = JSON.stringify(value);
    await redisClient.setEx(key, ttl, stringValue);
    return true;
  } catch (err) {
    console.error('Cache set error:', err);
    cacheStats.errors++;
    return false;
  }
}

/**
 * Delete value from cache
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} Success status
 */
async function del(key) {
  if (!REDIS_ENABLED || !isConnected || !redisClient) {
    return false;
  }

  try {
    await redisClient.del(key);
    return true;
  } catch (err) {
    console.error('Cache delete error:', err);
    cacheStats.errors++;
    return false;
  }
}

/**
 * Get cache statistics
 * @returns {object} Cache statistics
 */
function getStats() {
  return {
    enabled: REDIS_ENABLED,
    connected: isConnected,
    hits: cacheStats.hits,
    misses: cacheStats.misses,
    errors: cacheStats.errors,
    hitRate: cacheStats.hits + cacheStats.misses > 0 
      ? (cacheStats.hits / (cacheStats.hits + cacheStats.misses) * 100).toFixed(2) + '%'
      : '0%'
  };
}

/**
 * Invalidate all cache for an academy
 * @param {number} academyId - Academy ID
 * @returns {Promise<boolean>} Success status
 */
async function invalidateAcademyCache(academyId) {
  if (!REDIS_ENABLED || !isConnected || !redisClient) {
    return false;
  }

  try {
    // Delete academy settings
    await del(`academy:${academyId}:settings`);
    
    // Delete all user permissions for this academy
    // Note: This would require pattern-based deletion which is more complex
    // For now, we'll just invalidate specific known patterns
    
    // Delete all courses for this academy
    // This would also require pattern-based deletion
    
    return true;
  } catch (err) {
    console.error('Cache invalidation error:', err);
    cacheStats.errors++;
    return false;
  }
}

// Academy Settings Cache
/**
 * Get academy settings from cache
 * @param {number} academyId - Academy ID
 * @returns {Promise<object|null>} Academy settings or null
 */
async function getAcademySettings(academyId) {
  return await get(`academy:${academyId}:settings`);
}

/**
 * Set academy settings in cache
 * @param {number} academyId - Academy ID
 * @param {object} settings - Academy settings
 * @param {number} ttl - Time to live in seconds (default 2 hours)
 * @returns {Promise<boolean>} Success status
 */
async function setAcademySettings(academyId, settings, ttl = 7200) {
  return await set(`academy:${academyId}:settings`, settings, ttl);
}

/**
 * Invalidate academy settings cache
 * @param {number} academyId - Academy ID
 * @returns {Promise<boolean>} Success status
 */
async function invalidateAcademySettings(academyId) {
  return await del(`academy:${academyId}:settings`);
}

// User Permissions Cache
/**
 * Get user permissions from cache
 * @param {number} userId - User ID
 * @param {number} academyId - Academy ID
 * @returns {Promise<Array|null>} User permissions or null
 */
async function getUserPermissions(userId, academyId) {
  return await get(`user:${userId}:permissions:${academyId}`);
}

/**
 * Set user permissions in cache
 * @param {number} userId - User ID
 * @param {number} academyId - Academy ID
 * @param {Array} permissions - User permissions
 * @param {number} ttl - Time to live in seconds (default 1 hour)
 * @returns {Promise<boolean>} Success status
 */
async function setUserPermissions(userId, academyId, permissions, ttl = 3600) {
  return await set(`user:${userId}:permissions:${academyId}`, permissions, ttl);
}

/**
 * Invalidate user permissions cache
 * @param {number} userId - User ID
 * @param {number} academyId - Academy ID (optional)
 * @returns {Promise<boolean>} Success status
 */
async function invalidateUserPermissions(userId, academyId = null) {
  if (academyId) {
    return await del(`user:${userId}:permissions:${academyId}`);
  } else {
    // Invalidate all permissions for user
    // This would require pattern-based deletion
    // For now, we'll need to invalidate specific keys if known
    return false;
  }
}

// Academy Membership Cache
/**
 * Get academy membership from cache
 * @param {number} userId - User ID
 * @param {number} academyId - Academy ID
 * @returns {Promise<object|null>} Academy membership or null
 */
async function getMembership(userId, academyId) {
  return await get(`membership:${userId}:${academyId}`);
}

/**
 * Set academy membership in cache
 * @param {number} userId - User ID
 * @param {number} academyId - Academy ID
 * @param {object} membership - Academy membership
 * @param {number} ttl - Time to live in seconds (default 1 hour)
 * @returns {Promise<boolean>} Success status
 */
async function setMembership(userId, academyId, membership, ttl = 3600) {
  return await set(`membership:${userId}:${academyId}`, membership, ttl);
}

/**
 * Invalidate academy membership cache
 * @param {number} userId - User ID
 * @param {number} academyId - Academy ID
 * @returns {Promise<boolean>} Success status
 */
async function invalidateMembership(userId, academyId) {
  return await del(`membership:${userId}:${academyId}`);
}

// Course Content Cache
/**
 * Get course from cache
 * @param {number} courseId - Course ID
 * @returns {Promise<object|null>} Course data or null
 */
async function getCourse(courseId) {
  return await get(`course:${courseId}`);
}

/**
 * Set course in cache
 * @param {number} courseId - Course ID
 * @param {object} courseData - Course data
 * @param {number} ttl - Time to live in seconds (default 30 minutes)
 * @returns {Promise<boolean>} Success status
 */
async function setCourse(courseId, courseData, ttl = 1800) {
  return await set(`course:${courseId}`, courseData, ttl);
}

/**
 * Invalidate course cache
 * @param {number} courseId - Course ID
 * @returns {Promise<boolean>} Success status
 */
async function invalidateCourse(courseId) {
  return await del(`course:${courseId}`);
}

module.exports = {
  // Core cache functions
  get,
  set,
  del,
  getStats,
  
  // Academy settings
  getAcademySettings,
  setAcademySettings,
  invalidateAcademySettings,
  
  // User permissions
  getUserPermissions,
  setUserPermissions,
  invalidateUserPermissions,
  
  // Academy membership
  getMembership,
  setMembership,
  invalidateMembership,
  
  // Course content
  getCourse,
  setCourse,
  invalidateCourse,
  
  // Cache invalidation
  invalidateAcademyCache
};