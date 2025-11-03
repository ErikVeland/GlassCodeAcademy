const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/auth');

// Mock OAuth providers (in a real implementation, these would be actual OAuth providers)
const oauthProviders = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI ||
      'http://localhost:3000/auth/google/callback',
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    redirectUri:
      process.env.GITHUB_REDIRECT_URI ||
      'http://localhost:3000/auth/github/callback',
  },
  apple: {
    keyId: process.env.APPLE_KEY_ID,
    clientId: process.env.APPLE_CLIENT_ID,
    clientSecret: process.env.APPLE_CLIENT_SECRET,
    redirectUri:
      process.env.APPLE_REDIRECT_URI ||
      'http://localhost:3000/auth/apple/callback',
  },
};

// Generate OAuth authorization URL
const generateOAuthUrl = (providerName) => {
  const provider = oauthProviders[providerName];

  if (!provider) {
    throw new Error(`OAuth provider ${providerName} not configured`);
  }

  // In a real implementation, this would generate the actual OAuth URL
  // For Google: https://accounts.google.com/o/oauth2/v2/auth
  // For GitHub: https://github.com/login/oauth/authorize

  switch (providerName) {
    case 'google':
      return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${provider.clientId}&redirect_uri=${provider.redirectUri}&response_type=code&scope=email profile&access_type=offline`;
    case 'github':
      return `https://github.com/login/oauth/authorize?client_id=${provider.clientId}&redirect_uri=${provider.redirectUri}&scope=user:email`;
    case 'apple':
      return `https://appleid.apple.com/auth/authorize?client_id=${provider.clientId}&redirect_uri=${provider.redirectUri}&response_type=code&scope=email name&response_mode=form_post`;
    default:
      throw new Error(`Unsupported OAuth provider: ${providerName}`);
  }
};

// Exchange OAuth code for access token
const exchangeCodeForToken = async (providerName, _code) => {
  const provider = oauthProviders[providerName];

  if (!provider) {
    throw new Error(`OAuth provider ${providerName} not configured`);
  }

  // Reference unused arg to satisfy lint rules
  void _code;

  // In a real implementation, this would make an HTTP request to exchange the code
  // For now, we'll return a mock token
  return {
    access_token: 'mock_access_token',
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: 'mock_refresh_token',
  };
};

// Get user info from OAuth provider
const getUserInfo = async (providerName, _accessToken) => {
  // In a real implementation, this would make an HTTP request to get user info
  // For now, we'll return mock user data
  // Reference unused arg to satisfy lint rules
  void _accessToken;
  return {
    id: 'oauth_user_123',
    email: 'oauth@example.com',
    firstName: 'OAuth',
    lastName: 'User',
    provider: providerName,
  };
};

// Create or update user based on OAuth data
const createOrUpdateOAuthUser = async (oauthUserData) => {
  const { User } = require('../models');

  // Check if user already exists with this OAuth provider and ID
  let user = await User.findOne({
    where: {
      oauthProvider: oauthUserData.provider,
      oauthId: oauthUserData.id,
    },
  });

  if (user) {
    // Update existing user
    await user.update({
      email: oauthUserData.email,
      firstName: oauthUserData.firstName,
      lastName: oauthUserData.lastName,
      lastLoginAt: new Date(),
    });
  } else {
    // Check if user exists with this email (traditional login)
    user = await User.findOne({
      where: {
        email: oauthUserData.email,
      },
    });

    if (user) {
      // Link OAuth account to existing user
      await user.update({
        oauthProvider: oauthUserData.provider,
        oauthId: oauthUserData.id,
        lastLoginAt: new Date(),
      });
    } else {
      // Create new user
      user = await User.create({
        email: oauthUserData.email,
        firstName: oauthUserData.firstName,
        lastName: oauthUserData.lastName,
        oauthProvider: oauthUserData.provider,
        oauthId: oauthUserData.id,
        isActive: true,
      });
    }
  }

  return user;
};

// Generate JWT token for OAuth user
const generateOAuthToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      oauth: true,
    },
    jwtSecret,
    { expiresIn: '24h' }
  );
};

module.exports = {
  generateOAuthUrl,
  exchangeCodeForToken,
  getUserInfo,
  createOrUpdateOAuthUser,
  generateOAuthToken,
};
