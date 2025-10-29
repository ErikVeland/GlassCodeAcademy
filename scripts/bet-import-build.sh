#!/usr/bin/env bash
set -euo pipefail

# bet-import-build.sh
# Import and build an external repo (Entain) for bet.glasscode.academy.

REPO_URL="${ENTAIN_REPO_URL:-}"
BRANCH="main"
DEST_DIR="$(pwd)/bet.glasscode.academy"
COMMIT=""

usage() {
  cat <<EOF
Usage: $0 --repo <git-url> [--branch <branch>] [--commit <sha>] [--dest <path>]

Options:
  --repo    Git URL of the Entain repo (https/ssh)
  --branch  Branch to checkout (default: main)
  --commit  Commit SHA to build (detached HEAD). If omitted, builds branch tip
  --dest    Destination parent directory (default: ./bet.glasscode.academy)

Env:
  ENTAIN_REPO_URL  Alternative to --repo

Outputs:
  <dest>/source  - cloned repo
  <dest>/build   - build artifacts (dist/build/.next/out)
  <dest>/build/build-info.txt - metadata
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo)
      REPO_URL="$2"; shift 2;;
    --branch)
      BRANCH="$2"; shift 2;;
    --commit)
      COMMIT="$2"; shift 2;;
    --dest)
      DEST_DIR="$2"; shift 2;;
    -h|--help)
      usage; exit 0;;
    *)
      echo "Unknown option: $1"; usage; exit 1;;
  esac
done

if [[ -z "$REPO_URL" ]]; then
  echo "❌ REPO_URL missing. Provide --repo <git-url> or set ENTAIN_REPO_URL."
  usage
  exit 1
fi

SOURCE_DIR="$DEST_DIR/source"
BUILD_DIR="$DEST_DIR/build"
mkdir -p "$SOURCE_DIR" "$BUILD_DIR"

echo "📁 Destination: $DEST_DIR"
echo "🔗 Repo URL:    $REPO_URL"
echo "🌿 Branch:      $BRANCH"
[[ -n "$COMMIT" ]] && echo "🔒 Commit:      $COMMIT"

# Clone or update
if [[ -d "$SOURCE_DIR/.git" ]]; then
  echo "↻ Updating existing checkout..."
  pushd "$SOURCE_DIR" >/dev/null
  git fetch --all
  if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
    git checkout "$BRANCH"
  else
    git checkout -b "$BRANCH" "origin/$BRANCH" || git checkout "$BRANCH" || true
  fi
  git reset --hard "origin/$BRANCH" || true
  # If specific commit requested, checkout detached HEAD at that commit
  if [[ -n "$COMMIT" ]]; then
    echo "🔒 Checking out commit $COMMIT"
    git fetch --all
    if git rev-parse --verify "$COMMIT" >/dev/null 2>&1; then
      git checkout -f "$COMMIT"
    else
      echo "❌ Commit $COMMIT not found after fetch"; exit 1
    fi
  fi
  popd >/dev/null
else
  echo "⬇️  Cloning repo..."
  git clone --branch "$BRANCH" "$REPO_URL" "$SOURCE_DIR" || git clone "$REPO_URL" "$SOURCE_DIR"
  pushd "$SOURCE_DIR" >/dev/null
  # Ensure branch
  git fetch --all
  git checkout "$BRANCH" || true
  # If specific commit requested, checkout detached HEAD at that commit
  if [[ -n "$COMMIT" ]]; then
    echo "🔒 Checking out commit $COMMIT"
    if git rev-parse --verify "$COMMIT" >/dev/null 2>&1; then
      git checkout -f "$COMMIT"
    else
      echo "❌ Commit $COMMIT not found after fetch"; exit 1
    fi
  fi
  popd >/dev/null
fi

# Detect package manager
PM=""
pushd "$SOURCE_DIR" >/dev/null
if command -v pnpm >/dev/null 2>&1 && [[ -f pnpm-lock.yaml ]]; then
  PM="pnpm"
elif command -v yarn >/dev/null 2>&1 && [[ -f yarn.lock ]]; then
  PM="yarn"
else
  PM="npm"
fi
echo "📦 Package manager: $PM"

# Install deps
echo "📦 Installing dependencies..."
case "$PM" in
  pnpm)
    pnpm install --frozen-lockfile || pnpm install;;
  yarn)
    yarn install --frozen-lockfile || yarn install;;
  npm)
    if [[ -f package-lock.json ]]; then
      npm ci || npm install || npm install --legacy-peer-deps
    else
      npm install || npm install --legacy-peer-deps
    fi;;
esac
echo "✅ Dependencies installed"

# Build
echo "🏗️  Building project..."
BUILD_OK=false
case "$PM" in
  pnpm)
    pnpm build && BUILD_OK=true || BUILD_OK=false;;
  yarn)
    yarn build && BUILD_OK=true || BUILD_OK=false;;
  npm)
    npm run build && BUILD_OK=true || BUILD_OK=false;;
esac

if [[ "$BUILD_OK" != "true" ]]; then
  echo "❌ Build failed. Check the repo's build script or required env vars."
  exit 1
fi
echo "✅ Build completed"

# Find output directory
OUT_DIR=""
for d in dist build .next out public; do
  if [[ -d "$d" ]]; then OUT_DIR="$d"; break; fi
done

if [[ -z "$OUT_DIR" ]]; then
  echo "⚠️  No standard output dir found. Keeping repo as-is."
else
  echo "📂 Output dir detected: $OUT_DIR"
  rsync -a --delete "$OUT_DIR/" "$BUILD_DIR/" || cp -R "$OUT_DIR" "$BUILD_DIR" 2>/dev/null || true
fi

# Record build metadata
COMMIT="$(git rev-parse HEAD || echo 'unknown')"
DATE="$(date -Iseconds)"
cat > "$BUILD_DIR/build-info.txt" <<INFO
Repo:   $REPO_URL
Branch: $BRANCH
Commit: $COMMIT
Date:   $DATE
Source: $SOURCE_DIR
Output: ${OUT_DIR:-<none>}
INFO

echo "🧾 Build info written to $BUILD_DIR/build-info.txt"
echo "🎉 Done. Build artifacts in: $BUILD_DIR"
popd >/dev/null