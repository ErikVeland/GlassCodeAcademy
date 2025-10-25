#!/usr/bin/env bash
# Backend health check script for systemd service gating
# This script ensures the backend is healthy before starting the frontend

MAX=30
COUNT=1

while [ $COUNT -le $MAX ]; do
  # Check HTTP status code
  HTTP=$(timeout 10 curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/health || true)
  
  # Get full response
  RESP=$(timeout 10 curl -s http://127.0.0.1:8080/health || true)
  
  # Extract success from JSON response (try jq first, fallback to grep)
  SUCCESS=$(echo "$RESP" | jq -r '.success' 2>/dev/null || { echo "$RESP" | grep -q '"success":true' && echo "true" || echo "false"; })
  
  # Check if backend is healthy
  if [ "$HTTP" = "200" ] && [ "$SUCCESS" = "true" ]; then
    echo "✅ Backend health check passed at attempt $COUNT/$MAX: HTTP $HTTP, Success: $SUCCESS"
    exit 0
  fi
  
  echo "⏳ Backend health check attempt $COUNT/$MAX: HTTP $HTTP, Success: $SUCCESS"
  sleep 3  # Reduced from 5 to 3 seconds for faster feedback
  COUNT=$((COUNT+1))

done

echo "❌ Backend health check gating failed after $MAX attempts: http='$HTTP' success='$SUCCESS' resp='$RESP'"
exit 1