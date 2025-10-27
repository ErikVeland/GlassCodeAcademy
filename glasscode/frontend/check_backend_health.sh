#!/usr/bin/env bash
# Backend health check script for systemd service gating
# Always prefer local backend health to avoid blocking on external 5xxs.

API_PORT="${API_PORT:-8080}"
LOCAL_BASE="http://127.0.0.1:${API_PORT}"
PRIMARY_URL="${LOCAL_BASE%/}/health"

# Optionally sample the public API health for visibility (not gating)
PUBLIC_BASE="${NEXT_PUBLIC_API_BASE:-}"
if [ -n "$PUBLIC_BASE" ]; then
  # Sanitize accidental quotes/backticks/spaces
  PUBLIC_BASE=$(echo "$PUBLIC_BASE" | sed -E 's/[`"'"'"' ]//g')
  PUBLIC_URL="${PUBLIC_BASE%/}/health"
else
  PUBLIC_URL=""
fi

MAX=30
COUNT=1
LAST_HTTP=""
LAST_STATUS=""
LAST_RESP=""

while [ $COUNT -le $MAX ]; do
  # Check local backend first
  HTTP=$(timeout 10 curl -s -o /dev/null -w "%{http_code}" "$PRIMARY_URL" || true)
  RESP=$(timeout 10 curl -s "$PRIMARY_URL" || true)
  SUCCESS=$(echo "$RESP" | jq -r '.success' 2>/dev/null || { echo "$RESP" | grep -q '"success":true' && echo "true" || echo "false"; })
  STATUS=$(echo "$RESP" | jq -r '.status' 2>/dev/null || echo "$RESP" | grep -o '"status":"[^"]*"' | cut -d '"' -f4)

  if [ "$HTTP" = "200" ] && { [ "$SUCCESS" = "true" ] || [ "$STATUS" = "healthy" ] || [ "$STATUS" = "degraded" ] || [ -n "$RESP" ]; }; then
    echo "✅ Backend local health OK at attempt $COUNT/$MAX: HTTP $HTTP, Status: ${STATUS:-unknown}, URL: $PRIMARY_URL"
    exit 0
  fi

  # Sample public health occasionally for diagnostics
  if [ -n "$PUBLIC_URL" ] && [ $((COUNT % 5)) -eq 0 ]; then
    PUB_HTTP=$(timeout 10 curl -s -o /dev/null -w "%{http_code}" "$PUBLIC_URL" || true)
    PUB_RESP=$(timeout 10 curl -s "$PUBLIC_URL" || true)
    PUB_STATUS=$(echo "$PUB_RESP" | jq -r '.status' 2>/dev/null || echo "$PUB_RESP" | grep -o '"status":"[^"]*"' | cut -d '"' -f4)
    echo "ℹ️  Public health sample: HTTP $PUB_HTTP, Status: ${PUB_STATUS:-unknown}, URL: $PUBLIC_URL"
  fi

  echo "⏳ Attempt $COUNT/$MAX: HTTP $HTTP, Status: ${STATUS:-unknown}, URL: $PRIMARY_URL"
  LAST_HTTP="$HTTP"; LAST_STATUS="$STATUS"; LAST_RESP="$RESP"
  sleep 3
  COUNT=$((COUNT+1))
done

echo "❌ Backend health gating failed after $MAX attempts: url='$PRIMARY_URL' http='$LAST_HTTP' status='${LAST_STATUS:-unknown}' resp='${LAST_RESP:0:512}'"
exit 1