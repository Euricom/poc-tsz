#!/usr/bin/env bash
# WorktreeRemove hook — called by Claude Code with JSON on stdin.
# Releases ports via stop-env.sh, then removes the git worktree.
set -e

NAME=$(jq -r .name)
ROOT=$(git rev-parse --show-toplevel)
DIR="$ROOT/.claude/worktrees/$NAME"

# Release ports claimed by this worktree
"$ROOT/scripts/env-release.sh" "$DIR" >&2 || true

# Remove the worktree and its branch
git worktree remove --force "$DIR" >&2 || true
git branch -D "worktree-$NAME" >&2 || true
