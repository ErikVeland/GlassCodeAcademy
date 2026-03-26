#!/usr/bin/env bash
set -euo pipefail

export CI="${CI:-1}"
export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/glasscode_test}"
export REDIS_HOST="${REDIS_HOST:-localhost}"
export REDIS_PORT="${REDIS_PORT:-6379}"
export JWT_SECRET="${JWT_SECRET:-test-secret-key}"

echo "▶ Installing dependencies"
npm ci

echo "▶ Checking formatting"
npm -w @glass-code-academy/api run format:check
npm -w @glass-code-academy/web run format:check

echo "▶ Linting"
npm -w @glass-code-academy/api run lint
npm -w @glass-code-academy/web run lint

echo "▶ Type checking"
npm -w @glass-code-academy/api run typecheck
npm -w @glass-code-academy/web run typecheck

echo "▶ Running backend tests"
npm -w @glass-code-academy/api run test

echo "▶ Building deployable artifacts"
npm -w @glass-code-academy/api run build
npm -w @glass-code-academy/web run build

echo "✅ Quality gate passed"
