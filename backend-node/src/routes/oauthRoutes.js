const express = require('express');
const router = express.Router();
const { generateOAuthUrl, exchangeCodeForToken, getUserInfo, createOrUpdateOAuthUser, generateOAuthToken } = require('../services/oauthService');

// GET /auth/google
// Redirect to Google OAuth
router.get('/google', (req, res) => {
  try {
    const authUrl = generateOAuthUrl('google');
    res.redirect(authUrl);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'OAUTH_ERROR',
        message: error.message
      }
    });
  }
});

// GET /auth/google/callback
// Handle Google OAuth callback
router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_CODE',
          message: 'Authorization code is missing'
        }
      });
    }
    
    // Exchange code for access token
    const tokenData = await exchangeCodeForToken('google', code);
    
    // Get user info
    const userInfo = await getUserInfo('google', tokenData.access_token);
    
    // Create or update user
    const user = await createOrUpdateOAuthUser(userInfo);
    
    // Generate JWT token
    const token = generateOAuthToken(user);
    
    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'OAUTH_ERROR',
        message: error.message
      }
    });
  }
});

// GET /auth/github
// Redirect to GitHub OAuth
router.get('/github', (req, res) => {
  try {
    const authUrl = generateOAuthUrl('github');
    res.redirect(authUrl);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'OAUTH_ERROR',
        message: error.message
      }
    });
  }
});

// GET /auth/github/callback
// Handle GitHub OAuth callback
router.get('/github/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_CODE',
          message: 'Authorization code is missing'
        }
      });
    }
    
    // Exchange code for access token
    const tokenData = await exchangeCodeForToken('github', code);
    
    // Get user info
    const userInfo = await getUserInfo('github', tokenData.access_token);
    
    // Create or update user
    const user = await createOrUpdateOAuthUser(userInfo);
    
    // Generate JWT token
    const token = generateOAuthToken(user);
    
    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'OAUTH_ERROR',
        message: error.message
      }
    });
  }
});

module.exports = router;