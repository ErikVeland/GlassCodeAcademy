import axios from 'axios';
import { generateToken } from './tokenService';

// Define User interface to replace Prisma type
interface User {
  id: string;
  email: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  passwordHash: string | null;
  isActive: boolean;
  lastLoginAt: Date;
  oauthProvider: string;
  oauthId: string;
  createdAt: Date;
  updatedAt: Date;
}

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

export const createOrUpdateOAuthUser = async (userInfo: any): Promise<User> => {
  // This is a placeholder implementation
  // In a real application, you would interact with your Prisma client here
  // to create or update the user in the database
  return {
    id: userInfo.id,
    email: userInfo.email,
    username: userInfo.username || null,
    firstName: userInfo.firstName || userInfo.name?.split(' ')[0] || null,
    lastName:
      userInfo.lastName || userInfo.name?.split(' ').slice(1).join(' ') || null,
    role: 'student',
    passwordHash: null,
    isActive: true,
    lastLoginAt: new Date(),
    oauthProvider: userInfo.provider,
    oauthId: userInfo.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;
};

export const generateOAuthToken = (user: User): string => {
  return generateToken(user);
};
