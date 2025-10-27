#!/usr/bin/env bash
# Backend health check script for systemd service gating
# This script ensures the backend is healthy before starting the frontend

BASE="${NEXT_PUBLIC_API_BASE:-http://127.0.0.1:8080}"
HEALTH_URL="${BASE%/}/health"
MAX=30
COUNT=1

while [ $COUNT -le $MAX ]; do
  # Check HTTP status code
  HTTP=$(timeout 10 curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" || true)
  
  # Get full response
  RESP=$(timeout 10 curl -s "$HEALTH_URL" || true)
  
  # Extract success and status from JSON response
  SUCCESS=$(echo "$RESP" | jq -r '.success' 2>/dev/null || { echo "$RESP" | grep -q '"success":true' && echo "true" || echo "false"; })
  STATUS=$(echo "$RESP" | jq -r '.status' 2>/dev/null || echo "$RESP" | grep -o '"status":"[^"]*"' | cut -d '"' -f4)
  
  # Check if backend is healthy
  if [ "$HTTP" = "200" ] && { [ "$SUCCESS" = "true" ] || [ "$STATUS" = "healthy" ] || [ "$STATUS" = "degraded" ]; }; then
    echo "✅ Backend health check passed at attempt $COUNT/$MAX: HTTP $HTTP, URL: $HEALTH_URL, Success: $SUCCESS, Status: ${STATUS:-unknown}"
    exit 0
  fi
  
  echo "⏳ Backend health check attempt $COUNT/$MAX: HTTP $HTTP, URL: $HEALTH_URL, Success: $SUCCESS, Status: ${STATUS:-unknown}"
  sleep 3  # Reduced from 5 to 3 seconds for faster feedback
  COUNT=$((COUNT+1))

done

echo "❌ Backend health check gating failed after $MAX attempts: url='$HEALTH_URL' http='$HTTP' success='$SUCCESS' status='${STATUS:-unknown}' resp='$RESP'"
exit 1