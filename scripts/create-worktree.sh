#!/usr/bin/env bash
# WorktreeCreate hook — called by Claude Code with JSON on stdin.
# Reads .worktreeinclude and symlinks listed paths from the repo root into the new worktree.
set -e

NAME=$(jq -r .name)
ROOT=$(git rev-parse --show-toplevel)
DIR="$ROOT/.claude/worktrees/$NAME"

# Create the worktree on a new branch, or attach to existing branch on retry
git worktree add -b "worktree-$NAME" "$DIR" origin/HEAD >&2 \
  || git worktree add "$DIR" "worktree-$NAME" >&2

# Install JS dependencies if applicable
cd "$DIR"
[ -f package.json ] && bun install >&2 || true

# Symlink entries listed in .worktreeinclude
INCLUDE="$ROOT/.worktreeinclude"
if [ -f "$INCLUDE" ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    # Skip blank lines and comments
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ -z "$line" ]] && continue

    # Strip leading ./
    rel="${line#./}"
    SRC="$ROOT/$rel"
    DEST="$DIR/$rel"

    if [ -e "$SRC" ]; then
      mkdir -p "$(dirname "$DEST")"
      ln -sfn "$SRC" "$DEST" >&2
      echo "  linked: $rel" >&2
    else
      echo "  skip (missing): $rel" >&2
    fi
  done < "$INCLUDE"
fi

# Claim ports for the new worktree
"$ROOT/scripts/env-claim.sh" "$DIR" >&2

# Return the worktree path to Claude Code
echo "$DIR"
