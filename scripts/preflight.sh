#!/usr/bin/env bash
set -euo pipefail

# Full pre-flight checks before pushing
# - Fast failures, clear output, and GitKraken-compatible

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

section "Environment checks"
command -v node >/dev/null 2>&1 || fail "Node.js not found in PATH"
command -v npm >/dev/null 2>&1 || fail "npm not found in PATH"
ok "Node: $(node -v), npm: $(npm -v)"

section "Content validation"
if [ -f "scripts/validate-content.js" ]; then
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
echo "Running: npm run lint"
npm run lint || fail "ESLint checks failed"
ok "Lint passed"

section "TypeScript typecheck"
echo "Running: npm run typecheck"
npm run typecheck || fail "Typecheck failed"
ok "Typecheck passed"

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