# Path Resolution Strategy

## Overview

The `DataService` class implements a robust path resolution strategy that ensures content paths resolve consistently to `[app root]/content` regardless of where the backend is executed from.

## Problem Solved

Previously, the backend would fail to find content when run from different directories:
- ✅ **Development mode** (`dotnet run`): Worked correctly
- ❌ **Published builds** (`dotnet backend.dll` from publish directory): Failed with `/Users/content` path

## Solution Implementation

### 1. Multi-Strategy App Root Detection

The `FindAppRootRobust()` method uses three detection strategies in order:

#### Strategy 1: Search from BaseDirectory
- Starts from `AppDomain.CurrentDomain.BaseDirectory`
- Searches upward through parent directories
- Looks for key indicators: `global.json`, `README.md`, `bootstrap.sh`, `.gitignore`
- Validates glasscode structure: `glasscode/` and `content/` directories

#### Strategy 2: Search from Current Working Directory
- Uses `Directory.GetCurrentDirectory()`
- Same upward search pattern as Strategy 1
- Fallback when BaseDirectory search fails

#### Strategy 3: Search from Assembly Location
- Uses `Assembly.GetExecutingAssembly().Location`
- Final fallback for edge cases
- Ensures detection even in complex deployment scenarios

### 2. Comprehensive Fallback Paths

The `GetFallbackContentPaths()` method provides multiple fallback options:

#### Development Paths
- `/Users/veland/GlassCodeAcademy/content` (local development)
- `~/GlassCodeAcademy/content` (user profile relative)

#### Deployment Paths
- `/academy/content` (production deployment)
- `/app/content` (containerized deployment)
- `/var/www/glasscode/content` (web server deployment)

#### Dynamic Publish Directory Navigation
- Automatically navigates up from publish directories
- Handles nested publish structures (`../../../content`, `../../../../content`)
- Searches parent directories systematically

### 3. Environment Variable Support

Priority order for path resolution:
1. `GLASSCODE_CONTENT_PATH` - Direct content path override
2. `GLASSCODE_APP_ROOT` - App root with `/content` appended
3. Robust app root detection + `/content`
4. Fallback paths

## Testing Results

### Development Mode (`dotnet run`)
```
🔍 Starting path resolution from BaseDirectory: /Users/veland/GlassCodeAcademy/glasscode/backend/
🔍 Found app root via BaseDirectory search: /Users/veland/GlassCodeAcademy
🔍 Content path resolved to: /Users/veland/GlassCodeAcademy/content
✅ All content loaded successfully
```

### Published Build (`dotnet backend.dll`)
```
🔍 Starting path resolution from BaseDirectory: /Users/veland/GlassCodeAcademy/glasscode/backend/publish/
🔍 Found app root via BaseDirectory search: /Users/veland/GlassCodeAcademy
🔍 Content path resolved to: /Users/veland/GlassCodeAcademy/content
✅ All content loaded successfully
```

## Key Benefits

1. **Consistent Behavior**: Same content path regardless of execution context
2. **No .NET Limitations**: Uses standard .NET APIs effectively
3. **Deployment Flexibility**: Works in development, published, and containerized environments
4. **Graceful Degradation**: Multiple fallback strategies ensure reliability
5. **Environment Configurability**: Override paths via environment variables when needed

## Usage

The path resolution is automatic and requires no configuration for standard deployments. For custom deployments, set environment variables:

```bash
# Direct content path override
export GLASSCODE_CONTENT_PATH="/custom/path/to/content"

# App root override (content will be appended)
export GLASSCODE_APP_ROOT="/custom/app/root"
```

## Implementation Details

- **File**: `Services/DataService.cs`
- **Methods**: `GetContentPath()`, `FindAppRootRobust()`, `GetFallbackContentPaths()`
- **Dependencies**: Standard .NET System.IO APIs
- **Logging**: Comprehensive debug output for troubleshooting