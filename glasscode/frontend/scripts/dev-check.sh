#!/usr/bin/env bash
set -euo pipefail

echo "🔎 Frontend Dev Environment Check"

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

ENV_FILE="$ROOT_DIR/.env.local"
if [ -f "$ENV_FILE" ]; then
  echo "📄 Loading .env.local"
  # shellcheck disable=SC2046
  export $(grep -v '^#' "$ENV_FILE" | xargs -I{} echo {})
else
  echo "⚠️  No .env.local found, using process env"
fi

BASE_URL=${NEXT_PUBLIC_BASE_URL:-"http://localhost:3000"}
API_BASE=${NEXT_PUBLIC_API_BASE:-"http://127.0.0.1:8080"}
GRAPHQL_ENDPOINT=${NEXT_PUBLIC_GRAPHQL_ENDPOINT:-"/api/graphql"}
DEBUG=${NEXT_PUBLIC_DEBUG:-"false"}

echo "➡️  NEXT_PUBLIC_BASE_URL:      $BASE_URL"
echo "➡️  NEXT_PUBLIC_API_BASE:      $API_BASE"
echo "➡️  NEXT_PUBLIC_GRAPHQL_ENDPOINT: $GRAPHQL_ENDPOINT"
echo "➡️  NEXT_PUBLIC_DEBUG:         $DEBUG"

echo "🌐 Checking endpoints..."
HEALTH_URL="$BASE_URL/health"
REGISTRY_URL="$BASE_URL/api/content/registry"

check() {
  local url=$1
  local name=$2
  local start ts status
  start=$(date +%s%3N)
  if ts=$(curl -s -o /dev/null -w "%{http_code}" "$url"); then
    status=$ts
  else
    status="ERR"
  fi
  local end=$(date +%s%3N)
  local latency=$((end - start))
  echo "  • $name: $url -> $status (${latency}ms)"
}

check "$HEALTH_URL" "Health"
check "$REGISTRY_URL" "Registry"

echo "✅ Dev check complete"