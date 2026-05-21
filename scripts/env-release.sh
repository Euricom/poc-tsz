#!/usr/bin/env bash
# env-release.sh — release ports claimed by this worktree back to the pool
# Usage: ./env-release.sh           (run from inside the worktree)
#        ./env-release.sh /path/to/worktree
set -euo pipefail

REGISTRY_DIR="${WORKTREE_PORTS_DIR:-$HOME/.worktree-ports}"

WORKTREE="${1:-$PWD}"
WORKTREE="$(cd "$WORKTREE" && pwd)"

ENV_FILE="$WORKTREE/.env.local"

released=()

# ---- preferred path: read .env to know which ports we claimed ----
if [[ -f "$ENV_FILE" ]]; then
  for key in WEB_PORT API_PORT; do
    port=$(grep -E "^${key}=" "$ENV_FILE" 2>/dev/null | cut -d= -f2 || true)
    if [[ -n "$port" ]]; then
      file="$REGISTRY_DIR/$port"
      if [[ -f "$file" ]]; then
        owner=$(cat "$file")
        if [[ "$owner" == "$WORKTREE" ]]; then
          rm -f "$file"
          released+=("$port")
        else
          echo "WARN: port $port is owned by $owner, not releasing" >&2
        fi
      fi
    fi
  done

  # strip the keys from .env
  tmp=$(mktemp)
  grep -vE '^(WEB_PORT|API_PORT)=' "$ENV_FILE" > "$tmp" || true
  if [[ -s "$tmp" ]]; then
    mv "$tmp" "$ENV_FILE"
  else
    rm -f "$tmp" "$ENV_FILE"
  fi
fi

# ---- fallback: scan registry for any file pointing at this worktree ----
# Catches the case where .env was deleted before stop.sh ran, or the
# worktree directory was removed and stop.sh is called with an explicit path.
if [[ -d "$REGISTRY_DIR" ]]; then
  for file in "$REGISTRY_DIR"/*; do
    [[ -f "$file" ]] || continue
    if [[ "$(cat "$file")" == "$WORKTREE" ]]; then
      port=$(basename "$file")
      rm -f "$file"
      # only add if not already in released[]
      if [[ ! " ${released[*]:-} " =~ " $port " ]]; then
        released+=("$port")
      fi
    fi
  done
fi

if [[ ${#released[@]} -eq 0 ]]; then
  echo "No ports to release for $WORKTREE"
else
  echo "Released: ${released[*]}"
fi
