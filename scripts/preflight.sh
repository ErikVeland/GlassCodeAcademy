#!/usr/bin/env bash
set -euo pipefail

# Full pre-flight checks before pushing
# - Fast failures, clear output, and GitKraken-compatible
#
# SMART VALIDATION APPROACH:
# - Performs quick validation checks first (linting, type checking, compilation)
# - Only runs expensive operations (full builds, publishes) when errors are detected
# - This significantly reduces preflight time during normal development

RED="\033[0;31m"; GREEN="\033[0;32m"; YELLOW="\033[1;33m"; NC="\033[0m"

section() {
  echo -e "\n${YELLOW}==> $1${NC}"
}

fail() {
  echo -e "${RED}❌ $1${NC}" >&2
  exit 1
}

ok() {
  echo -e "${GREEN}✅ $1${NC}"
}

# Move to repo root to ensure consistent paths
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT" || fail "Failed to locate repository root"

# Deployment strategy flags (align with update.sh)
FAST_MODE="${FAST_MODE:-0}"
SKIP_CONTENT_VALIDATION="${SKIP_CONTENT_VALIDATION:-0}"
SKIP_LINT="${SKIP_LINT:-0}"
SKIP_TYPECHECK="${SKIP_TYPECHECK:-0}"
FRONTEND_ONLY="${FRONTEND_ONLY:-0}"

section "Environment checks"
command -v node >/dev/null 2>&1 || fail "Node.js not found in PATH"
command -v npm >/dev/null 2>&1 || fail "npm not found in PATH"
ok "Node: $(node -v), npm: $(npm -v)"

section "Content validation"
if [ "$SKIP_CONTENT_VALIDATION" = "1" ] || [ "$FAST_MODE" = "1" ]; then
  echo "Skipping content validation due to fast/skip mode"
elif [ -f "scripts/validate-content.js" ]; then
  echo "Running: CI=1 node scripts/validate-content.js"
  CI=1 node scripts/validate-content.js || fail "Content validation failed"
  ok "Content valid"
else
  echo "No scripts/validate-content.js; skipping"
fi

section "Route validation"
if command -v jq >/dev/null 2>&1; then
  if [ -f "scripts/validate-routes.sh" ]; then
    echo "Running: bash scripts/validate-routes.sh"
    bash scripts/validate-routes.sh || fail "Route validation failed"
    ok "Routes valid"
  else
    echo "No scripts/validate-routes.sh; skipping"
  fi
else
  echo "jq not found; skipping route validation"
fi

section "Optional link checks"
if [ "${PRECHECK_LINKS:-0}" = "1" ]; then
  if [ -f "scripts/link-checker.js" ]; then
    echo "Running: node scripts/link-checker.js (this may take time)"
    node scripts/link-checker.js || fail "Link check failed"
    ok "Links look good"
  else
    echo "No scripts/link-checker.js; skipping"
  fi
else
  echo "Set PRECHECK_LINKS=1 to enable link checks"
fi

section "Frontend lint"
if [ "$SKIP_LINT" = "1" ] || [ "$FAST_MODE" = "1" ]; then
  echo "Skipping ESLint due to fast/skip mode"
else
  echo "Running: npm run lint"
  npm run lint || fail "ESLint checks failed"
  ok "Lint passed"
fi

section "TypeScript typecheck"
if [ "$SKIP_TYPECHECK" = "1" ] || [ "$FAST_MODE" = "1" ]; then
  echo "Skipping TypeScript checks due to fast/skip mode"
else
  # Check if we're in the frontend directory, if not, navigate to it
  if [ -d "glasscode/frontend" ]; then
    echo "Running TypeScript checks in glasscode/frontend..."
    cd glasscode/frontend || fail "Failed to navigate to frontend directory"
    
    # Run TypeScript compiler check
    echo "Running: npx tsc --noEmit"
    npx tsc --noEmit || fail "TypeScript compilation failed"
    
    # Run the npm typecheck script as well
    echo "Running: npm run typecheck"
    npm run typecheck || fail "npm typecheck failed"
    
    # Navigate back to repo root
    cd "$REPO_ROOT" || fail "Failed to return to repository root"
    ok "TypeScript checks passed"
  else
    echo "Frontend directory not found, running typecheck from current location"
    npm run typecheck || fail "Typecheck failed"
    ok "Typecheck passed"
  fi
fi

section "Next.js build validation"
# Smart build validation: only do expensive operations when needed
if [ -d "glasscode/frontend" ]; then
  echo "Running smart Next.js build validation in glasscode/frontend..."
  cd glasscode/frontend || fail "Failed to navigate to frontend directory"
  
  # First, try a quick validation if build artifacts exist
  BUILD_EXISTS=false
  if [ -d ".next" ] && [ -f ".next/standalone/server.js" ] && [ -d ".next/standalone/.next" ]; then
    echo "Existing build artifacts found, performing quick validation..."
    
    # Quick syntax check without full build
    if [ "$SKIP_LINT" = "1" ] || [ "$FAST_MODE" = "1" ]; then
      echo "Skipping Next.js lint during fast/skip mode"
    else
      echo "Running: npx next lint --max-warnings 0 --quiet"
      if npx next lint --max-warnings 0 --quiet >/dev/null 2>&1; then
        echo "Running: npx tsc --noEmit --skipLibCheck"
        if npx tsc --noEmit --skipLibCheck >/dev/null 2>&1; then
          BUILD_EXISTS=true
          ok "Quick validation passed - existing build is valid"
        else
          echo "TypeScript errors detected, full rebuild required"
        fi
      else
        echo "Lint errors detected, full rebuild required"
      fi
    fi
  else
    echo "No valid build artifacts found, full build required"
  fi
  
  # Only do expensive operations if quick validation failed
  if [ "$BUILD_EXISTS" = "false" ]; then
    if [ "$FAST_MODE" = "1" ]; then
      echo "FAST_MODE: skipping full build; rely on later CI or production build"
    else
      echo "Performing full clean and rebuild..."
      
      # Clear build cache only when rebuilding
      if [ -d ".next" ]; then
        rm -rf .next || fail "Failed to clear Next.js build cache"
      fi
      
      # Run full build
      echo "Running: npm run build"
      npm run build || fail "Next.js build failed - this would fail in production"
      
      # Validate standalone build output for production deployment
      echo "Validating standalone build output..."
      if [ ! -f ".next/standalone/server.js" ]; then
        fail "Standalone server.js missing at .next/standalone/server.js - production deployment will fail"
      fi
      if [ ! -d ".next/standalone/.next" ]; then
        fail "Standalone .next directory missing - production deployment will fail"
      fi
      ok "Full build validation completed successfully"
    fi
  fi
  
  # Navigate back to repo root
  cd "$REPO_ROOT" || fail "Failed to return to repository root"
  ok "Next.js build validation passed"
else
  echo "Frontend directory not found, skipping Next.js build validation"
fi

section ".NET backend build validation"
# Smart .NET validation: only do expensive operations when needed
if [ "$FRONTEND_ONLY" = "1" ]; then
  echo "Skipping .NET backend checks due to frontend-only mode"
elif [ -d "glasscode/backend" ]; then
  echo "Running smart .NET backend build validation in glasscode/backend..."
  cd glasscode/backend || fail "Failed to navigate to backend directory"
  
  # Check if .NET SDK is available
  if ! command -v dotnet >/dev/null 2>&1; then
    fail ".NET SDK not found - required for backend build. Install .NET 8.0 SDK"
  fi
  
  # Check .NET version compatibility
  echo "Checking .NET SDK version..."
  DOTNET_VERSION=$(dotnet --version 2>/dev/null | head -n1)
  echo "Found .NET SDK version: $DOTNET_VERSION"
  
  # Validate project file exists
  if [ ! -f "backend.csproj" ]; then
    fail "backend.csproj not found - backend project file missing"
  fi
  
  # Quick validation: check if project compiles without full build
  BUILD_REQUIRED=false
  echo "Performing quick compilation check..."
  if ! dotnet build --verbosity quiet --nologo >/dev/null 2>&1; then
    echo "Compilation errors detected, full build required"
    BUILD_REQUIRED=true
  else
    ok "Quick compilation check passed"
  fi
  
  # Only do expensive operations if quick validation failed
  if [ "$BUILD_REQUIRED" = "true" ]; then
    echo "Performing full .NET build and publish validation..."
    
    # Clean any previous build artifacts
    echo "Cleaning previous build artifacts..."
    rm -rf bin obj out 2>/dev/null || true
    
    # Restore dependencies
    echo "Running: dotnet restore"
    if ! dotnet restore; then
      fail ".NET dependency restoration failed - this would fail in production"
    fi
    ok ".NET dependencies restored successfully"
    
    # Build the project
    echo "Running: dotnet build -c Release"
    if ! dotnet build -c Release; then
      fail ".NET build failed - this would fail in production"
    fi
    ok ".NET build completed successfully"
    
    # Test publish (same as production deployment)
    echo "Running: dotnet publish -c Release -o ./out"
    if ! dotnet publish -c Release -o ./out; then
      fail ".NET publish failed - this would fail in production deployment"
    fi
    
    # Validate publish output
    echo "Validating publish output..."
    if [ ! -f "./out/backend.dll" ]; then
      fail "Published backend.dll missing at ./out/backend.dll - production deployment will fail"
    fi
    if [ ! -f "./out/backend.runtimeconfig.json" ]; then
      fail "Runtime config missing - production deployment may fail"
    fi
    ok "Backend publish output validated"
    
    # Clean up test artifacts
    echo "Cleaning up test build artifacts..."
    rm -rf bin obj out 2>/dev/null || true
  fi
  
  # Navigate back to repo root
  cd "$REPO_ROOT" || fail "Failed to return to repository root"
  ok ".NET backend build validation passed"
else
  echo "Backend directory not found, skipping .NET backend build validation"
fi

section "API route validation"
if [ -f "scripts/validate-api-routes.js" ]; then
  echo "Running: node scripts/validate-api-routes.js"
  node scripts/validate-api-routes.js || fail "API route validation failed"
  ok "API routes valid"
else
  echo "No scripts/validate-api-routes.js; skipping API route validation"
fi

# Attempt to source environment files if required vars are missing
load_env_if_missing() {
  if [ -z "${GRAPHQL_ENDPOINT:-}" ] && [ -z "${NEXT_PUBLIC_BASE_URL:-}" ] && [ -z "${NEXT_PUBLIC_API_BASE:-}" ]; then
    for f in glasscode/frontend/.env.local glasscode/frontend/.env.production glasscode/frontend/.env.hosted; do
      if [ -f "$f" ]; then
        echo "Sourcing env from $f"
        set -a; . "$f"; set +a
        # Normalize trailing slashes
        NEXT_PUBLIC_BASE_URL="${NEXT_PUBLIC_BASE_URL%%/}"
        NEXT_PUBLIC_API_BASE="${NEXT_PUBLIC_API_BASE%%/}"
        if [ -n "${GRAPHQL_ENDPOINT:-}" ] || [ -n "${NEXT_PUBLIC_BASE_URL:-}" ] || [ -n "${NEXT_PUBLIC_API_BASE:-}" ]; then
          break
        fi
      fi
    done
  fi
}

load_env_if_missing

section "GraphQL endpoint validation"
# Validate that server-side GraphQL endpoint will be absolute to avoid ERR_INVALID_URL
GRAPHQL_ENDPOINT="${GRAPHQL_ENDPOINT:-}"
NEXT_PUBLIC_BASE_URL_TRIMMED="${NEXT_PUBLIC_BASE_URL:-}"
NEXT_PUBLIC_API_BASE_TRIMMED="${NEXT_PUBLIC_API_BASE:-}"
if [ -n "$GRAPHQL_ENDPOINT" ]; then
  echo "GRAPHQL_ENDPOINT explicitly set: $GRAPHQL_ENDPOINT"
  if ! node -e "new URL(process.env.GRAPHQL_ENDPOINT)" >/dev/null 2>&1; then
    fail "GRAPHQL_ENDPOINT is not a valid absolute URL"
  fi
  ok "GraphQL endpoint is valid"
else
  if [ -z "$NEXT_PUBLIC_BASE_URL_TRIMMED" ] && [ -z "$NEXT_PUBLIC_API_BASE_TRIMMED" ]; then
    fail "GraphQL endpoint would resolve to '/graphql' on server and fail. Set NEXT_PUBLIC_BASE_URL or NEXT_PUBLIC_API_BASE (or GRAPHQL_ENDPOINT)."
  fi
  echo "Derived endpoint will use NEXT_PUBLIC_BASE_URL or NEXT_PUBLIC_API_BASE"
  ok "GraphQL endpoint derivation is configured"
fi

section "Summary"
ok "All pre-flight checks passed"
exit 0