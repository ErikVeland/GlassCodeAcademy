// Helper to read optional env vars safely
const env = (name: string) => process.env[name];

export const getAuthProviders = () => {
  const providers = [];

  // Google OAuth
  if (env('GOOGLE_CLIENT_ID') && env('GOOGLE_CLIENT_SECRET')) {
    providers.push({
      id: 'google',
      name: 'Google',
    });
  }

  // GitHub OAuth
  if (env('GITHUB_ID') && env('GITHUB_SECRET')) {
    providers.push({
      id: 'github',
      name: 'GitHub',
    });
  }

  // Apple OAuth (requires proper credentials)
  if (env('APPLE_CLIENT_ID') && env('APPLE_CLIENT_SECRET')) {
    providers.push({
      id: 'apple',
      name: 'Apple',
    });
  }

  // Email/Password via Credentials
  // Always include credentials provider for full user lifecycle
  providers.push({
    id: 'credentials',
    name: 'Email and Password',
  });

  return providers;
};