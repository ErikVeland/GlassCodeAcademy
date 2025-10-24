#!/usr/bin/env bash
# verify-next-pages-assets.sh - Verify Next.js server pages, APIs, and static assets
# Usage: ./scripts/verify-next-pages-assets.sh [BASE_URL]
# Default BASE_URL: http://localhost:${PORT:-3000}

BASE="${1:-http://localhost:${PORT:-3000}}"

echo "Verifying Next server at: $BASE"

fail=0

get_title_for_slug() {
  local slug="$1"
  local data
  data=$(curl -s "$BASE/api/content/registry")
  echo "$data" | jq -r '
    if type=="array" then
      (.[] | select(.slug=="'"$slug"'") | .title) // empty
    else
      (.modules[]? | select(.slug=="'"$slug"'") | .title) // empty
    end
  '
}

check_page_contains() {
  local path="$1"
  local expected="$2"
  local html
  html=$(curl -s "$BASE$path")
  if echo "$html" | grep -qi -- "$expected"; then
    printf "OK contains '%s' %s\n" "$expected" "$path"
  else
    printf "FAIL missing '%s' %s\n" "$expected" "$path"
    fail=$((fail+1))
  fi
}

check_json_nonempty() {
  local path="$1"
  local json
  json=$(curl -s "$BASE$path")
  if echo "$json" | jq -e '((type=="array" and length>0) or (type=="object" and ((.modules|length>0) or (.tiers|length>0) or (keys|length>0))))' >/dev/null; then
    printf "OK non-empty JSON %s\n" "$path"
  else
    printf "FAIL empty/invalid JSON %s\n" "$path"
    fail=$((fail+1))
  fi
}

check_asset_content_type() {
  local asset_path="$1"
  local ct
  ct=$(curl -sI "$BASE$asset_path" | awk -F': ' 'tolower($1)=="content-type"{print tolower($2)}' | tr -d '\r')
  if echo "$asset_path" | grep -q "\.js$"; then
    if echo "$ct" | grep -q "javascript"; then
      printf "OK content-type js %s\n" "$asset_path"
    else
      printf "FAIL content-type js (%s) %s\n" "$ct" "$asset_path"
      fail=$((fail+1))
    fi
  elif echo "$asset_path" | grep -q "\.css$"; then
    if echo "$ct" | grep -q "text/css"; then
      printf "OK content-type css %s\n" "$asset_path"
    else
      printf "FAIL content-type css (%s) %s\n" "$ct" "$asset_path"
      fail=$((fail+1))
    fi
  fi
}

check() {
  local path="$1"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$path")
  printf "HTTP %s %s\n" "$code" "$path"
  if [ "$code" -ne 200 ]; then
    fail=$((fail+1))
  fi
}

# Core canonical module routes
check "/web-fundamentals"
check "/web-fundamentals/lessons"
check "/web-fundamentals/quiz"
check "/programming-fundamentals"
check "/programming-fundamentals/lessons"
check "/programming-fundamentals/quiz"

# Validate page content contains expected module titles
web_title=$(get_title_for_slug "web-fundamentals"); [ -z "$web_title" ] && web_title="Web Fundamentals"
prog_title=$(get_title_for_slug "programming-fundamentals"); [ -z "$prog_title" ] && prog_title="Programming Fundamentals"
check_page_contains "/web-fundamentals" "$web_title"
check_page_contains "/programming-fundamentals" "$prog_title"
check_page_contains "/web-fundamentals/lessons" "Lessons"

# Content APIs: validate non-empty JSON
check_json_nonempty "/api/content/registry"
check_json_nonempty "/api/content/lessons/web"
check_json_nonempty "/api/content/lessons/programming"

# Extract a few static assets referenced by a lessons page and verify
echo "\nExtracting static assets from /web-fundamentals/lessons..."
html=$(curl -s "$BASE/web-fundamentals/lessons")
assets_js=$(echo "$html" | grep -o '/_next/static/[^" ]*\.js' | head -n 3)
assets_css=$(echo "$html" | grep -o '/_next/static/[^" ]*\.css' | head -n 2)

for u in $assets_js $assets_css; do
  [ -n "$u" ] || continue
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$u")
  printf "HTTP %s %s\n" "$code" "$u"
  if [ "$code" -ne 200 ]; then
    fail=$((fail+1))
  fi
  check_asset_content_type "$u"
done

if [ "$fail" -gt 0 ]; then
  echo "\n❌ Verification failed with $fail failing checks"
  exit 1
else
  echo "\n✅ Verification passed: all pages, APIs, and assets responded correctly"
fi