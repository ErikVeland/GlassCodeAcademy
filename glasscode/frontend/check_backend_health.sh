#!/usr/bin/env bash
# Backend health check script for systemd service gating
# This script ensures the backend is healthy before starting the frontend

MAX=30
COUNT=1

while [ $COUNT -le $MAX ]; do
  # Check HTTP status code
  HTTP=$(timeout 10 curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/api/health || true)
  
  # Get full response
  RESP=$(timeout 10 curl -s http://127.0.0.1:8080/api/health || true)
  
  # Extract status from JSON response (try jq first, fallback to grep)
  STATUS=$(echo "$RESP" | jq -r .status 2>/dev/null || echo "$RESP" | grep -o '"status":"[^"]*"' | cut -d '"' -f4)
  
  # Check if backend is healthy
  if [ "$HTTP" = "200" ] && [ "$STATUS" = "healthy" ]; then
    echo "✅ Backend health check passed: HTTP $HTTP, Status: $STATUS"
    exit 0
  fi
  
  echo "⏳ Backend health check attempt $COUNT/$MAX: HTTP $HTTP, Status: $STATUS"
  sleep 3  # Reduced from 5 to 3 seconds for faster feedback
  COUNT=$((COUNT+1))
done

echo "❌ Backend health check gating failed after $MAX attempts: http='$HTTP' status='$STATUS' resp='$RESP'"
exit 1