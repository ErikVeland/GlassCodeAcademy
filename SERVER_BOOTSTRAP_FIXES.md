# Server Bootstrap Issue Resolution

This document describes the fixes implemented to resolve the server bootstrap issue where the `glasscode-backend.service` was failing to start on the remote production server.

## Problem Summary

The bootstrap script was failing to start the backend service with an "activating (auto-restart) (Result: resources)" error. Journal logs showed no entries, indicating the service was failing before it could even begin logging.

## Root Causes Identified

1. **Port Configuration Mismatch**: 
   - The apps/api/.env.production file specified PORT=8081
   - The bootstrap script and systemd service expected the service to run on port 8080
   - This caused the service to bind to a different port than expected

2. **Database Configuration Inconsistency**:
   - Different database connection strings in multiple environment files
   - Credentials mismatch between configuration files

3. **Service File Path Issues**:
   - The ExecStart path in the systemd service file was unnecessarily verbose
   - Working directory was not explicitly set in the service file

## Fixes Implemented

### 1. Configuration Alignment
- Updated apps/api/.env.production to use PORT=8080 for consistency
- Standardized database connection strings across environment files
- Updated NEXT_PUBLIC_API_BASE to use the correct subdomain (api.glasscode.academy)

### 2. Bootstrap Script Enhancements
- Added pre-flight validation to check for required files before service creation
- Added port availability checks to ensure the backend port is free before starting
- Enhanced error reporting with detailed diagnostic information
- Added manual startup testing for debugging purposes

### 3. Service File Improvements
- Simplified the ExecStart path to use relative path (server.js instead of full path)
- Ensured WorkingDirectory is correctly set
- Added validation checks for service file configuration

### 4. Diagnostic and Recovery Tools
Created two new scripts to help troubleshoot and recover from service startup issues:

1. **diagnose-backend-service.sh**: A comprehensive diagnostic tool that checks:
   - Required file existence
   - Environment variable settings
   - Port availability
   - Manual startup testing
   - Systemd service status and logs
   - Service file validation

2. **recover-backend-service.sh**: A recovery tool that:
   - Stops any running services
   - Cleans up port usage
   - Validates environment files
   - Recreates the systemd service file with corrected configuration
   - Reloads systemd and restarts the service

## Usage

### Running the Diagnostic Tool
```bash
cd /path/to/GlassCodeAcademy
./scripts/diagnose-backend-service.sh
```

### Running the Recovery Tool
```bash
cd /path/to/GlassCodeAcademy
sudo ./scripts/recover-backend-service.sh
```

## Validation

After implementing these fixes, the bootstrap script should complete successfully with:
- Backend service starting and remaining active
- Proper port binding on 8080
- Consistent environment variable configuration
- Improved error reporting and diagnostics

## Monitoring

The enhanced error reporting will provide better visibility into service startup issues, including:
- Detailed systemd status information
- Journal logs for troubleshooting
- Manual startup testing for debugging
- Port conflict resolution