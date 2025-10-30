#!/usr/bin/env bash
# Production-only gating: never use localhost; require public API base
RAW_BASE="${NEXT_PUBLIC_API_BASE:-}"
# Remove quotes/backticks and trim spaces
SANITIZED_BASE="${RAW_BASE//\"/}"
SANITIZED_BASE="${SANITIZED_BASE//\'/}"
SANITIZED_BASE="${SANITIZED_BASE//\`/}"
SANITIZED_BASE="$(echo "$SANITIZED_BASE" | xargs)"
if [ -z "$SANITIZED_BASE" ]; then
  echo "❌ NEXT_PUBLIC_API_BASE is not set; cannot perform production health gating."
  exit 1
fi
HEALTH_URL="${SANITIZED_BASE%/}/health"
MAX=30
COUNT=1
while [ $COUNT -le $MAX ]; do
  HTTP=$(timeout 10 curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" || true)
  RESP=$(timeout 10 curl -s "$HEALTH_URL" || true)
  SUCCESS=$(echo "$RESP" | jq -r '.success' 2>/dev/null || { echo "$RESP" | grep -q '"success":true' && echo "true" || echo "false"; })
  STATUS=$(echo "$RESP" | jq -r .status 2>/dev/null || echo "$RESP" | grep -o '"status":"[^"]*"' | cut -d '"' -f4)

  if [ "$HTTP" = "200" ] && { [ "$SUCCESS" = "true" ] || [ "$STATUS" = "healthy" ] || [ "$STATUS" = "degraded" ]; }; then
    echo "✅ Backend health check passed at attempt $COUNT/$MAX: HTTP $HTTP, URL: $HEALTH_URL, Success: $SUCCESS, Status: ${STATUS:-unknown}"
    exit 0
  fi
  echo "⏳ Backend health check attempt $COUNT/$MAX: HTTP $HTTP, URL: $HEALTH_URL, Success: $SUCCESS, Status: ${STATUS:-unknown}"
  sleep 5; COUNT=$((COUNT+1))
done
echo "❌ Backend health check gating failed after $MAX attempts: url='$HEALTH_URL' http='$HTTP' success='$SUCCESS' status='${STATUS:-unknown}' resp='${RESP:0:512}'"
exit 1
