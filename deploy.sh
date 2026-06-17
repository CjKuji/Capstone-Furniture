#!/usr/bin/env bash
set -euo pipefail

APP_NAME="${APP_NAME:-woodforge-app}"
BRANCH="main"
RUN_INSTALL=1
RUN_PULL=1
DRY_RUN=0
HEALTH_URL="${HEALTH_URL:-https://woodforge.sbs}"
ALLOW_DIRTY=0

usage() {
  cat <<'EOF'
Usage: ./deploy.sh [options]

Options:
  --branch <name>      Git branch to deploy (default: main)
  --app <name>         PM2 app name (default: woodforge-app)
  --url <url>          Health check URL (default: https://woodforge.sbs)
  --no-install         Skip npm ci
  --no-pull            Skip git pull
  --allow-dirty        Allow deploy with local git changes
  --dry-run            Print steps without executing
  -h, --help           Show this help
EOF
}

log() {
  echo "[deploy] $*"
}

run() {
  if [[ "$DRY_RUN" == "1" ]]; then
    echo "+ $*"
  else
    eval "$*"
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --branch)
      BRANCH="$2"
      shift 2
      ;;
    --app)
      APP_NAME="$2"
      shift 2
      ;;
    --url)
      HEALTH_URL="$2"
      shift 2
      ;;
    --no-install)
      RUN_INSTALL=0
      shift
      ;;
    --no-pull)
      RUN_PULL=0
      shift
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --allow-dirty)
      ALLOW_DIRTY=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      usage
      exit 1
      ;;
  esac
done

for cmd in git npm pm2; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Missing required command: $cmd"
    exit 1
  fi
done

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

if [[ ! -f "package.json" ]]; then
  echo "package.json not found in $PROJECT_DIR"
  exit 1
fi

if [[ -n "$(git status --porcelain)" && "$ALLOW_DIRTY" != "1" && "$DRY_RUN" != "1" ]]; then
  echo "Working tree has uncommitted changes. Commit or stash before deploy, or use --allow-dirty."
  exit 1
fi

if [[ -n "$(git status --porcelain)" && "$DRY_RUN" == "1" ]]; then
  log "Dry-run: continuing with dirty working tree"
fi

log "Starting deploy in $PROJECT_DIR"
log "Branch: $BRANCH | PM2 app: $APP_NAME"

if [[ "$RUN_PULL" == "1" ]]; then
  run "git fetch origin $BRANCH"
  run "git pull --ff-only origin $BRANCH"
else
  log "Skipping git pull"
fi

if [[ "$RUN_INSTALL" == "1" ]]; then
  run "npm ci"
else
  log "Skipping npm ci"
fi

run "npm run build"
run "pm2 restart $APP_NAME --update-env"
run "pm2 save"
run "pm2 status"

if command -v curl >/dev/null 2>&1; then
  run "curl -I --max-time 15 $HEALTH_URL | head -n 5"
fi

log "Deploy complete"
