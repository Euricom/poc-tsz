#!/usr/bin/env bash
# Start web + api with auto-assigned ports.
# Web tries 3000..3005; API picks a random free port in 5200..5999.
# SERVER_URL is wired into the web process so it points at this API.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

if [[ -z "${NO_COLOR:-}" ]] && [[ -t 1 ]]; then
  C_API=$'\e[36m'
  C_WEB=$'\e[35m'
  C_OK=$'\e[1;32m'
  C_DIM=$'\e[2m'
  C_ERR=$'\e[1;31m'
  C_RST=$'\e[0m'
else
  C_API='' C_WEB='' C_OK='' C_DIM='' C_ERR='' C_RST=''
fi

port_in_use() {
  lsof -iTCP:"$1" -sTCP:LISTEN -t >/dev/null 2>&1
}

find_web_port() {
  for p in 3000 3001 3002 3003 3004 3005; do
    port_in_use "$p" || { echo "$p"; return 0; }
  done
  return 1
}

find_api_port() {
  local p
  for _ in $(seq 1 25); do
    p=$(( RANDOM % 800 + 5200 ))
    port_in_use "$p" || { echo "$p"; return 0; }
  done
  return 1
}

WEB_PORT="$(find_web_port)" || {
  printf '%s✗ No free web port in 3000-3005%s\n' "$C_ERR" "$C_RST" >&2
  exit 1
}
API_PORT="$(find_api_port)" || {
  printf '%s✗ Could not allocate an API port in 5200-5999%s\n' "$C_ERR" "$C_RST" >&2
  exit 1
}

prefix() {
  local color="$1" tag="$2"
  while IFS= read -r line; do
    printf '%s[%s]%s %s\n' "$color" "$tag" "$C_RST" "$line"
  done
}

cleanup() {
  trap - EXIT INT TERM
  kill 0 2>/dev/null || true
}
trap cleanup EXIT INT TERM

printf '%s──────────────────────────────────────────%s\n' "$C_DIM" "$C_RST"
printf '  %sWeb%s : %shttp://localhost:%s%s\n' "$C_OK" "$C_RST" "$C_OK" "$WEB_PORT" "$C_RST"
printf '  %sAPI%s : %shttp://localhost:%s%s\n' "$C_OK" "$C_RST" "$C_OK" "$API_PORT" "$C_RST"
printf '%s──────────────────────────────────────────%s\n' "$C_DIM" "$C_RST"

(
  ASPNETCORE_URLS="http://localhost:$API_PORT" \
    dotnet watch run --project packages/api --no-launch-profile --non-interactive 2>&1 \
    | prefix "$C_API" api
  kill 0 2>/dev/null || true
) &

(
  cd packages/web
  SERVER_URL="http://localhost:$API_PORT" \
    bunx vite --port "$WEB_PORT" --strictPort 2>&1 \
    | prefix "$C_WEB" web
  kill 0 2>/dev/null || true
) &

wait
