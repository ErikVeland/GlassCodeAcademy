#!/bin/bash

# Script to verify the database migration
set -e

echo "🔍 Running SQL verification..."
psql "$DATABASE_URL" -f /Users/veland/GlassCodeAcademy/scripts/migration/02_verify.sql

echo "🔍 Running TypeScript verification..."
cd /Users/veland/GlassCodeAcademy/scripts && node migration/verify_migration.js

echo "✅ All verifications completed successfully!"