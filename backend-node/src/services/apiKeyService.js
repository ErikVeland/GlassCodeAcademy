const crypto = require('crypto');
const { User } = require('../models');

// Generate a new API key
const generateApiKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Create API key for user
const createApiKey = async (userId, name, expiresAt = null) => {
  const { ApiKey } = require('../models');
  
  const apiKey = generateApiKey();
  const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');
  
  const newApiKey = await ApiKey.create({
    userId,
    name,
    hashedKey,
    expiresAt
  });
  
  // Return the unhashed key for the user (only time it's visible)
  return {
    id: newApiKey.id,
    name: newApiKey.name,
    key: apiKey, // This is the unhashed key
    createdAt: newApiKey.createdAt,
    expiresAt: newApiKey.expiresAt
  };
};

// Validate API key
const validateApiKey = async (key) => {
  const { ApiKey } = require('../models');
  
  if (!key) return null;
  
  const hashedKey = crypto.createHash('sha256').update(key).digest('hex');
  
  const apiKey = await ApiKey.findOne({
    where: {
      hashedKey
    },
    include: [{
      model: User,
      as: 'user'
    }]
  });
  
  if (!apiKey) return null;
  
  // Check if key has expired
  if (apiKey.expiresAt && new Date() > new Date(apiKey.expiresAt)) {
    return null;
  }
  
  return apiKey;
};

// Get API keys for user
const getUserApiKeys = async (userId) => {
  const { ApiKey } = require('../models');
  
  return await ApiKey.findAll({
    where: {
      userId
    },
    attributes: ['id', 'name', 'createdAt', 'expiresAt'] // Don't include hashed key
  });
};

// Delete API key
const deleteApiKey = async (apiKeyId, userId) => {
  const { ApiKey } = require('../models');
  
  return await ApiKey.destroy({
    where: {
      id: apiKeyId,
      userId
    }
  });
};

// Rotate API key (create new, delete old)
const rotateApiKey = async (apiKeyId, userId) => {
  const { ApiKey } = require('../models');
  
  // Get the existing key info
  const existingKey = await ApiKey.findOne({
    where: {
      id: apiKeyId,
      userId
    }
  });
  
  if (!existingKey) {
    throw new Error('API key not found');
  }
  
  // Create new key with same properties
  const newKey = await createApiKey(userId, existingKey.name, existingKey.expiresAt);
  
  // Delete the old key
  await deleteApiKey(apiKeyId, userId);
  
  return newKey;
};

module.exports = {
  generateApiKey,
  createApiKey,
  validateApiKey,
  getUserApiKeys,
  deleteApiKey,
  rotateApiKey
};