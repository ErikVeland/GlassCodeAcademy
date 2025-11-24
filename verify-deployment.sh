#!/bin/bash

# Script to verify that the GlassCode Academy deployment is working correctly

echo "🔍 Verifying GlassCode Academy deployment..."

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running"
    exit 1
fi

echo "✅ Docker is running"

# Check if the required containers are running
cd /Users/veland/GlassCodeAcademy

if ! docker compose -f docker-compose.optimized.yml ps | grep -q "glasscode_api.*Up.*healthy"; then
    echo "❌ API container is not running or not healthy"
    exit 1
fi

if ! docker compose -f docker-compose.optimized.yml ps | grep -q "glasscode_frontend.*Up"; then
    echo "❌ Frontend container is not running"
    exit 1
fi

if ! docker compose -f docker-compose.optimized.yml ps | grep -q "glasscode_nginx.*Up.*healthy"; then
    echo "❌ Nginx container is not running or not healthy"
    exit 1
fi

if ! docker compose -f docker-compose.optimized.yml ps | grep -q "glasscode_postgres.*Up.*healthy"; then
    echo "❌ PostgreSQL container is not running or not healthy"
    exit 1
fi

if ! docker compose -f docker-compose.optimized.yml ps | grep -q "glasscode_redis.*Up.*healthy"; then
    echo "❌ Redis container is not running or not healthy"
    exit 1
fi

echo "✅ All containers are running and healthy"

# Check API health endpoint
if ! curl -f http://localhost:8081/api/health >/dev/null 2>&1; then
    echo "❌ API health endpoint is not responding"
    exit 1
fi

echo "✅ API health endpoint is responding"

# Check frontend through Nginx
if ! curl -f http://localhost:8080 >/dev/null 2>&1; then
    echo "❌ Frontend through Nginx is not responding"
    exit 1
fi

echo "✅ Frontend through Nginx is responding"

# Check API through Nginx
if ! curl -f http://localhost:8080/api/health >/dev/null 2>&1; then
    echo "❌ API through Nginx is not responding"
    exit 1
fi

echo "✅ API through Nginx is responding"

# Check login page
if ! curl -f http://localhost:8080/login >/dev/null 2>&1; then
    echo "❌ Login page is not accessible"
    exit 1
fi

echo "✅ Login page is accessible"

echo "🎉 All checks passed! GlassCode Academy deployment is working correctly."

echo ""
echo "You can access the application at:"
echo "  Frontend: http://localhost:8080"
echo "  API: http://localhost:8081"
echo "  PostgreSQL: localhost:5432"
echo "  Redis: localhost:6379"