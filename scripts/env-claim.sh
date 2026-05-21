#!/usr/bin/env bash
# env-claim.sh — claim two ports (web + api) for the current worktree
# Usage: ./env-claim.sh           (run from inside the worktree)
#        ./env-claim.sh /path/to/worktree
set -euo pipefail

# ---- config ----
REGISTRY_DIR="${WORKTREE_PORTS_DIR:-$HOME/.worktree-ports}"
PORT_RANGE=(3000 3001 3002 3003 3004 3005)

# ---- args ----
WORKTREE="${1:-$PWD}"
WORKTREE="$(cd "$WORKTREE" && pwd)"   # absolutise

mkdir -p "$REGISTRY_DIR"

# ---- helper: try to claim a single port atomically ----
# Uses `set -o noclobber` + redirection — fails if the file already exists.
# Returns 0 on success, 1 if port is taken.
claim_port() {
  local port=$1
  local file="$REGISTRY_DIR/$port"
  if (set -o noclobber; echo "$WORKTREE" > "$file") 2>/dev/null; then
    return 0
  fi
  return 1
}

# ---- helper: is this port already claimed by *this* worktree? ----
owned_by_me() {
  local port=$1
  local file="$REGISTRY_DIR/$port"
  [[ -f "$file" ]] && [[ "$(cat "$file")" == "$WORKTREE" ]]
}

# ---- idempotency: if .env.local already has valid ports for this worktree, reuse ----
ENV_FILE="$WORKTREE/.env.local"
if [[ -f "$ENV_FILE" ]]; then
  existing_web=$(grep -E '^WEB_PORT=' "$ENV_FILE" 2>/dev/null | cut -d= -f2 || true)
  existing_api=$(grep -E '^API_PORT=' "$ENV_FILE" 2>/dev/null | cut -d= -f2 || true)
  if [[ -n "$existing_web" && -n "$existing_api" ]] \
     && owned_by_me "$existing_web" && owned_by_me "$existing_api"; then
    echo "Ports already claimed: WEB_PORT=$existing_web API_PORT=$existing_api"
    exit 0
  fi
fi

# ---- claim two free ports ----
claimed=()
for port in "${PORT_RANGE[@]}"; do
  if claim_port "$port"; then
    claimed+=("$port")
    [[ ${#claimed[@]} -eq 2 ]] && break
  fi
done

if [[ ${#claimed[@]} -lt 2 ]]; then
  # roll back any single port we did manage to claim
  for p in "${claimed[@]}"; do
    rm -f "$REGISTRY_DIR/$p"
  done
  echo "ERROR: not enough free ports in pool (${PORT_RANGE[*]})" >&2
  echo "Currently allocated:" >&2
  for p in "${PORT_RANGE[@]}"; do
    [[ -f "$REGISTRY_DIR/$p" ]] && echo "  $p -> $(cat "$REGISTRY_DIR/$p")" >&2
  done
  exit 1
fi

WEB_PORT="${claimed[0]}"
API_PORT="${claimed[1]}"

# ---- write to .env (preserve other entries, replace our two keys) ----
tmp=$(mktemp)
if [[ -f "$ENV_FILE" ]]; then
  grep -vE '^(WEB_PORT|API_PORT)=' "$ENV_FILE" > "$tmp" || true
fi
{
  echo "WEB_PORT=$WEB_PORT"
  echo "API_PORT=$API_PORT"
} >> "$tmp"
mv "$tmp" "$ENV_FILE"

echo "Claimed: WEB_PORT=$WEB_PORT API_PORT=$API_PORT"
echo "Wrote to: $ENV_FILE"