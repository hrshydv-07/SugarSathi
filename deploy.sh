#!/usr/bin/env bash
# =============================================================================
# deploy.sh — DiaCare Senior Full-Stack Deployment Helper
# =============================================================================
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh [frontend|backend|all]
# =============================================================================

set -euo pipefail

# ── Colours ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()     { echo -e "${CYAN}[deploy]${NC} $*"; }
success() { echo -e "${GREEN}[deploy] ✅ $*${NC}"; }
warn()    { echo -e "${YELLOW}[deploy] ⚠️  $*${NC}"; }
error()   { echo -e "${RED}[deploy] ❌ $*${NC}"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
BACKEND_DIR="$SCRIPT_DIR/backend"

check_dirs() {
  [[ -d "$FRONTEND_DIR" ]] || error "frontend/ directory not found."
  [[ -d "$BACKEND_DIR" ]]  || error "backend/ directory not found."
}

check_deps() {
  log "Checking dependencies..."
  command -v node  >/dev/null 2>&1 || error "node not found. Install Node.js v18+."
  command -v npm   >/dev/null 2>&1 || error "npm not found."
  command -v git   >/dev/null 2>&1 || error "git not found."
  NODE_VER=$(node -v | sed 's/v//')
  success "Node.js v${NODE_VER} — OK"
}

deploy_frontend() {
  log "Building frontend (React 19 + Vite)..."
  cd "$FRONTEND_DIR"
  npm install
  npm run build
  success "Frontend build completed successfully."
}

deploy_backend() {
  log "Verifying backend..."
  cd "$BACKEND_DIR"
  npm install
  node -c server.js
  success "Backend syntax check OK."
}

main() {
  local target="${1:-all}"
  check_dirs
  check_deps

  case "$target" in
    frontend) deploy_frontend ;;
    backend)  deploy_backend ;;
    all)
      deploy_frontend
      deploy_backend
      success "Full-stack validation completed!"
      ;;
    *) error "Unknown target: $target. Use: frontend | backend | all" ;;
  esac
}

main "$@"
