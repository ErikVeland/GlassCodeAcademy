import axios from 'axios';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { generateToken } from './tokenService';
import { User } from '../models/index.js';

// OAuth provider configurations
const oauthConfigs: Record<string, any> = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    scope: 'openid email profile',
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    scope: 'user:email',
  },
  apple: {
    clientId: process.env.APPLE_CLIENT_ID,
    clientSecret: process.env.APPLE_CLIENT_SECRET,
    authUrl: 'https://appleid.apple.com/auth/authorize',
    tokenUrl: 'https://appleid.apple.com/auth/token',
    userInfoUrl: 'https://appleid.apple.com/auth/userinfo',
    scope: 'name email',
  },
};

export const generateOAuthUrl = (provider: string): string => {
  const config = oauthConfigs[provider];
  if (!config) {
    throw new Error(`OAuth provider ${provider} is not configured`);
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: `${process.env.API_BASE_URL}/auth/${provider}/callback`,
    response_type: 'code',
    scope: config.scope,
  });

  return `${config.authUrl}?${params.toString()}`;
};

export const exchangeCodeForToken = async (
  provider: string,
  code: string
): Promise<any> => {
  const config = oauthConfigs[provider];
  if (!config) {
    throw new Error(`OAuth provider ${provider} is not configured`);
  }

  const response = await axios.post(
    config.tokenUrl,
    {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: `${process.env.API_BASE_URL}/auth/${provider}/callback`,
      grant_type: 'authorization_code',
    },
    {
      headers: {
        Accept: 'application/json',
      },
    }
  );

  return response.data;
};

export const getUserInfo = async (
  provider: string,
  accessToken: string
): Promise<any> => {
  const config = oauthConfigs[provider];
  if (!config) {
    throw new Error(`OAuth provider ${provider} is not configured`);
  }

  const response = await axios.get(config.userInfoUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.data;
};

/**
 * Find or create a user from an OAuth profile.
 *
 * OAuth users don't choose a password, so we store a random hash that
 * cannot be used for credential-based login.
 */
export const createOrUpdateOAuthUser = async (userInfo: any) => {
  const email = userInfo.email;
  if (!email) {
    throw new Error('OAuth profile must include an email address');
  }

  const firstName =
    userInfo.firstName || userInfo.name?.split(' ')[0] || 'User';
  const lastName =
    userInfo.lastName || userInfo.name?.split(' ').slice(1).join(' ') || '';

  // findOrCreate is atomic in Sequelize and avoids race conditions
  const [user, created] = await (User as any).findOrCreate({
    where: { email },
    defaults: {
      firstName,
      lastName,
      // Random hash prevents credential login for OAuth-only accounts
      passwordHash: await bcrypt.hash(randomBytes(32).toString('hex'), 10),
      role: 'student',
      isActive: true,
    },
  });

  // If the user already existed, ensure the account is active
  if (!created && !user.isActive) {
    await user.update({ isActive: true });
  }

  return user;
};

export const generateOAuthToken = (user: any): string => {
  return generateToken(user);
};
