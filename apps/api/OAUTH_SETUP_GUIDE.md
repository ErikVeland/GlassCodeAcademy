# OAuth Setup Guide

This guide explains how to configure Google and GitHub OAuth authentication for GlassCode Academy.

## Overview

OAuth credentials have been added to `.env` with placeholder values. Follow the steps below to obtain real credentials from each provider.

## Google OAuth Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a Project" → "New Project"
3. Name: `GlassCode Academy` (or your preferred name)
4. Click "Create"

### 2. Enable Google+ API

1. In the project dashboard, go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click on it and click "Enable"

### 3. Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - User Type: **External** (for testing) or **Internal** (for organization)
   - App name: `GlassCode Academy`
   - User support email: Your email
   - Developer contact: Your email
   - Scopes: Add `email` and `profile`
   - Test users: Add your email (for External apps in testing mode)

4. Application type: **Web application**
5. Name: `GlassCode Academy Web`
6. Authorized JavaScript origins:
   - `http://localhost:8080`
   - `http://localhost:3000` (for Next.js frontend)
7. Authorized redirect URIs:
   - `http://localhost:8080/api/oauth/google/callback`
8. Click **Create**

### 4. Copy Credentials to .env

```bash
GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-client-secret
```

## GitHub OAuth Setup

### 1. Register a New OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** → **New OAuth App**

### 2. Fill in Application Details

- **Application name**: `GlassCode Academy` (or your preferred name)
- **Homepage URL**: `http://localhost:8080` (development) or your production URL
- **Application description**: `Learning management system for coding education`
- **Authorization callback URL**: `http://localhost:8080/api/oauth/github/callback`

### 3. Register Application

1. Click **Register application**
2. On the next page, you'll see your **Client ID**
3. Click **Generate a new client secret**
4. Copy both the Client ID and Client Secret

### 4. Copy Credentials to .env

```bash
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

## Testing OAuth Flow

### 1. Start the Backend Server

```bash
cd backend-node
npm start
```

### 2. Test OAuth URL Generation

#### Google OAuth:
```bash
curl http://localhost:8080/api/oauth/google
```

Expected response:
```json
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=...&response_type=code&scope=email%20profile&access_type=offline"
}
```

#### GitHub OAuth:
```bash
curl http://localhost:8080/api/oauth/github
```

Expected response:
```json
{
  "url": "https://github.com/login/oauth/authorize?client_id=...&redirect_uri=...&scope=user:email"
}
```

### 3. Test Full OAuth Flow

1. Open the OAuth URL in a browser
2. Sign in with Google/GitHub
3. Authorize the application
4. You should be redirected to the callback URL
5. The backend will exchange the code for a token and create/update the user

## Production Configuration

For production deployment, update the following in your production `.env`:

```bash
# Update redirect URIs to production domain
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/oauth/google/callback
GITHUB_REDIRECT_URI=https://yourdomain.com/api/oauth/github/callback
```

Also update the OAuth app configurations in Google Cloud Console and GitHub to include production URLs:
- Add production domain to authorized origins/redirect URIs
- Update homepage URL to production domain

## Security Best Practices

1. **Never commit `.env` to version control** - it contains secrets
2. **Use different credentials for dev/staging/production**
3. **Rotate secrets regularly** (every 90 days recommended)
4. **Store production secrets in a secure vault** (AWS Secrets Manager, HashiCorp Vault, etc.)
5. **Limit OAuth scopes** to only what's needed (email, profile)
6. **Enable OAuth consent screen verification** for production (Google)
7. **Monitor OAuth usage** in provider dashboards

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Ensure the redirect URI in your OAuth app matches exactly what's in `.env`
- Check for trailing slashes, http vs https, port numbers

### Error: "invalid_client"
- Verify Client ID and Client Secret are correct
- Check that the OAuth app is enabled
- Ensure environment variables are loaded correctly

### Error: "access_denied"
- User declined authorization
- Check OAuth consent screen configuration
- Verify scopes are configured correctly

### Users can't see the consent screen
- For Google: Add user as a test user in OAuth consent screen settings
- For GitHub: Ensure the OAuth app is not suspended

## Current Implementation Status

✅ OAuth service implemented (`src/services/oauthService.js`)
✅ OAuth routes configured (`src/routes/oauth.js`)
✅ Environment variables configured (`.env`)
✅ Unit tests passing (12 tests for OAuth service)
⚠️ Credentials are placeholders - need real values from providers
⚠️ Frontend OAuth integration pending

## Next Steps

1. ✅ **Add OAuth credentials** - This guide
2. **Refactor server.js** - Separate app from server for testing
3. **Continue unit testing** - Test remaining 15 services
4. **Deploy monitoring** - Prometheus, Grafana, Jaeger
5. **Migrate to PostgreSQL** - Production database setup

## References

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps)
- [OAuth 2.0 RFC](https://datatracker.ietf.org/doc/html/rfc6749)
# OAuth Setup Guide

This guide explains how to configure Google and GitHub OAuth authentication for GlassCode Academy.

## Overview

OAuth credentials have been added to `.env` with placeholder values. Follow the steps below to obtain real credentials from each provider.

## Google OAuth Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a Project" → "New Project"
3. Name: `GlassCode Academy` (or your preferred name)
4. Click "Create"

### 2. Enable Google+ API

1. In the project dashboard, go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click on it and click "Enable"

### 3. Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - User Type: **External** (for testing) or **Internal** (for organization)
   - App name: `GlassCode Academy`
   - User support email: Your email
   - Developer contact: Your email
   - Scopes: Add `email` and `profile`
   - Test users: Add your email (for External apps in testing mode)

4. Application type: **Web application**
5. Name: `GlassCode Academy Web`
6. Authorized JavaScript origins:
   - `http://localhost:8080`
   - `http://localhost:3000` (for Next.js frontend)
7. Authorized redirect URIs:
   - `http://localhost:8080/api/oauth/google/callback`
8. Click **Create**

### 4. Copy Credentials to .env

```bash
GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-client-secret
```

## GitHub OAuth Setup

### 1. Register a New OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** → **New OAuth App**

### 2. Fill in Application Details

- **Application name**: `GlassCode Academy` (or your preferred name)
- **Homepage URL**: `http://localhost:8080` (development) or your production URL
- **Application description**: `Learning management system for coding education`
- **Authorization callback URL**: `http://localhost:8080/api/oauth/github/callback`

### 3. Register Application

1. Click **Register application**
2. On the next page, you'll see your **Client ID**
3. Click **Generate a new client secret**
4. Copy both the Client ID and Client Secret

### 4. Copy Credentials to .env

```bash
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

## Testing OAuth Flow

### 1. Start the Backend Server

```bash
cd backend-node
npm start
```

### 2. Test OAuth URL Generation

#### Google OAuth:
```bash
curl http://localhost:8080/api/oauth/google
```

Expected response:
```json
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=...&response_type=code&scope=email%20profile&access_type=offline"
}
```

#### GitHub OAuth:
```bash
curl http://localhost:8080/api/oauth/github
```

Expected response:
```json
{
  "url": "https://github.com/login/oauth/authorize?client_id=...&redirect_uri=...&scope=user:email"
}
```

### 3. Test Full OAuth Flow

1. Open the OAuth URL in a browser
2. Sign in with Google/GitHub
3. Authorize the application
4. You should be redirected to the callback URL
5. The backend will exchange the code for a token and create/update the user

## Production Configuration

For production deployment, update the following in your production `.env`:

```bash
# Update redirect URIs to production domain
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/oauth/google/callback
GITHUB_REDIRECT_URI=https://yourdomain.com/api/oauth/github/callback
```

Also update the OAuth app configurations in Google Cloud Console and GitHub to include production URLs:
- Add production domain to authorized origins/redirect URIs
- Update homepage URL to production domain

## Security Best Practices

1. **Never commit `.env` to version control** - it contains secrets
2. **Use different credentials for dev/staging/production**
3. **Rotate secrets regularly** (every 90 days recommended)
4. **Store production secrets in a secure vault** (AWS Secrets Manager, HashiCorp Vault, etc.)
5. **Limit OAuth scopes** to only what's needed (email, profile)
6. **Enable OAuth consent screen verification** for production (Google)
7. **Monitor OAuth usage** in provider dashboards

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Ensure the redirect URI in your OAuth app matches exactly what's in `.env`
- Check for trailing slashes, http vs https, port numbers

### Error: "invalid_client"
- Verify Client ID and Client Secret are correct
- Check that the OAuth app is enabled
- Ensure environment variables are loaded correctly

### Error: "access_denied"
- User declined authorization
- Check OAuth consent screen configuration
- Verify scopes are configured correctly

### Users can't see the consent screen
- For Google: Add user as a test user in OAuth consent screen settings
- For GitHub: Ensure the OAuth app is not suspended

## Current Implementation Status

✅ OAuth service implemented (`src/services/oauthService.js`)
✅ OAuth routes configured (`src/routes/oauth.js`)
✅ Environment variables configured (`.env`)
✅ Unit tests passing (12 tests for OAuth service)
⚠️ Credentials are placeholders - need real values from providers
⚠️ Frontend OAuth integration pending

## Next Steps

1. ✅ **Add OAuth credentials** - This guide
2. **Refactor server.js** - Separate app from server for testing
3. **Continue unit testing** - Test remaining 15 services
4. **Deploy monitoring** - Prometheus, Grafana, Jaeger
5. **Migrate to PostgreSQL** - Production database setup

## References

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps)
- [OAuth 2.0 RFC](https://datatracker.ietf.org/doc/html/rfc6749)
# OAuth Setup Guide

This guide explains how to configure Google and GitHub OAuth authentication for GlassCode Academy.

## Overview

OAuth credentials have been added to `.env` with placeholder values. Follow the steps below to obtain real credentials from each provider.

## Google OAuth Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a Project" → "New Project"
3. Name: `GlassCode Academy` (or your preferred name)
4. Click "Create"

### 2. Enable Google+ API

1. In the project dashboard, go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click on it and click "Enable"

### 3. Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - User Type: **External** (for testing) or **Internal** (for organization)
   - App name: `GlassCode Academy`
   - User support email: Your email
   - Developer contact: Your email
   - Scopes: Add `email` and `profile`
   - Test users: Add your email (for External apps in testing mode)

4. Application type: **Web application**
5. Name: `GlassCode Academy Web`
6. Authorized JavaScript origins:
   - `http://localhost:8080`
   - `http://localhost:3000` (for Next.js frontend)
7. Authorized redirect URIs:
   - `http://localhost:8080/api/oauth/google/callback`
8. Click **Create**

### 4. Copy Credentials to .env

```bash
GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-client-secret
```

## GitHub OAuth Setup

### 1. Register a New OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** → **New OAuth App**

### 2. Fill in Application Details

- **Application name**: `GlassCode Academy` (or your preferred name)
- **Homepage URL**: `http://localhost:8080` (development) or your production URL
- **Application description**: `Learning management system for coding education`
- **Authorization callback URL**: `http://localhost:8080/api/oauth/github/callback`

### 3. Register Application

1. Click **Register application**
2. On the next page, you'll see your **Client ID**
3. Click **Generate a new client secret**
4. Copy both the Client ID and Client Secret

### 4. Copy Credentials to .env

```bash
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

## Testing OAuth Flow

### 1. Start the Backend Server

```bash
cd backend-node
npm start
```

### 2. Test OAuth URL Generation

#### Google OAuth:
```bash
curl http://localhost:8080/api/oauth/google
```

Expected response:
```json
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=...&response_type=code&scope=email%20profile&access_type=offline"
}
```

#### GitHub OAuth:
```bash
curl http://localhost:8080/api/oauth/github
```

Expected response:
```json
{
  "url": "https://github.com/login/oauth/authorize?client_id=...&redirect_uri=...&scope=user:email"
}
```

### 3. Test Full OAuth Flow

1. Open the OAuth URL in a browser
2. Sign in with Google/GitHub
3. Authorize the application
4. You should be redirected to the callback URL
5. The backend will exchange the code for a token and create/update the user

## Production Configuration

For production deployment, update the following in your production `.env`:

```bash
# Update redirect URIs to production domain
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/oauth/google/callback
GITHUB_REDIRECT_URI=https://yourdomain.com/api/oauth/github/callback
```

Also update the OAuth app configurations in Google Cloud Console and GitHub to include production URLs:
- Add production domain to authorized origins/redirect URIs
- Update homepage URL to production domain

## Security Best Practices

1. **Never commit `.env` to version control** - it contains secrets
2. **Use different credentials for dev/staging/production**
3. **Rotate secrets regularly** (every 90 days recommended)
4. **Store production secrets in a secure vault** (AWS Secrets Manager, HashiCorp Vault, etc.)
5. **Limit OAuth scopes** to only what's needed (email, profile)
6. **Enable OAuth consent screen verification** for production (Google)
7. **Monitor OAuth usage** in provider dashboards

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Ensure the redirect URI in your OAuth app matches exactly what's in `.env`
- Check for trailing slashes, http vs https, port numbers

### Error: "invalid_client"
- Verify Client ID and Client Secret are correct
- Check that the OAuth app is enabled
- Ensure environment variables are loaded correctly

### Error: "access_denied"
- User declined authorization
- Check OAuth consent screen configuration
- Verify scopes are configured correctly

### Users can't see the consent screen
- For Google: Add user as a test user in OAuth consent screen settings
- For GitHub: Ensure the OAuth app is not suspended

## Current Implementation Status

✅ OAuth service implemented (`src/services/oauthService.js`)
✅ OAuth routes configured (`src/routes/oauth.js`)
✅ Environment variables configured (`.env`)
✅ Unit tests passing (12 tests for OAuth service)
⚠️ Credentials are placeholders - need real values from providers
⚠️ Frontend OAuth integration pending

## Next Steps

1. ✅ **Add OAuth credentials** - This guide
2. **Refactor server.js** - Separate app from server for testing
3. **Continue unit testing** - Test remaining 15 services
4. **Deploy monitoring** - Prometheus, Grafana, Jaeger
5. **Migrate to PostgreSQL** - Production database setup

## References

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps)
- [OAuth 2.0 RFC](https://datatracker.ietf.org/doc/html/rfc6749)
# OAuth Setup Guide

This guide explains how to configure Google and GitHub OAuth authentication for GlassCode Academy.

## Overview

OAuth credentials have been added to `.env` with placeholder values. Follow the steps below to obtain real credentials from each provider.

## Google OAuth Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a Project" → "New Project"
3. Name: `GlassCode Academy` (or your preferred name)
4. Click "Create"

### 2. Enable Google+ API

1. In the project dashboard, go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click on it and click "Enable"

### 3. Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - User Type: **External** (for testing) or **Internal** (for organization)
   - App name: `GlassCode Academy`
   - User support email: Your email
   - Developer contact: Your email
   - Scopes: Add `email` and `profile`
   - Test users: Add your email (for External apps in testing mode)

4. Application type: **Web application**
5. Name: `GlassCode Academy Web`
6. Authorized JavaScript origins:
   - `http://localhost:8080`
   - `http://localhost:3000` (for Next.js frontend)
7. Authorized redirect URIs:
   - `http://localhost:8080/api/oauth/google/callback`
8. Click **Create**

### 4. Copy Credentials to .env

```bash
GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-client-secret
```

## GitHub OAuth Setup

### 1. Register a New OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** → **New OAuth App**

### 2. Fill in Application Details

- **Application name**: `GlassCode Academy` (or your preferred name)
- **Homepage URL**: `http://localhost:8080` (development) or your production URL
- **Application description**: `Learning management system for coding education`
- **Authorization callback URL**: `http://localhost:8080/api/oauth/github/callback`

### 3. Register Application

1. Click **Register application**
2. On the next page, you'll see your **Client ID**
3. Click **Generate a new client secret**
4. Copy both the Client ID and Client Secret

### 4. Copy Credentials to .env

```bash
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

## Testing OAuth Flow

### 1. Start the Backend Server

```bash
cd backend-node
npm start
```

### 2. Test OAuth URL Generation

#### Google OAuth:
```bash
curl http://localhost:8080/api/oauth/google
```

Expected response:
```json
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=...&response_type=code&scope=email%20profile&access_type=offline"
}
```

#### GitHub OAuth:
```bash
curl http://localhost:8080/api/oauth/github
```

Expected response:
```json
{
  "url": "https://github.com/login/oauth/authorize?client_id=...&redirect_uri=...&scope=user:email"
}
```

### 3. Test Full OAuth Flow

1. Open the OAuth URL in a browser
2. Sign in with Google/GitHub
3. Authorize the application
4. You should be redirected to the callback URL
5. The backend will exchange the code for a token and create/update the user

## Production Configuration

For production deployment, update the following in your production `.env`:

```bash
# Update redirect URIs to production domain
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/oauth/google/callback
GITHUB_REDIRECT_URI=https://yourdomain.com/api/oauth/github/callback
```

Also update the OAuth app configurations in Google Cloud Console and GitHub to include production URLs:
- Add production domain to authorized origins/redirect URIs
- Update homepage URL to production domain

## Security Best Practices

1. **Never commit `.env` to version control** - it contains secrets
2. **Use different credentials for dev/staging/production**
3. **Rotate secrets regularly** (every 90 days recommended)
4. **Store production secrets in a secure vault** (AWS Secrets Manager, HashiCorp Vault, etc.)
5. **Limit OAuth scopes** to only what's needed (email, profile)
6. **Enable OAuth consent screen verification** for production (Google)
7. **Monitor OAuth usage** in provider dashboards

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Ensure the redirect URI in your OAuth app matches exactly what's in `.env`
- Check for trailing slashes, http vs https, port numbers

### Error: "invalid_client"
- Verify Client ID and Client Secret are correct
- Check that the OAuth app is enabled
- Ensure environment variables are loaded correctly

### Error: "access_denied"
- User declined authorization
- Check OAuth consent screen configuration
- Verify scopes are configured correctly

### Users can't see the consent screen
- For Google: Add user as a test user in OAuth consent screen settings
- For GitHub: Ensure the OAuth app is not suspended

## Current Implementation Status

✅ OAuth service implemented (`src/services/oauthService.js`)
✅ OAuth routes configured (`src/routes/oauth.js`)
✅ Environment variables configured (`.env`)
✅ Unit tests passing (12 tests for OAuth service)
⚠️ Credentials are placeholders - need real values from providers
⚠️ Frontend OAuth integration pending

## Next Steps

1. ✅ **Add OAuth credentials** - This guide
2. **Refactor server.js** - Separate app from server for testing
3. **Continue unit testing** - Test remaining 15 services
4. **Deploy monitoring** - Prometheus, Grafana, Jaeger
5. **Migrate to PostgreSQL** - Production database setup

## References

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps)
- [OAuth 2.0 RFC](https://datatracker.ietf.org/doc/html/rfc6749)
# OAuth Setup Guide

This guide explains how to configure Google and GitHub OAuth authentication for GlassCode Academy.

## Overview

OAuth credentials have been added to `.env` with placeholder values. Follow the steps below to obtain real credentials from each provider.

## Google OAuth Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a Project" → "New Project"
3. Name: `GlassCode Academy` (or your preferred name)
4. Click "Create"

### 2. Enable Google+ API

1. In the project dashboard, go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click on it and click "Enable"

### 3. Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - User Type: **External** (for testing) or **Internal** (for organization)
   - App name: `GlassCode Academy`
   - User support email: Your email
   - Developer contact: Your email
   - Scopes: Add `email` and `profile`
   - Test users: Add your email (for External apps in testing mode)

4. Application type: **Web application**
5. Name: `GlassCode Academy Web`
6. Authorized JavaScript origins:
   - `http://localhost:8080`
   - `http://localhost:3000` (for Next.js frontend)
7. Authorized redirect URIs:
   - `http://localhost:8080/api/oauth/google/callback`
8. Click **Create**

### 4. Copy Credentials to .env

```bash
GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-client-secret
```

## GitHub OAuth Setup

### 1. Register a New OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** → **New OAuth App**

### 2. Fill in Application Details

- **Application name**: `GlassCode Academy` (or your preferred name)
- **Homepage URL**: `http://localhost:8080` (development) or your production URL
- **Application description**: `Learning management system for coding education`
- **Authorization callback URL**: `http://localhost:8080/api/oauth/github/callback`

### 3. Register Application

1. Click **Register application**
2. On the next page, you'll see your **Client ID**
3. Click **Generate a new client secret**
4. Copy both the Client ID and Client Secret

### 4. Copy Credentials to .env

```bash
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

## Testing OAuth Flow

### 1. Start the Backend Server

```bash
cd backend-node
npm start
```

### 2. Test OAuth URL Generation

#### Google OAuth:
```bash
curl http://localhost:8080/api/oauth/google
```

Expected response:
```json
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=...&response_type=code&scope=email%20profile&access_type=offline"
}
```

#### GitHub OAuth:
```bash
curl http://localhost:8080/api/oauth/github
```

Expected response:
```json
{
  "url": "https://github.com/login/oauth/authorize?client_id=...&redirect_uri=...&scope=user:email"
}
```

### 3. Test Full OAuth Flow

1. Open the OAuth URL in a browser
2. Sign in with Google/GitHub
3. Authorize the application
4. You should be redirected to the callback URL
5. The backend will exchange the code for a token and create/update the user

## Production Configuration

For production deployment, update the following in your production `.env`:

```bash
# Update redirect URIs to production domain
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/oauth/google/callback
GITHUB_REDIRECT_URI=https://yourdomain.com/api/oauth/github/callback
```

Also update the OAuth app configurations in Google Cloud Console and GitHub to include production URLs:
- Add production domain to authorized origins/redirect URIs
- Update homepage URL to production domain

## Security Best Practices

1. **Never commit `.env` to version control** - it contains secrets
2. **Use different credentials for dev/staging/production**
3. **Rotate secrets regularly** (every 90 days recommended)
4. **Store production secrets in a secure vault** (AWS Secrets Manager, HashiCorp Vault, etc.)
5. **Limit OAuth scopes** to only what's needed (email, profile)
6. **Enable OAuth consent screen verification** for production (Google)
7. **Monitor OAuth usage** in provider dashboards

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Ensure the redirect URI in your OAuth app matches exactly what's in `.env`
- Check for trailing slashes, http vs https, port numbers

### Error: "invalid_client"
- Verify Client ID and Client Secret are correct
- Check that the OAuth app is enabled
- Ensure environment variables are loaded correctly

### Error: "access_denied"
- User declined authorization
- Check OAuth consent screen configuration
- Verify scopes are configured correctly

### Users can't see the consent screen
- For Google: Add user as a test user in OAuth consent screen settings
- For GitHub: Ensure the OAuth app is not suspended

## Current Implementation Status

✅ OAuth service implemented (`src/services/oauthService.js`)
✅ OAuth routes configured (`src/routes/oauth.js`)
✅ Environment variables configured (`.env`)
✅ Unit tests passing (12 tests for OAuth service)
⚠️ Credentials are placeholders - need real values from providers
⚠️ Frontend OAuth integration pending

## Next Steps

1. ✅ **Add OAuth credentials** - This guide
2. **Refactor server.js** - Separate app from server for testing
3. **Continue unit testing** - Test remaining 15 services
4. **Deploy monitoring** - Prometheus, Grafana, Jaeger
5. **Migrate to PostgreSQL** - Production database setup

## References

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps)
- [OAuth 2.0 RFC](https://datatracker.ietf.org/doc/html/rfc6749)
# OAuth Setup Guide

This guide explains how to configure Google and GitHub OAuth authentication for GlassCode Academy.

## Overview

OAuth credentials have been added to `.env` with placeholder values. Follow the steps below to obtain real credentials from each provider.

## Google OAuth Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a Project" → "New Project"
3. Name: `GlassCode Academy` (or your preferred name)
4. Click "Create"

### 2. Enable Google+ API

1. In the project dashboard, go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click on it and click "Enable"

### 3. Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - User Type: **External** (for testing) or **Internal** (for organization)
   - App name: `GlassCode Academy`
   - User support email: Your email
   - Developer contact: Your email
   - Scopes: Add `email` and `profile`
   - Test users: Add your email (for External apps in testing mode)

4. Application type: **Web application**
5. Name: `GlassCode Academy Web`
6. Authorized JavaScript origins:
   - `http://localhost:8080`
   - `http://localhost:3000` (for Next.js frontend)
7. Authorized redirect URIs:
   - `http://localhost:8080/api/oauth/google/callback`
8. Click **Create**

### 4. Copy Credentials to .env

```bash
GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-client-secret
```

## GitHub OAuth Setup

### 1. Register a New OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** → **New OAuth App**

### 2. Fill in Application Details

- **Application name**: `GlassCode Academy` (or your preferred name)
- **Homepage URL**: `http://localhost:8080` (development) or your production URL
- **Application description**: `Learning management system for coding education`
- **Authorization callback URL**: `http://localhost:8080/api/oauth/github/callback`

### 3. Register Application

1. Click **Register application**
2. On the next page, you'll see your **Client ID**
3. Click **Generate a new client secret**
4. Copy both the Client ID and Client Secret

### 4. Copy Credentials to .env

```bash
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

## Testing OAuth Flow

### 1. Start the Backend Server

```bash
cd backend-node
npm start
```

### 2. Test OAuth URL Generation

#### Google OAuth:
```bash
curl http://localhost:8080/api/oauth/google
```

Expected response:
```json
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=...&response_type=code&scope=email%20profile&access_type=offline"
}
```

#### GitHub OAuth:
```bash
curl http://localhost:8080/api/oauth/github
```

Expected response:
```json
{
  "url": "https://github.com/login/oauth/authorize?client_id=...&redirect_uri=...&scope=user:email"
}
```

### 3. Test Full OAuth Flow

1. Open the OAuth URL in a browser
2. Sign in with Google/GitHub
3. Authorize the application
4. You should be redirected to the callback URL
5. The backend will exchange the code for a token and create/update the user

## Production Configuration

For production deployment, update the following in your production `.env`:

```bash
# Update redirect URIs to production domain
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/oauth/google/callback
GITHUB_REDIRECT_URI=https://yourdomain.com/api/oauth/github/callback
```

Also update the OAuth app configurations in Google Cloud Console and GitHub to include production URLs:
- Add production domain to authorized origins/redirect URIs
- Update homepage URL to production domain

## Security Best Practices

1. **Never commit `.env` to version control** - it contains secrets
2. **Use different credentials for dev/staging/production**
3. **Rotate secrets regularly** (every 90 days recommended)
4. **Store production secrets in a secure vault** (AWS Secrets Manager, HashiCorp Vault, etc.)
5. **Limit OAuth scopes** to only what's needed (email, profile)
6. **Enable OAuth consent screen verification** for production (Google)
7. **Monitor OAuth usage** in provider dashboards

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Ensure the redirect URI in your OAuth app matches exactly what's in `.env`
- Check for trailing slashes, http vs https, port numbers

### Error: "invalid_client"
- Verify Client ID and Client Secret are correct
- Check that the OAuth app is enabled
- Ensure environment variables are loaded correctly

### Error: "access_denied"
- User declined authorization
- Check OAuth consent screen configuration
- Verify scopes are configured correctly

### Users can't see the consent screen
- For Google: Add user as a test user in OAuth consent screen settings
- For GitHub: Ensure the OAuth app is not suspended

## Current Implementation Status

✅ OAuth service implemented (`src/services/oauthService.js`)
✅ OAuth routes configured (`src/routes/oauth.js`)
✅ Environment variables configured (`.env`)
✅ Unit tests passing (12 tests for OAuth service)
⚠️ Credentials are placeholders - need real values from providers
⚠️ Frontend OAuth integration pending

## Next Steps

1. ✅ **Add OAuth credentials** - This guide
2. **Refactor server.js** - Separate app from server for testing
3. **Continue unit testing** - Test remaining 15 services
4. **Deploy monitoring** - Prometheus, Grafana, Jaeger
5. **Migrate to PostgreSQL** - Production database setup

## References

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps)
- [OAuth 2.0 RFC](https://datatracker.ietf.org/doc/html/rfc6749)
# OAuth Setup Guide

This guide explains how to configure Google and GitHub OAuth authentication for GlassCode Academy.

## Overview

OAuth credentials have been added to `.env` with placeholder values. Follow the steps below to obtain real credentials from each provider.

## Google OAuth Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a Project" → "New Project"
3. Name: `GlassCode Academy` (or your preferred name)
4. Click "Create"

### 2. Enable Google+ API

1. In the project dashboard, go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click on it and click "Enable"

### 3. Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - User Type: **External** (for testing) or **Internal** (for organization)
   - App name: `GlassCode Academy`
   - User support email: Your email
   - Developer contact: Your email
   - Scopes: Add `email` and `profile`
   - Test users: Add your email (for External apps in testing mode)

4. Application type: **Web application**
5. Name: `GlassCode Academy Web`
6. Authorized JavaScript origins:
   - `http://localhost:8080`
   - `http://localhost:3000` (for Next.js frontend)
7. Authorized redirect URIs:
   - `http://localhost:8080/api/oauth/google/callback`
8. Click **Create**

### 4. Copy Credentials to .env

```bash
GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-client-secret
```

## GitHub OAuth Setup

### 1. Register a New OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** → **New OAuth App**

### 2. Fill in Application Details

- **Application name**: `GlassCode Academy` (or your preferred name)
- **Homepage URL**: `http://localhost:8080` (development) or your production URL
- **Application description**: `Learning management system for coding education`
- **Authorization callback URL**: `http://localhost:8080/api/oauth/github/callback`

### 3. Register Application

1. Click **Register application**
2. On the next page, you'll see your **Client ID**
3. Click **Generate a new client secret**
4. Copy both the Client ID and Client Secret

### 4. Copy Credentials to .env

```bash
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

## Testing OAuth Flow

### 1. Start the Backend Server

```bash
cd backend-node
npm start
```

### 2. Test OAuth URL Generation

#### Google OAuth:
```bash
curl http://localhost:8080/api/oauth/google
```

Expected response:
```json
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=...&response_type=code&scope=email%20profile&access_type=offline"
}
```

#### GitHub OAuth:
```bash
curl http://localhost:8080/api/oauth/github
```

Expected response:
```json
{
  "url": "https://github.com/login/oauth/authorize?client_id=...&redirect_uri=...&scope=user:email"
}
```

### 3. Test Full OAuth Flow

1. Open the OAuth URL in a browser
2. Sign in with Google/GitHub
3. Authorize the application
4. You should be redirected to the callback URL
5. The backend will exchange the code for a token and create/update the user

## Production Configuration

For production deployment, update the following in your production `.env`:

```bash
# Update redirect URIs to production domain
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/oauth/google/callback
GITHUB_REDIRECT_URI=https://yourdomain.com/api/oauth/github/callback
```

Also update the OAuth app configurations in Google Cloud Console and GitHub to include production URLs:
- Add production domain to authorized origins/redirect URIs
- Update homepage URL to production domain

## Security Best Practices

1. **Never commit `.env` to version control** - it contains secrets
2. **Use different credentials for dev/staging/production**
3. **Rotate secrets regularly** (every 90 days recommended)
4. **Store production secrets in a secure vault** (AWS Secrets Manager, HashiCorp Vault, etc.)
5. **Limit OAuth scopes** to only what's needed (email, profile)
6. **Enable OAuth consent screen verification** for production (Google)
7. **Monitor OAuth usage** in provider dashboards

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Ensure the redirect URI in your OAuth app matches exactly what's in `.env`
- Check for trailing slashes, http vs https, port numbers

### Error: "invalid_client"
- Verify Client ID and Client Secret are correct
- Check that the OAuth app is enabled
- Ensure environment variables are loaded correctly

### Error: "access_denied"
- User declined authorization
- Check OAuth consent screen configuration
- Verify scopes are configured correctly

### Users can't see the consent screen
- For Google: Add user as a test user in OAuth consent screen settings
- For GitHub: Ensure the OAuth app is not suspended

## Current Implementation Status

✅ OAuth service implemented (`src/services/oauthService.js`)
✅ OAuth routes configured (`src/routes/oauth.js`)
✅ Environment variables configured (`.env`)
✅ Unit tests passing (12 tests for OAuth service)
⚠️ Credentials are placeholders - need real values from providers
⚠️ Frontend OAuth integration pending

## Next Steps

1. ✅ **Add OAuth credentials** - This guide
2. **Refactor server.js** - Separate app from server for testing
3. **Continue unit testing** - Test remaining 15 services
4. **Deploy monitoring** - Prometheus, Grafana, Jaeger
5. **Migrate to PostgreSQL** - Production database setup

## References

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps)
- [OAuth 2.0 RFC](https://datatracker.ietf.org/doc/html/rfc6749)
