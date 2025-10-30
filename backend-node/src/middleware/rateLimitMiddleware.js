const rateLimit = require('express-rate-limit');
const Redis = require('redis');

// Create Redis client for distributed rate limiting (if Redis is available)
let redisClient;
try {
  if (process.env.REDIS_URL) {
    redisClient = Redis.createClient({
      url: process.env.REDIS_URL,
    });
    redisClient.connect().catch(console.error);
  }
} catch (error) {
  console.warn('Redis not available for rate limiting, using in-memory store');
}

// Custom rate limit store using Redis if available
class RedisStore {
  constructor() {
    this.client = redisClient;
  }

  async increment(key) {
    if (!this.client || !this.client.isOpen) {
      // Fallback to in-memory if Redis is not available
      return null;
    }

    try {
      const [_, value] = await this.client
        .multi()
        .incr(key)
        .expire(key, 900) // 15 minutes TTL
        .exec();

      return value[1]; // Return the incremented value
    } catch (error) {
      console.error('Redis rate limit error:', error);
      return null;
    }
  }

  async resetKey(key) {
    if (!this.client || !this.client.isOpen) return;

    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Redis reset key error:', error);
    }
  }
}

const redisStore = redisClient ? new RedisStore() : null;

// General rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  store: redisStore,
});

// Strict rate limiter for auth endpoints
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  store: redisStore,
});

// API key rate limiter
const apiKeyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each API key to 1000 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  store: redisStore,
  keyGenerator: (req) => {
    // Use API key from header if available, otherwise fallback to IP
    return req.headers['x-api-key'] || req.ip;
  },
});

// User-specific rate limiter (for authenticated users)
const userRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each user to 500 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test' || !req.user,
  store: redisStore,
  keyGenerator: (req) => {
    // Use user ID if available, otherwise fallback to IP
    return req.user ? `user:${req.user.id}` : req.ip;
  },
});

module.exports = {
  generalLimiter,
  strictLimiter,
  apiKeyLimiter,
  userRateLimiter,
};
