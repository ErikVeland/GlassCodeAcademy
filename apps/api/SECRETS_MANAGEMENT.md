# Secrets Management Guide

## Overview

This guide explains how to securely manage secrets and environment variables in the GlassCode Academy backend application.

## Key Principles

1. **Never commit secrets to Git** - Use `.env` files which are git-ignored
2. **Fail fast in production** - Missing secrets cause immediate startup failure
3. **Warn in development** - Missing secrets show warnings but use fallbacks
4. **Validate secret strength** - Production secrets must meet minimum security requirements

## Required Secrets

### Critical (Required in Production)

#### JWT_SECRET
- **Purpose**: Signs and verifies JWT authentication tokens
- **Requirements**: 
  - Minimum 32 characters in production
  - Minimum 8 characters in development
- **Generate**: `openssl rand -base64 32`
- **Example**: `JWT_SECRET=abc123def456...` (32+ characters)

#### SENTRY_DSN
- **Purpose**: Error tracking and monitoring
- **Requirements**: Valid Sentry DSN URL
- **Format**: `https://xxx@sentry.io/xxx`
- **Get from**: https://sentry.io project settings

### Database Configuration

Choose **one** of these options:

#### Option 1: DATABASE_URL (Recommended)
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/glasscode_db
```

#### Option 2: Discrete Variables
```bash
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=glasscode_db
DB_USER=your_username
DB_PASSWORD=your_secure_password
DB_SSL=false
```

### Optional Secrets

#### Redis Cache
```bash
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=optional_password
CACHE_ENABLED=true
```
- If not configured, caching gracefully falls back (logs warning)

#### OAuth Providers
Only required if `OAUTH_ENABLED=true`:

```bash
OAUTH_ENABLED=true
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
```

#### Email (SMTP)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
```

#### External APIs
```bash
# OpenAI (if AI features enabled)
OPENAI_API_KEY=sk-xxx

# Other API keys as needed
```

## Environment Files

### File Priority (highest to lowest)
1. `.env.[environment].local` - Local overrides (never commit)
2. `.env.[environment]` - Environment-specific (e.g., `.env.production`)
3. `.env.local` - Local overrides for all environments (never commit)
4. `.env` - Default values

### Environment Types

#### Development
```bash
NODE_ENV=development
```
- Allows insecure fallback secrets with warnings
- Shows detailed error messages
- Less strict validation

#### Production
```bash
NODE_ENV=production
```
- Fails immediately if required secrets missing
- Validates secret strength (min 32 chars for JWT)
- No fallback values
- Minimal error exposure

#### Test
```bash
NODE_ENV=test
```
- Uses consistent test secrets for reproducibility
- No external service calls
- In-memory database by default

## Setup Instructions

### 1. Copy Environment Template
```bash
cp .env.example .env
```

### 2. Generate Secure Secrets
```bash
# JWT Secret
openssl rand -base64 32

# Database Password (if not using managed service)
openssl rand -base64 24

# API Keys
# Generate from respective service providers
```

### 3. Fill in `.env` File
Replace all `REPLACE_WITH_XXX` placeholders with actual values.

### 4. Verify Configuration
Run the application - it will validate secrets on startup:

```bash
npm start
```

Expected output:
```
✓ Loaded environment from: .env
🔐 Validating secrets for environment: development
✅ All required secrets validated successfully
```

### 5. Check Health Endpoint
```bash
curl http://localhost:8080/health
```

Response includes configuration status:
```json
{
  "success": true,
  "data": {
    "message": "Server is running",
    "configuration": {
      "secretsConfigured": 8,
      "secretsMissing": 2,
      "warnings": 0
    }
  }
}
```

## Secret Rotation

### Rotating JWT_SECRET

⚠️ **WARNING**: Rotating JWT_SECRET invalidates all existing user sessions!

1. Generate new secret: `openssl rand -base64 32`
2. Update `.env` file with new value
3. Restart application
4. All users must log in again

### Rotating Database Credentials

1. Create new database user with same permissions
2. Update DATABASE_URL or DB_* variables
3. Test connection in staging
4. Deploy to production
5. Remove old database user

### Rotating OAuth Secrets

1. Generate new client secret in provider dashboard (Google/GitHub)
2. Update GOOGLE_CLIENT_SECRET or GITHUB_CLIENT_SECRET
3. Provider usually allows old secret to work during transition
4. Restart application
5. Revoke old secret after verification

## Security Best Practices

### DO ✅
- Generate strong, random secrets
- Use different secrets for each environment
- Rotate secrets regularly (every 90 days recommended)
- Use secret management services in production (AWS Secrets Manager, HashiCorp Vault)
- Limit access to production secrets
- Audit secret access
- Use environment variables, never hardcode

### DON'T ❌
- Commit secrets to Git
- Share secrets in Slack/Email
- Use weak or guessable secrets
- Reuse secrets across environments
- Log secret values
- Expose secrets in error messages
- Store secrets in application code

## Troubleshooting

### Error: "JWT_SECRET is not set in production"
**Cause**: Missing required JWT_SECRET environment variable

**Fix**:
```bash
# Generate secret
openssl rand -base64 32

# Add to .env or environment
JWT_SECRET=your_generated_secret_here
```

### Error: "JWT_SECRET must be at least 32 characters"
**Cause**: Secret too short for production security requirements

**Fix**: Generate a longer secret:
```bash
openssl rand -base64 48
```

### Warning: "Using insecure development fallback"
**Cause**: JWT_SECRET not set in development

**Impact**: Not critical in development, but should still be set

**Fix**: Set JWT_SECRET in `.env` file

### Error: "SENTRY_DSN format is invalid"
**Cause**: Sentry DSN doesn't match expected format

**Fix**: Copy exact DSN from Sentry project settings:
```
https://[key]@sentry.io/[project-id]
```

## Secret Management in CI/CD

### GitHub Actions
Use repository secrets:
```yaml
env:
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Docker
Use environment variables or Docker secrets:
```bash
docker run -e JWT_SECRET=xxx -e DATABASE_URL=xxx app
```

### Kubernetes
Use Kubernetes secrets:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: glasscode-secrets
data:
  jwt-secret: <base64-encoded-value>
```

## Integration with Secrets Managers

### AWS Secrets Manager (Recommended for Production)

Install AWS SDK:
```bash
npm install @aws-sdk/client-secrets-manager
```

Update `src/config/secrets.js` to fetch from AWS:
```javascript
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

async function getSecretFromAWS(secretName) {
  const client = new SecretsManagerClient({ region: 'us-east-1' });
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretName })
  );
  return JSON.parse(response.SecretString);
}
```

### HashiCorp Vault

```bash
npm install node-vault
```

See Vault documentation for integration details.

## Monitoring

### Health Check
Monitor `/health` endpoint for configuration status:
- `secretsConfigured`: Number of secrets set
- `secretsMissing`: Number of required secrets missing
- `warnings`: Number of weak/invalid secrets

### Alerts
Set up alerts for:
- Missing secrets in production
- Weak secrets detected
- Secret rotation due dates
- Failed secret validations

## Support

For secret-related issues:
1. Check this guide
2. Review application startup logs
3. Contact DevOps team for production secrets
4. Never share actual secret values when requesting help
# Secrets Management Guide

## Overview

This guide explains how to securely manage secrets and environment variables in the GlassCode Academy backend application.

## Key Principles

1. **Never commit secrets to Git** - Use `.env` files which are git-ignored
2. **Fail fast in production** - Missing secrets cause immediate startup failure
3. **Warn in development** - Missing secrets show warnings but use fallbacks
4. **Validate secret strength** - Production secrets must meet minimum security requirements

## Required Secrets

### Critical (Required in Production)

#### JWT_SECRET
- **Purpose**: Signs and verifies JWT authentication tokens
- **Requirements**: 
  - Minimum 32 characters in production
  - Minimum 8 characters in development
- **Generate**: `openssl rand -base64 32`
- **Example**: `JWT_SECRET=abc123def456...` (32+ characters)

#### SENTRY_DSN
- **Purpose**: Error tracking and monitoring
- **Requirements**: Valid Sentry DSN URL
- **Format**: `https://xxx@sentry.io/xxx`
- **Get from**: https://sentry.io project settings

### Database Configuration

Choose **one** of these options:

#### Option 1: DATABASE_URL (Recommended)
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/glasscode_db
```

#### Option 2: Discrete Variables
```bash
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=glasscode_db
DB_USER=your_username
DB_PASSWORD=your_secure_password
DB_SSL=false
```

### Optional Secrets

#### Redis Cache
```bash
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=optional_password
CACHE_ENABLED=true
```
- If not configured, caching gracefully falls back (logs warning)

#### OAuth Providers
Only required if `OAUTH_ENABLED=true`:

```bash
OAUTH_ENABLED=true
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
```

#### Email (SMTP)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
```

#### External APIs
```bash
# OpenAI (if AI features enabled)
OPENAI_API_KEY=sk-xxx

# Other API keys as needed
```

## Environment Files

### File Priority (highest to lowest)
1. `.env.[environment].local` - Local overrides (never commit)
2. `.env.[environment]` - Environment-specific (e.g., `.env.production`)
3. `.env.local` - Local overrides for all environments (never commit)
4. `.env` - Default values

### Environment Types

#### Development
```bash
NODE_ENV=development
```
- Allows insecure fallback secrets with warnings
- Shows detailed error messages
- Less strict validation

#### Production
```bash
NODE_ENV=production
```
- Fails immediately if required secrets missing
- Validates secret strength (min 32 chars for JWT)
- No fallback values
- Minimal error exposure

#### Test
```bash
NODE_ENV=test
```
- Uses consistent test secrets for reproducibility
- No external service calls
- In-memory database by default

## Setup Instructions

### 1. Copy Environment Template
```bash
cp .env.example .env
```

### 2. Generate Secure Secrets
```bash
# JWT Secret
openssl rand -base64 32

# Database Password (if not using managed service)
openssl rand -base64 24

# API Keys
# Generate from respective service providers
```

### 3. Fill in `.env` File
Replace all `REPLACE_WITH_XXX` placeholders with actual values.

### 4. Verify Configuration
Run the application - it will validate secrets on startup:

```bash
npm start
```

Expected output:
```
✓ Loaded environment from: .env
🔐 Validating secrets for environment: development
✅ All required secrets validated successfully
```

### 5. Check Health Endpoint
```bash
curl http://localhost:8080/health
```

Response includes configuration status:
```json
{
  "success": true,
  "data": {
    "message": "Server is running",
    "configuration": {
      "secretsConfigured": 8,
      "secretsMissing": 2,
      "warnings": 0
    }
  }
}
```

## Secret Rotation

### Rotating JWT_SECRET

⚠️ **WARNING**: Rotating JWT_SECRET invalidates all existing user sessions!

1. Generate new secret: `openssl rand -base64 32`
2. Update `.env` file with new value
3. Restart application
4. All users must log in again

### Rotating Database Credentials

1. Create new database user with same permissions
2. Update DATABASE_URL or DB_* variables
3. Test connection in staging
4. Deploy to production
5. Remove old database user

### Rotating OAuth Secrets

1. Generate new client secret in provider dashboard (Google/GitHub)
2. Update GOOGLE_CLIENT_SECRET or GITHUB_CLIENT_SECRET
3. Provider usually allows old secret to work during transition
4. Restart application
5. Revoke old secret after verification

## Security Best Practices

### DO ✅
- Generate strong, random secrets
- Use different secrets for each environment
- Rotate secrets regularly (every 90 days recommended)
- Use secret management services in production (AWS Secrets Manager, HashiCorp Vault)
- Limit access to production secrets
- Audit secret access
- Use environment variables, never hardcode

### DON'T ❌
- Commit secrets to Git
- Share secrets in Slack/Email
- Use weak or guessable secrets
- Reuse secrets across environments
- Log secret values
- Expose secrets in error messages
- Store secrets in application code

## Troubleshooting

### Error: "JWT_SECRET is not set in production"
**Cause**: Missing required JWT_SECRET environment variable

**Fix**:
```bash
# Generate secret
openssl rand -base64 32

# Add to .env or environment
JWT_SECRET=your_generated_secret_here
```

### Error: "JWT_SECRET must be at least 32 characters"
**Cause**: Secret too short for production security requirements

**Fix**: Generate a longer secret:
```bash
openssl rand -base64 48
```

### Warning: "Using insecure development fallback"
**Cause**: JWT_SECRET not set in development

**Impact**: Not critical in development, but should still be set

**Fix**: Set JWT_SECRET in `.env` file

### Error: "SENTRY_DSN format is invalid"
**Cause**: Sentry DSN doesn't match expected format

**Fix**: Copy exact DSN from Sentry project settings:
```
https://[key]@sentry.io/[project-id]
```

## Secret Management in CI/CD

### GitHub Actions
Use repository secrets:
```yaml
env:
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Docker
Use environment variables or Docker secrets:
```bash
docker run -e JWT_SECRET=xxx -e DATABASE_URL=xxx app
```

### Kubernetes
Use Kubernetes secrets:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: glasscode-secrets
data:
  jwt-secret: <base64-encoded-value>
```

## Integration with Secrets Managers

### AWS Secrets Manager (Recommended for Production)

Install AWS SDK:
```bash
npm install @aws-sdk/client-secrets-manager
```

Update `src/config/secrets.js` to fetch from AWS:
```javascript
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

async function getSecretFromAWS(secretName) {
  const client = new SecretsManagerClient({ region: 'us-east-1' });
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretName })
  );
  return JSON.parse(response.SecretString);
}
```

### HashiCorp Vault

```bash
npm install node-vault
```

See Vault documentation for integration details.

## Monitoring

### Health Check
Monitor `/health` endpoint for configuration status:
- `secretsConfigured`: Number of secrets set
- `secretsMissing`: Number of required secrets missing
- `warnings`: Number of weak/invalid secrets

### Alerts
Set up alerts for:
- Missing secrets in production
- Weak secrets detected
- Secret rotation due dates
- Failed secret validations

## Support

For secret-related issues:
1. Check this guide
2. Review application startup logs
3. Contact DevOps team for production secrets
4. Never share actual secret values when requesting help
# Secrets Management Guide

## Overview

This guide explains how to securely manage secrets and environment variables in the GlassCode Academy backend application.

## Key Principles

1. **Never commit secrets to Git** - Use `.env` files which are git-ignored
2. **Fail fast in production** - Missing secrets cause immediate startup failure
3. **Warn in development** - Missing secrets show warnings but use fallbacks
4. **Validate secret strength** - Production secrets must meet minimum security requirements

## Required Secrets

### Critical (Required in Production)

#### JWT_SECRET
- **Purpose**: Signs and verifies JWT authentication tokens
- **Requirements**: 
  - Minimum 32 characters in production
  - Minimum 8 characters in development
- **Generate**: `openssl rand -base64 32`
- **Example**: `JWT_SECRET=abc123def456...` (32+ characters)

#### SENTRY_DSN
- **Purpose**: Error tracking and monitoring
- **Requirements**: Valid Sentry DSN URL
- **Format**: `https://xxx@sentry.io/xxx`
- **Get from**: https://sentry.io project settings

### Database Configuration

Choose **one** of these options:

#### Option 1: DATABASE_URL (Recommended)
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/glasscode_db
```

#### Option 2: Discrete Variables
```bash
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=glasscode_db
DB_USER=your_username
DB_PASSWORD=your_secure_password
DB_SSL=false
```

### Optional Secrets

#### Redis Cache
```bash
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=optional_password
CACHE_ENABLED=true
```
- If not configured, caching gracefully falls back (logs warning)

#### OAuth Providers
Only required if `OAUTH_ENABLED=true`:

```bash
OAUTH_ENABLED=true
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
```

#### Email (SMTP)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
```

#### External APIs
```bash
# OpenAI (if AI features enabled)
OPENAI_API_KEY=sk-xxx

# Other API keys as needed
```

## Environment Files

### File Priority (highest to lowest)
1. `.env.[environment].local` - Local overrides (never commit)
2. `.env.[environment]` - Environment-specific (e.g., `.env.production`)
3. `.env.local` - Local overrides for all environments (never commit)
4. `.env` - Default values

### Environment Types

#### Development
```bash
NODE_ENV=development
```
- Allows insecure fallback secrets with warnings
- Shows detailed error messages
- Less strict validation

#### Production
```bash
NODE_ENV=production
```
- Fails immediately if required secrets missing
- Validates secret strength (min 32 chars for JWT)
- No fallback values
- Minimal error exposure

#### Test
```bash
NODE_ENV=test
```
- Uses consistent test secrets for reproducibility
- No external service calls
- In-memory database by default

## Setup Instructions

### 1. Copy Environment Template
```bash
cp .env.example .env
```

### 2. Generate Secure Secrets
```bash
# JWT Secret
openssl rand -base64 32

# Database Password (if not using managed service)
openssl rand -base64 24

# API Keys
# Generate from respective service providers
```

### 3. Fill in `.env` File
Replace all `REPLACE_WITH_XXX` placeholders with actual values.

### 4. Verify Configuration
Run the application - it will validate secrets on startup:

```bash
npm start
```

Expected output:
```
✓ Loaded environment from: .env
🔐 Validating secrets for environment: development
✅ All required secrets validated successfully
```

### 5. Check Health Endpoint
```bash
curl http://localhost:8080/health
```

Response includes configuration status:
```json
{
  "success": true,
  "data": {
    "message": "Server is running",
    "configuration": {
      "secretsConfigured": 8,
      "secretsMissing": 2,
      "warnings": 0
    }
  }
}
```

## Secret Rotation

### Rotating JWT_SECRET

⚠️ **WARNING**: Rotating JWT_SECRET invalidates all existing user sessions!

1. Generate new secret: `openssl rand -base64 32`
2. Update `.env` file with new value
3. Restart application
4. All users must log in again

### Rotating Database Credentials

1. Create new database user with same permissions
2. Update DATABASE_URL or DB_* variables
3. Test connection in staging
4. Deploy to production
5. Remove old database user

### Rotating OAuth Secrets

1. Generate new client secret in provider dashboard (Google/GitHub)
2. Update GOOGLE_CLIENT_SECRET or GITHUB_CLIENT_SECRET
3. Provider usually allows old secret to work during transition
4. Restart application
5. Revoke old secret after verification

## Security Best Practices

### DO ✅
- Generate strong, random secrets
- Use different secrets for each environment
- Rotate secrets regularly (every 90 days recommended)
- Use secret management services in production (AWS Secrets Manager, HashiCorp Vault)
- Limit access to production secrets
- Audit secret access
- Use environment variables, never hardcode

### DON'T ❌
- Commit secrets to Git
- Share secrets in Slack/Email
- Use weak or guessable secrets
- Reuse secrets across environments
- Log secret values
- Expose secrets in error messages
- Store secrets in application code

## Troubleshooting

### Error: "JWT_SECRET is not set in production"
**Cause**: Missing required JWT_SECRET environment variable

**Fix**:
```bash
# Generate secret
openssl rand -base64 32

# Add to .env or environment
JWT_SECRET=your_generated_secret_here
```

### Error: "JWT_SECRET must be at least 32 characters"
**Cause**: Secret too short for production security requirements

**Fix**: Generate a longer secret:
```bash
openssl rand -base64 48
```

### Warning: "Using insecure development fallback"
**Cause**: JWT_SECRET not set in development

**Impact**: Not critical in development, but should still be set

**Fix**: Set JWT_SECRET in `.env` file

### Error: "SENTRY_DSN format is invalid"
**Cause**: Sentry DSN doesn't match expected format

**Fix**: Copy exact DSN from Sentry project settings:
```
https://[key]@sentry.io/[project-id]
```

## Secret Management in CI/CD

### GitHub Actions
Use repository secrets:
```yaml
env:
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Docker
Use environment variables or Docker secrets:
```bash
docker run -e JWT_SECRET=xxx -e DATABASE_URL=xxx app
```

### Kubernetes
Use Kubernetes secrets:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: glasscode-secrets
data:
  jwt-secret: <base64-encoded-value>
```

## Integration with Secrets Managers

### AWS Secrets Manager (Recommended for Production)

Install AWS SDK:
```bash
npm install @aws-sdk/client-secrets-manager
```

Update `src/config/secrets.js` to fetch from AWS:
```javascript
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

async function getSecretFromAWS(secretName) {
  const client = new SecretsManagerClient({ region: 'us-east-1' });
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretName })
  );
  return JSON.parse(response.SecretString);
}
```

### HashiCorp Vault

```bash
npm install node-vault
```

See Vault documentation for integration details.

## Monitoring

### Health Check
Monitor `/health` endpoint for configuration status:
- `secretsConfigured`: Number of secrets set
- `secretsMissing`: Number of required secrets missing
- `warnings`: Number of weak/invalid secrets

### Alerts
Set up alerts for:
- Missing secrets in production
- Weak secrets detected
- Secret rotation due dates
- Failed secret validations

## Support

For secret-related issues:
1. Check this guide
2. Review application startup logs
3. Contact DevOps team for production secrets
4. Never share actual secret values when requesting help
# Secrets Management Guide

## Overview

This guide explains how to securely manage secrets and environment variables in the GlassCode Academy backend application.

## Key Principles

1. **Never commit secrets to Git** - Use `.env` files which are git-ignored
2. **Fail fast in production** - Missing secrets cause immediate startup failure
3. **Warn in development** - Missing secrets show warnings but use fallbacks
4. **Validate secret strength** - Production secrets must meet minimum security requirements

## Required Secrets

### Critical (Required in Production)

#### JWT_SECRET
- **Purpose**: Signs and verifies JWT authentication tokens
- **Requirements**: 
  - Minimum 32 characters in production
  - Minimum 8 characters in development
- **Generate**: `openssl rand -base64 32`
- **Example**: `JWT_SECRET=abc123def456...` (32+ characters)

#### SENTRY_DSN
- **Purpose**: Error tracking and monitoring
- **Requirements**: Valid Sentry DSN URL
- **Format**: `https://xxx@sentry.io/xxx`
- **Get from**: https://sentry.io project settings

### Database Configuration

Choose **one** of these options:

#### Option 1: DATABASE_URL (Recommended)
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/glasscode_db
```

#### Option 2: Discrete Variables
```bash
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=glasscode_db
DB_USER=your_username
DB_PASSWORD=your_secure_password
DB_SSL=false
```

### Optional Secrets

#### Redis Cache
```bash
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=optional_password
CACHE_ENABLED=true
```
- If not configured, caching gracefully falls back (logs warning)

#### OAuth Providers
Only required if `OAUTH_ENABLED=true`:

```bash
OAUTH_ENABLED=true
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
```

#### Email (SMTP)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
```

#### External APIs
```bash
# OpenAI (if AI features enabled)
OPENAI_API_KEY=sk-xxx

# Other API keys as needed
```

## Environment Files

### File Priority (highest to lowest)
1. `.env.[environment].local` - Local overrides (never commit)
2. `.env.[environment]` - Environment-specific (e.g., `.env.production`)
3. `.env.local` - Local overrides for all environments (never commit)
4. `.env` - Default values

### Environment Types

#### Development
```bash
NODE_ENV=development
```
- Allows insecure fallback secrets with warnings
- Shows detailed error messages
- Less strict validation

#### Production
```bash
NODE_ENV=production
```
- Fails immediately if required secrets missing
- Validates secret strength (min 32 chars for JWT)
- No fallback values
- Minimal error exposure

#### Test
```bash
NODE_ENV=test
```
- Uses consistent test secrets for reproducibility
- No external service calls
- In-memory database by default

## Setup Instructions

### 1. Copy Environment Template
```bash
cp .env.example .env
```

### 2. Generate Secure Secrets
```bash
# JWT Secret
openssl rand -base64 32

# Database Password (if not using managed service)
openssl rand -base64 24

# API Keys
# Generate from respective service providers
```

### 3. Fill in `.env` File
Replace all `REPLACE_WITH_XXX` placeholders with actual values.

### 4. Verify Configuration
Run the application - it will validate secrets on startup:

```bash
npm start
```

Expected output:
```
✓ Loaded environment from: .env
🔐 Validating secrets for environment: development
✅ All required secrets validated successfully
```

### 5. Check Health Endpoint
```bash
curl http://localhost:8080/health
```

Response includes configuration status:
```json
{
  "success": true,
  "data": {
    "message": "Server is running",
    "configuration": {
      "secretsConfigured": 8,
      "secretsMissing": 2,
      "warnings": 0
    }
  }
}
```

## Secret Rotation

### Rotating JWT_SECRET

⚠️ **WARNING**: Rotating JWT_SECRET invalidates all existing user sessions!

1. Generate new secret: `openssl rand -base64 32`
2. Update `.env` file with new value
3. Restart application
4. All users must log in again

### Rotating Database Credentials

1. Create new database user with same permissions
2. Update DATABASE_URL or DB_* variables
3. Test connection in staging
4. Deploy to production
5. Remove old database user

### Rotating OAuth Secrets

1. Generate new client secret in provider dashboard (Google/GitHub)
2. Update GOOGLE_CLIENT_SECRET or GITHUB_CLIENT_SECRET
3. Provider usually allows old secret to work during transition
4. Restart application
5. Revoke old secret after verification

## Security Best Practices

### DO ✅
- Generate strong, random secrets
- Use different secrets for each environment
- Rotate secrets regularly (every 90 days recommended)
- Use secret management services in production (AWS Secrets Manager, HashiCorp Vault)
- Limit access to production secrets
- Audit secret access
- Use environment variables, never hardcode

### DON'T ❌
- Commit secrets to Git
- Share secrets in Slack/Email
- Use weak or guessable secrets
- Reuse secrets across environments
- Log secret values
- Expose secrets in error messages
- Store secrets in application code

## Troubleshooting

### Error: "JWT_SECRET is not set in production"
**Cause**: Missing required JWT_SECRET environment variable

**Fix**:
```bash
# Generate secret
openssl rand -base64 32

# Add to .env or environment
JWT_SECRET=your_generated_secret_here
```

### Error: "JWT_SECRET must be at least 32 characters"
**Cause**: Secret too short for production security requirements

**Fix**: Generate a longer secret:
```bash
openssl rand -base64 48
```

### Warning: "Using insecure development fallback"
**Cause**: JWT_SECRET not set in development

**Impact**: Not critical in development, but should still be set

**Fix**: Set JWT_SECRET in `.env` file

### Error: "SENTRY_DSN format is invalid"
**Cause**: Sentry DSN doesn't match expected format

**Fix**: Copy exact DSN from Sentry project settings:
```
https://[key]@sentry.io/[project-id]
```

## Secret Management in CI/CD

### GitHub Actions
Use repository secrets:
```yaml
env:
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Docker
Use environment variables or Docker secrets:
```bash
docker run -e JWT_SECRET=xxx -e DATABASE_URL=xxx app
```

### Kubernetes
Use Kubernetes secrets:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: glasscode-secrets
data:
  jwt-secret: <base64-encoded-value>
```

## Integration with Secrets Managers

### AWS Secrets Manager (Recommended for Production)

Install AWS SDK:
```bash
npm install @aws-sdk/client-secrets-manager
```

Update `src/config/secrets.js` to fetch from AWS:
```javascript
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

async function getSecretFromAWS(secretName) {
  const client = new SecretsManagerClient({ region: 'us-east-1' });
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretName })
  );
  return JSON.parse(response.SecretString);
}
```

### HashiCorp Vault

```bash
npm install node-vault
```

See Vault documentation for integration details.

## Monitoring

### Health Check
Monitor `/health` endpoint for configuration status:
- `secretsConfigured`: Number of secrets set
- `secretsMissing`: Number of required secrets missing
- `warnings`: Number of weak/invalid secrets

### Alerts
Set up alerts for:
- Missing secrets in production
- Weak secrets detected
- Secret rotation due dates
- Failed secret validations

## Support

For secret-related issues:
1. Check this guide
2. Review application startup logs
3. Contact DevOps team for production secrets
4. Never share actual secret values when requesting help
# Secrets Management Guide

## Overview

This guide explains how to securely manage secrets and environment variables in the GlassCode Academy backend application.

## Key Principles

1. **Never commit secrets to Git** - Use `.env` files which are git-ignored
2. **Fail fast in production** - Missing secrets cause immediate startup failure
3. **Warn in development** - Missing secrets show warnings but use fallbacks
4. **Validate secret strength** - Production secrets must meet minimum security requirements

## Required Secrets

### Critical (Required in Production)

#### JWT_SECRET
- **Purpose**: Signs and verifies JWT authentication tokens
- **Requirements**: 
  - Minimum 32 characters in production
  - Minimum 8 characters in development
- **Generate**: `openssl rand -base64 32`
- **Example**: `JWT_SECRET=abc123def456...` (32+ characters)

#### SENTRY_DSN
- **Purpose**: Error tracking and monitoring
- **Requirements**: Valid Sentry DSN URL
- **Format**: `https://xxx@sentry.io/xxx`
- **Get from**: https://sentry.io project settings

### Database Configuration

Choose **one** of these options:

#### Option 1: DATABASE_URL (Recommended)
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/glasscode_db
```

#### Option 2: Discrete Variables
```bash
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=glasscode_db
DB_USER=your_username
DB_PASSWORD=your_secure_password
DB_SSL=false
```

### Optional Secrets

#### Redis Cache
```bash
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=optional_password
CACHE_ENABLED=true
```
- If not configured, caching gracefully falls back (logs warning)

#### OAuth Providers
Only required if `OAUTH_ENABLED=true`:

```bash
OAUTH_ENABLED=true
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
```

#### Email (SMTP)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
```

#### External APIs
```bash
# OpenAI (if AI features enabled)
OPENAI_API_KEY=sk-xxx

# Other API keys as needed
```

## Environment Files

### File Priority (highest to lowest)
1. `.env.[environment].local` - Local overrides (never commit)
2. `.env.[environment]` - Environment-specific (e.g., `.env.production`)
3. `.env.local` - Local overrides for all environments (never commit)
4. `.env` - Default values

### Environment Types

#### Development
```bash
NODE_ENV=development
```
- Allows insecure fallback secrets with warnings
- Shows detailed error messages
- Less strict validation

#### Production
```bash
NODE_ENV=production
```
- Fails immediately if required secrets missing
- Validates secret strength (min 32 chars for JWT)
- No fallback values
- Minimal error exposure

#### Test
```bash
NODE_ENV=test
```
- Uses consistent test secrets for reproducibility
- No external service calls
- In-memory database by default

## Setup Instructions

### 1. Copy Environment Template
```bash
cp .env.example .env
```

### 2. Generate Secure Secrets
```bash
# JWT Secret
openssl rand -base64 32

# Database Password (if not using managed service)
openssl rand -base64 24

# API Keys
# Generate from respective service providers
```

### 3. Fill in `.env` File
Replace all `REPLACE_WITH_XXX` placeholders with actual values.

### 4. Verify Configuration
Run the application - it will validate secrets on startup:

```bash
npm start
```

Expected output:
```
✓ Loaded environment from: .env
🔐 Validating secrets for environment: development
✅ All required secrets validated successfully
```

### 5. Check Health Endpoint
```bash
curl http://localhost:8080/health
```

Response includes configuration status:
```json
{
  "success": true,
  "data": {
    "message": "Server is running",
    "configuration": {
      "secretsConfigured": 8,
      "secretsMissing": 2,
      "warnings": 0
    }
  }
}
```

## Secret Rotation

### Rotating JWT_SECRET

⚠️ **WARNING**: Rotating JWT_SECRET invalidates all existing user sessions!

1. Generate new secret: `openssl rand -base64 32`
2. Update `.env` file with new value
3. Restart application
4. All users must log in again

### Rotating Database Credentials

1. Create new database user with same permissions
2. Update DATABASE_URL or DB_* variables
3. Test connection in staging
4. Deploy to production
5. Remove old database user

### Rotating OAuth Secrets

1. Generate new client secret in provider dashboard (Google/GitHub)
2. Update GOOGLE_CLIENT_SECRET or GITHUB_CLIENT_SECRET
3. Provider usually allows old secret to work during transition
4. Restart application
5. Revoke old secret after verification

## Security Best Practices

### DO ✅
- Generate strong, random secrets
- Use different secrets for each environment
- Rotate secrets regularly (every 90 days recommended)
- Use secret management services in production (AWS Secrets Manager, HashiCorp Vault)
- Limit access to production secrets
- Audit secret access
- Use environment variables, never hardcode

### DON'T ❌
- Commit secrets to Git
- Share secrets in Slack/Email
- Use weak or guessable secrets
- Reuse secrets across environments
- Log secret values
- Expose secrets in error messages
- Store secrets in application code

## Troubleshooting

### Error: "JWT_SECRET is not set in production"
**Cause**: Missing required JWT_SECRET environment variable

**Fix**:
```bash
# Generate secret
openssl rand -base64 32

# Add to .env or environment
JWT_SECRET=your_generated_secret_here
```

### Error: "JWT_SECRET must be at least 32 characters"
**Cause**: Secret too short for production security requirements

**Fix**: Generate a longer secret:
```bash
openssl rand -base64 48
```

### Warning: "Using insecure development fallback"
**Cause**: JWT_SECRET not set in development

**Impact**: Not critical in development, but should still be set

**Fix**: Set JWT_SECRET in `.env` file

### Error: "SENTRY_DSN format is invalid"
**Cause**: Sentry DSN doesn't match expected format

**Fix**: Copy exact DSN from Sentry project settings:
```
https://[key]@sentry.io/[project-id]
```

## Secret Management in CI/CD

### GitHub Actions
Use repository secrets:
```yaml
env:
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Docker
Use environment variables or Docker secrets:
```bash
docker run -e JWT_SECRET=xxx -e DATABASE_URL=xxx app
```

### Kubernetes
Use Kubernetes secrets:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: glasscode-secrets
data:
  jwt-secret: <base64-encoded-value>
```

## Integration with Secrets Managers

### AWS Secrets Manager (Recommended for Production)

Install AWS SDK:
```bash
npm install @aws-sdk/client-secrets-manager
```

Update `src/config/secrets.js` to fetch from AWS:
```javascript
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

async function getSecretFromAWS(secretName) {
  const client = new SecretsManagerClient({ region: 'us-east-1' });
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretName })
  );
  return JSON.parse(response.SecretString);
}
```

### HashiCorp Vault

```bash
npm install node-vault
```

See Vault documentation for integration details.

## Monitoring

### Health Check
Monitor `/health` endpoint for configuration status:
- `secretsConfigured`: Number of secrets set
- `secretsMissing`: Number of required secrets missing
- `warnings`: Number of weak/invalid secrets

### Alerts
Set up alerts for:
- Missing secrets in production
- Weak secrets detected
- Secret rotation due dates
- Failed secret validations

## Support

For secret-related issues:
1. Check this guide
2. Review application startup logs
3. Contact DevOps team for production secrets
4. Never share actual secret values when requesting help
# Secrets Management Guide

## Overview

This guide explains how to securely manage secrets and environment variables in the GlassCode Academy backend application.

## Key Principles

1. **Never commit secrets to Git** - Use `.env` files which are git-ignored
2. **Fail fast in production** - Missing secrets cause immediate startup failure
3. **Warn in development** - Missing secrets show warnings but use fallbacks
4. **Validate secret strength** - Production secrets must meet minimum security requirements

## Required Secrets

### Critical (Required in Production)

#### JWT_SECRET
- **Purpose**: Signs and verifies JWT authentication tokens
- **Requirements**: 
  - Minimum 32 characters in production
  - Minimum 8 characters in development
- **Generate**: `openssl rand -base64 32`
- **Example**: `JWT_SECRET=abc123def456...` (32+ characters)

#### SENTRY_DSN
- **Purpose**: Error tracking and monitoring
- **Requirements**: Valid Sentry DSN URL
- **Format**: `https://xxx@sentry.io/xxx`
- **Get from**: https://sentry.io project settings

### Database Configuration

Choose **one** of these options:

#### Option 1: DATABASE_URL (Recommended)
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/glasscode_db
```

#### Option 2: Discrete Variables
```bash
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=glasscode_db
DB_USER=your_username
DB_PASSWORD=your_secure_password
DB_SSL=false
```

### Optional Secrets

#### Redis Cache
```bash
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=optional_password
CACHE_ENABLED=true
```
- If not configured, caching gracefully falls back (logs warning)

#### OAuth Providers
Only required if `OAUTH_ENABLED=true`:

```bash
OAUTH_ENABLED=true
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
```

#### Email (SMTP)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
```

#### External APIs
```bash
# OpenAI (if AI features enabled)
OPENAI_API_KEY=sk-xxx

# Other API keys as needed
```

## Environment Files

### File Priority (highest to lowest)
1. `.env.[environment].local` - Local overrides (never commit)
2. `.env.[environment]` - Environment-specific (e.g., `.env.production`)
3. `.env.local` - Local overrides for all environments (never commit)
4. `.env` - Default values

### Environment Types

#### Development
```bash
NODE_ENV=development
```
- Allows insecure fallback secrets with warnings
- Shows detailed error messages
- Less strict validation

#### Production
```bash
NODE_ENV=production
```
- Fails immediately if required secrets missing
- Validates secret strength (min 32 chars for JWT)
- No fallback values
- Minimal error exposure

#### Test
```bash
NODE_ENV=test
```
- Uses consistent test secrets for reproducibility
- No external service calls
- In-memory database by default

## Setup Instructions

### 1. Copy Environment Template
```bash
cp .env.example .env
```

### 2. Generate Secure Secrets
```bash
# JWT Secret
openssl rand -base64 32

# Database Password (if not using managed service)
openssl rand -base64 24

# API Keys
# Generate from respective service providers
```

### 3. Fill in `.env` File
Replace all `REPLACE_WITH_XXX` placeholders with actual values.

### 4. Verify Configuration
Run the application - it will validate secrets on startup:

```bash
npm start
```

Expected output:
```
✓ Loaded environment from: .env
🔐 Validating secrets for environment: development
✅ All required secrets validated successfully
```

### 5. Check Health Endpoint
```bash
curl http://localhost:8080/health
```

Response includes configuration status:
```json
{
  "success": true,
  "data": {
    "message": "Server is running",
    "configuration": {
      "secretsConfigured": 8,
      "secretsMissing": 2,
      "warnings": 0
    }
  }
}
```

## Secret Rotation

### Rotating JWT_SECRET

⚠️ **WARNING**: Rotating JWT_SECRET invalidates all existing user sessions!

1. Generate new secret: `openssl rand -base64 32`
2. Update `.env` file with new value
3. Restart application
4. All users must log in again

### Rotating Database Credentials

1. Create new database user with same permissions
2. Update DATABASE_URL or DB_* variables
3. Test connection in staging
4. Deploy to production
5. Remove old database user

### Rotating OAuth Secrets

1. Generate new client secret in provider dashboard (Google/GitHub)
2. Update GOOGLE_CLIENT_SECRET or GITHUB_CLIENT_SECRET
3. Provider usually allows old secret to work during transition
4. Restart application
5. Revoke old secret after verification

## Security Best Practices

### DO ✅
- Generate strong, random secrets
- Use different secrets for each environment
- Rotate secrets regularly (every 90 days recommended)
- Use secret management services in production (AWS Secrets Manager, HashiCorp Vault)
- Limit access to production secrets
- Audit secret access
- Use environment variables, never hardcode

### DON'T ❌
- Commit secrets to Git
- Share secrets in Slack/Email
- Use weak or guessable secrets
- Reuse secrets across environments
- Log secret values
- Expose secrets in error messages
- Store secrets in application code

## Troubleshooting

### Error: "JWT_SECRET is not set in production"
**Cause**: Missing required JWT_SECRET environment variable

**Fix**:
```bash
# Generate secret
openssl rand -base64 32

# Add to .env or environment
JWT_SECRET=your_generated_secret_here
```

### Error: "JWT_SECRET must be at least 32 characters"
**Cause**: Secret too short for production security requirements

**Fix**: Generate a longer secret:
```bash
openssl rand -base64 48
```

### Warning: "Using insecure development fallback"
**Cause**: JWT_SECRET not set in development

**Impact**: Not critical in development, but should still be set

**Fix**: Set JWT_SECRET in `.env` file

### Error: "SENTRY_DSN format is invalid"
**Cause**: Sentry DSN doesn't match expected format

**Fix**: Copy exact DSN from Sentry project settings:
```
https://[key]@sentry.io/[project-id]
```

## Secret Management in CI/CD

### GitHub Actions
Use repository secrets:
```yaml
env:
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Docker
Use environment variables or Docker secrets:
```bash
docker run -e JWT_SECRET=xxx -e DATABASE_URL=xxx app
```

### Kubernetes
Use Kubernetes secrets:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: glasscode-secrets
data:
  jwt-secret: <base64-encoded-value>
```

## Integration with Secrets Managers

### AWS Secrets Manager (Recommended for Production)

Install AWS SDK:
```bash
npm install @aws-sdk/client-secrets-manager
```

Update `src/config/secrets.js` to fetch from AWS:
```javascript
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

async function getSecretFromAWS(secretName) {
  const client = new SecretsManagerClient({ region: 'us-east-1' });
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretName })
  );
  return JSON.parse(response.SecretString);
}
```

### HashiCorp Vault

```bash
npm install node-vault
```

See Vault documentation for integration details.

## Monitoring

### Health Check
Monitor `/health` endpoint for configuration status:
- `secretsConfigured`: Number of secrets set
- `secretsMissing`: Number of required secrets missing
- `warnings`: Number of weak/invalid secrets

### Alerts
Set up alerts for:
- Missing secrets in production
- Weak secrets detected
- Secret rotation due dates
- Failed secret validations

## Support

For secret-related issues:
1. Check this guide
2. Review application startup logs
3. Contact DevOps team for production secrets
4. Never share actual secret values when requesting help
# Secrets Management Guide

## Overview

This guide explains how to securely manage secrets and environment variables in the GlassCode Academy backend application.

## Key Principles

1. **Never commit secrets to Git** - Use `.env` files which are git-ignored
2. **Fail fast in production** - Missing secrets cause immediate startup failure
3. **Warn in development** - Missing secrets show warnings but use fallbacks
4. **Validate secret strength** - Production secrets must meet minimum security requirements

## Required Secrets

### Critical (Required in Production)

#### JWT_SECRET
- **Purpose**: Signs and verifies JWT authentication tokens
- **Requirements**: 
  - Minimum 32 characters in production
  - Minimum 8 characters in development
- **Generate**: `openssl rand -base64 32`
- **Example**: `JWT_SECRET=abc123def456...` (32+ characters)

#### SENTRY_DSN
- **Purpose**: Error tracking and monitoring
- **Requirements**: Valid Sentry DSN URL
- **Format**: `https://xxx@sentry.io/xxx`
- **Get from**: https://sentry.io project settings

### Database Configuration

Choose **one** of these options:

#### Option 1: DATABASE_URL (Recommended)
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/glasscode_db
```

#### Option 2: Discrete Variables
```bash
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=glasscode_db
DB_USER=your_username
DB_PASSWORD=your_secure_password
DB_SSL=false
```

### Optional Secrets

#### Redis Cache
```bash
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=optional_password
CACHE_ENABLED=true
```
- If not configured, caching gracefully falls back (logs warning)

#### OAuth Providers
Only required if `OAUTH_ENABLED=true`:

```bash
OAUTH_ENABLED=true
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
```

#### Email (SMTP)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
```

#### External APIs
```bash
# OpenAI (if AI features enabled)
OPENAI_API_KEY=sk-xxx

# Other API keys as needed
```

## Environment Files

### File Priority (highest to lowest)
1. `.env.[environment].local` - Local overrides (never commit)
2. `.env.[environment]` - Environment-specific (e.g., `.env.production`)
3. `.env.local` - Local overrides for all environments (never commit)
4. `.env` - Default values

### Environment Types

#### Development
```bash
NODE_ENV=development
```
- Allows insecure fallback secrets with warnings
- Shows detailed error messages
- Less strict validation

#### Production
```bash
NODE_ENV=production
```
- Fails immediately if required secrets missing
- Validates secret strength (min 32 chars for JWT)
- No fallback values
- Minimal error exposure

#### Test
```bash
NODE_ENV=test
```
- Uses consistent test secrets for reproducibility
- No external service calls
- In-memory database by default

## Setup Instructions

### 1. Copy Environment Template
```bash
cp .env.example .env
```

### 2. Generate Secure Secrets
```bash
# JWT Secret
openssl rand -base64 32

# Database Password (if not using managed service)
openssl rand -base64 24

# API Keys
# Generate from respective service providers
```

### 3. Fill in `.env` File
Replace all `REPLACE_WITH_XXX` placeholders with actual values.

### 4. Verify Configuration
Run the application - it will validate secrets on startup:

```bash
npm start
```

Expected output:
```
✓ Loaded environment from: .env
🔐 Validating secrets for environment: development
✅ All required secrets validated successfully
```

### 5. Check Health Endpoint
```bash
curl http://localhost:8080/health
```

Response includes configuration status:
```json
{
  "success": true,
  "data": {
    "message": "Server is running",
    "configuration": {
      "secretsConfigured": 8,
      "secretsMissing": 2,
      "warnings": 0
    }
  }
}
```

## Secret Rotation

### Rotating JWT_SECRET

⚠️ **WARNING**: Rotating JWT_SECRET invalidates all existing user sessions!

1. Generate new secret: `openssl rand -base64 32`
2. Update `.env` file with new value
3. Restart application
4. All users must log in again

### Rotating Database Credentials

1. Create new database user with same permissions
2. Update DATABASE_URL or DB_* variables
3. Test connection in staging
4. Deploy to production
5. Remove old database user

### Rotating OAuth Secrets

1. Generate new client secret in provider dashboard (Google/GitHub)
2. Update GOOGLE_CLIENT_SECRET or GITHUB_CLIENT_SECRET
3. Provider usually allows old secret to work during transition
4. Restart application
5. Revoke old secret after verification

## Security Best Practices

### DO ✅
- Generate strong, random secrets
- Use different secrets for each environment
- Rotate secrets regularly (every 90 days recommended)
- Use secret management services in production (AWS Secrets Manager, HashiCorp Vault)
- Limit access to production secrets
- Audit secret access
- Use environment variables, never hardcode

### DON'T ❌
- Commit secrets to Git
- Share secrets in Slack/Email
- Use weak or guessable secrets
- Reuse secrets across environments
- Log secret values
- Expose secrets in error messages
- Store secrets in application code

## Troubleshooting

### Error: "JWT_SECRET is not set in production"
**Cause**: Missing required JWT_SECRET environment variable

**Fix**:
```bash
# Generate secret
openssl rand -base64 32

# Add to .env or environment
JWT_SECRET=your_generated_secret_here
```

### Error: "JWT_SECRET must be at least 32 characters"
**Cause**: Secret too short for production security requirements

**Fix**: Generate a longer secret:
```bash
openssl rand -base64 48
```

### Warning: "Using insecure development fallback"
**Cause**: JWT_SECRET not set in development

**Impact**: Not critical in development, but should still be set

**Fix**: Set JWT_SECRET in `.env` file

### Error: "SENTRY_DSN format is invalid"
**Cause**: Sentry DSN doesn't match expected format

**Fix**: Copy exact DSN from Sentry project settings:
```
https://[key]@sentry.io/[project-id]
```

## Secret Management in CI/CD

### GitHub Actions
Use repository secrets:
```yaml
env:
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Docker
Use environment variables or Docker secrets:
```bash
docker run -e JWT_SECRET=xxx -e DATABASE_URL=xxx app
```

### Kubernetes
Use Kubernetes secrets:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: glasscode-secrets
data:
  jwt-secret: <base64-encoded-value>
```

## Integration with Secrets Managers

### AWS Secrets Manager (Recommended for Production)

Install AWS SDK:
```bash
npm install @aws-sdk/client-secrets-manager
```

Update `src/config/secrets.js` to fetch from AWS:
```javascript
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

async function getSecretFromAWS(secretName) {
  const client = new SecretsManagerClient({ region: 'us-east-1' });
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretName })
  );
  return JSON.parse(response.SecretString);
}
```

### HashiCorp Vault

```bash
npm install node-vault
```

See Vault documentation for integration details.

## Monitoring

### Health Check
Monitor `/health` endpoint for configuration status:
- `secretsConfigured`: Number of secrets set
- `secretsMissing`: Number of required secrets missing
- `warnings`: Number of weak/invalid secrets

### Alerts
Set up alerts for:
- Missing secrets in production
- Weak secrets detected
- Secret rotation due dates
- Failed secret validations

## Support

For secret-related issues:
1. Check this guide
2. Review application startup logs
3. Contact DevOps team for production secrets
4. Never share actual secret values when requesting help
