/**
 * Redis Cache Service
 * Provides caching for academy settings, permissions, and frequently accessed content
 */

const redis = require('redis');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'cache-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

class CacheService {
  constructor() {
    this.client = null;
    this.isEnabled = process.env.REDIS_ENABLED === 'true';
    this.defaultTTL = parseInt(process.env.REDIS_TTL || '3600'); // 1 hour default

    if (this.isEnabled) {
      this.initialize();
    } else {
      logger.info('Redis caching is disabled');
    }
  }

  /**
   * Initialize Redis client
   */
  async initialize() {
    try {
      this.client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('Redis reconnection failed after 10 attempts');
              return new Error('Redis reconnection limit reached');
            }
            return retries * 100; // Exponential backoff
          },
        },
      });

      this.client.on('error', (err) => {
        logger.error('Redis client error', { error: err.message });
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
      });

      this.client.on('end', () => {
        logger.info('Redis client disconnected');
      });

      await this.client.connect();
      logger.info('Redis cache service initialized');
    } catch (error) {
      logger.error('Failed to initialize Redis', { error: error.message });
      this.isEnabled = false;
    }
  }

  /**
   * Generate cache key
   * @param {string} prefix - Key prefix (e.g., 'academy', 'user', 'course')
   * @param {string|number} id - Resource ID
   * @param {string} suffix - Optional suffix
   * @returns {string} Cache key
   */
  generateKey(prefix, id, suffix = '') {
    return suffix ? `${prefix}:${id}:${suffix}` : `${prefix}:${id}`;
  }

  /**
   * Get cached value
   * @param {string} key - Cache key
   * @returns {Promise<any>} Cached value or null
   */
  async get(key) {
    if (!this.isEnabled || !this.client) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (value) {
        logger.debug('Cache hit', { key });
        return JSON.parse(value);
      }
      logger.debug('Cache miss', { key });
      return null;
    } catch (error) {
      logger.error('Cache get error', { key, error: error.message });
      return null;
    }
  }

  /**
   * Set cached value
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds (optional)
   * @returns {Promise<boolean>} Success status
   */
  async set(key, value, ttl = null) {
    if (!this.isEnabled || !this.client) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      const expiry = ttl || this.defaultTTL;

      await this.client.setEx(key, expiry, serialized);
      logger.debug('Cache set', { key, ttl: expiry });
      return true;
    } catch (error) {
      logger.error('Cache set error', { key, error: error.message });
      return false;
    }
  }

  /**
   * Delete cached value
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Success status
   */
  async del(key) {
    if (!this.isEnabled || !this.client) {
      return false;
    }

    try {
      await this.client.del(key);
      logger.debug('Cache deleted', { key });
      return true;
    } catch (error) {
      logger.error('Cache delete error', { key, error: error.message });
      return false;
    }
  }

  /**
   * Delete multiple keys by pattern
   * @param {string} pattern - Key pattern (e.g., 'academy:*')
   * @returns {Promise<number>} Number of keys deleted
   */
  async delPattern(pattern) {
    if (!this.isEnabled || !this.client) {
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }

      await this.client.del(keys);
      logger.debug('Cache pattern deleted', { pattern, count: keys.length });
      return keys.length;
    } catch (error) {
      logger.error('Cache pattern delete error', {
        pattern,
        error: error.message,
      });
      return 0;
    }
  }

  /**
   * Cache academy settings
   * @param {number} academyId - Academy ID
   * @param {Object} settings - Settings object
   * @param {number} ttl - TTL in seconds
   * @returns {Promise<boolean>} Success status
   */
  async setAcademySettings(academyId, settings, ttl = 7200) {
    const key = this.generateKey('academy', academyId, 'settings');
    return await this.set(key, settings, ttl);
  }

  /**
   * Get cached academy settings
   * @param {number} academyId - Academy ID
   * @returns {Promise<Object|null>} Settings or null
   */
  async getAcademySettings(academyId) {
    const key = this.generateKey('academy', academyId, 'settings');
    return await this.get(key);
  }

  /**
   * Invalidate academy settings cache
   * @param {number} academyId - Academy ID
   * @returns {Promise<boolean>} Success status
   */
  async invalidateAcademySettings(academyId) {
    const key = this.generateKey('academy', academyId, 'settings');
    return await this.del(key);
  }

  /**
   * Cache user permissions
   * @param {number} userId - User ID
   * @param {number} academyId - Academy ID
   * @param {Object} permissions - Permissions object
   * @param {number} ttl - TTL in seconds
   * @returns {Promise<boolean>} Success status
   */
  async setUserPermissions(userId, academyId, permissions, ttl = 3600) {
    const key = this.generateKey('user', userId, `permissions:${academyId}`);
    return await this.set(key, permissions, ttl);
  }

  /**
   * Get cached user permissions
   * @param {number} userId - User ID
   * @param {number} academyId - Academy ID
   * @returns {Promise<Object|null>} Permissions or null
   */
  async getUserPermissions(userId, academyId) {
    const key = this.generateKey('user', userId, `permissions:${academyId}`);
    return await this.get(key);
  }

  /**
   * Invalidate user permissions
   * @param {number} userId - User ID
   * @param {number} academyId - Academy ID (optional, if not provided invalidates all)
   * @returns {Promise<number>} Number of keys deleted
   */
  async invalidateUserPermissions(userId, academyId = null) {
    if (academyId) {
      const key = this.generateKey('user', userId, `permissions:${academyId}`);
      return (await this.del(key)) ? 1 : 0;
    } else {
      const pattern = this.generateKey('user', userId, 'permissions:*');
      return await this.delPattern(pattern);
    }
  }

  /**
   * Cache academy membership
   * @param {number} userId - User ID
   * @param {number} academyId - Academy ID
   * @param {Object} membership - Membership object
   * @param {number} ttl - TTL in seconds
   * @returns {Promise<boolean>} Success status
   */
  async setMembership(userId, academyId, membership, ttl = 3600) {
    const key = this.generateKey('membership', userId, academyId);
    return await this.set(key, membership, ttl);
  }

  /**
   * Get cached membership
   * @param {number} userId - User ID
   * @param {number} academyId - Academy ID
   * @returns {Promise<Object|null>} Membership or null
   */
  async getMembership(userId, academyId) {
    const key = this.generateKey('membership', userId, academyId);
    return await this.get(key);
  }

  /**
   * Invalidate membership cache
   * @param {number} userId - User ID
   * @param {number} academyId - Academy ID (optional)
   * @returns {Promise<number>} Number of keys deleted
   */
  async invalidateMembership(userId, academyId = null) {
    if (academyId) {
      const key = this.generateKey('membership', userId, academyId);
      return (await this.del(key)) ? 1 : 0;
    } else {
      const pattern = this.generateKey('membership', userId, '*');
      return await this.delPattern(pattern);
    }
  }

  /**
   * Cache course data
   * @param {number} courseId - Course ID
   * @param {Object} course - Course object
   * @param {number} ttl - TTL in seconds
   * @returns {Promise<boolean>} Success status
   */
  async setCourse(courseId, course, ttl = 1800) {
    const key = this.generateKey('course', courseId);
    return await this.set(key, course, ttl);
  }

  /**
   * Get cached course
   * @param {number} courseId - Course ID
   * @returns {Promise<Object|null>} Course or null
   */
  async getCourse(courseId) {
    const key = this.generateKey('course', courseId);
    return await this.get(key);
  }

  /**
   * Invalidate course cache
   * @param {number} courseId - Course ID
   * @returns {Promise<boolean>} Success status
   */
  async invalidateCourse(courseId) {
    const key = this.generateKey('course', courseId);
    return await this.del(key);
  }

  /**
   * Invalidate all academy-related cache
   * @param {number} academyId - Academy ID
   * @returns {Promise<number>} Number of keys deleted
   */
  async invalidateAcademyCache(academyId) {
    const pattern = `*:*:${academyId}*`;
    return await this.delPattern(pattern);
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>} Cache stats
   */
  async getStats() {
    if (!this.isEnabled || !this.client) {
      return { enabled: false };
    }

    try {
      const info = await this.client.info('stats');
      const lines = info.split('\r\n');
      const stats = {};

      lines.forEach((line) => {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          stats[key] = value;
        }
      });

      return {
        enabled: true,
        hits: stats.keyspace_hits || 0,
        misses: stats.keyspace_misses || 0,
        keys: await this.client.dbSize(),
      };
    } catch (error) {
      logger.error('Failed to get cache stats', { error: error.message });
      return { enabled: true, error: error.message };
    }
  }

  /**
   * Flush all cache
   * @returns {Promise<boolean>} Success status
   */
  async flushAll() {
    if (!this.isEnabled || !this.client) {
      return false;
    }

    try {
      await this.client.flushAll();
      logger.warn('All cache flushed');
      return true;
    } catch (error) {
      logger.error('Failed to flush cache', { error: error.message });
      return false;
    }
  }

  /**
   * Close Redis connection
   * @returns {Promise<void>}
   */
  async close() {
    if (this.client) {
      await this.client.quit();
      logger.info('Redis connection closed');
    }
  }
}

// Export singleton instance
const cacheService = new CacheService();
module.exports = cacheService;
