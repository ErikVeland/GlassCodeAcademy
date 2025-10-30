const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { createApiKey, getUserApiKeys, deleteApiKey, rotateApiKey } = require('../services/apiKeyService');

// POST /api-keys
// Create a new API key
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, expiresAt } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_NAME',
          message: 'API key name is required'
        }
      });
    }
    
    const apiKey = await createApiKey(req.user.id, name, expiresAt);
    
    res.status(201).json({
      success: true,
      data: {
        id: apiKey.id,
        name: apiKey.name,
        key: apiKey.key, // This is the only time the key is shown
        createdAt: apiKey.createdAt,
        expiresAt: apiKey.expiresAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

// GET /api-keys
// Get all API keys for the user
router.get('/', authenticate, async (req, res) => {
  try {
    const apiKeys = await getUserApiKeys(req.user.id);
    
    res.json({
      success: true,
      data: apiKeys
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

// DELETE /api-keys/:id
// Delete an API key
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await deleteApiKey(id, req.user.id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'API key not found'
        }
      });
    }
    
    res.json({
      success: true,
      message: 'API key deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

// POST /api-keys/:id/rotate
// Rotate an API key (create new, delete old)
router.post('/:id/rotate', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const newKey = await rotateApiKey(id, req.user.id);
    
    res.json({
      success: true,
      data: {
        id: newKey.id,
        name: newKey.name,
        key: newKey.key, // This is the only time the key is shown
        createdAt: newKey.createdAt,
        expiresAt: newKey.expiresAt
      }
    });
  } catch (error) {
    if (error.message === 'API key not found') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'API key not found'
        }
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

module.exports = router;