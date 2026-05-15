---
name: git-worktree-merge
description: "Merge a Claude Code worktree branch back into the repo's default branch (`main` or `master`) from the primary worktree, using `ExitWorktree` to remove the linked worktree at the end."
argument-hint: "[strategy] — one of: merge | rebase. Optional second arg: --keep-branch to skip deleting the branch after merge."
disable-model-invocation: true
model: haiku
---

## Arguments

The skill accepts a strategy argument that selects which workflow to run:

| Argument           | Strategy         | When to use                                                       |
| ------------------ | ---------------- | ----------------------------------------------------------------- |
| _(none)_ / `merge` | `--no-ff` merge  | **Default.** One worktree = one task; preserves the branch point. |
| `rebase`           | Rebase + ff-only | Personal branch, linear history wanted.                           |

Optional flags (can follow the strategy):

- `--keep-branch` — do not delete the local/remote branch in Phase 4.
- `--no-push` — skip pushing the default branch to origin (e.g. for offline work).

If no argument is given, run the **default `--no-ff` merge** flow.

If the argument is unrecognized, ask the user once for clarification before proceeding.

## Goal

Take finished work from a linked Claude Code worktree, merge it into the repo's **default branch** (`main`, `master`, or whatever the project uses) on the primary worktree without leaving the linked worktree, then tear the linked worktree down with a single `ExitWorktree` call at the very end.

The merge cannot run *with* the linked worktree's `HEAD` on the default branch — Git refuses to check out the same branch in two places. The trick is to use `git -C "$PRIMARY"` so all default-branch operations run against the primary worktree while the session's cwd stays inside the linked one.

## Assumed starting state

- Claude Code session is running **inside a linked worktree** (created earlier via `EnterWorktree`).
- The worktree branch holds the finished work.
- The primary worktree is on the default branch (its normal resting state).

## Phase 1 — Verify the worktree is clean, detect default branch

**Do not stage or commit anything in this phase.** Committing is the user's responsibility — this skill only inspects.

Detect the default branch, capture the worktree branch + primary path, and check cleanliness:

```bash
# Default branch — try origin/HEAD first, then fall back to common names
MAIN=$(git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's@^origin/@@')
if [ -z "$MAIN" ]; then
  for b in main master trunk develop; do
    if git show-ref --verify --quiet "refs/heads/$b"; then MAIN=$b; break; fi
  done
fi

BRANCH=$(git branch --show-current)
PRIMARY=$(git worktree list --porcelain | awk '/^worktree /{print $2; exit}')

echo "main=$MAIN  branch=$BRANCH  primary=$PRIMARY"
git status --porcelain
```

Validate before continuing:

- **`$MAIN` empty** → stop and ask the user which branch to merge into (no safe default).
- **`$BRANCH` equals `$MAIN`** → stop; the worktree is on the default branch itself, nothing to merge.
- **`$PRIMARY` equals current directory** → stop; the session is already in the primary worktree. Tell the user to run plain Git; this skill only applies inside a linked worktree.
- **Detached HEAD** (`$BRANCH` empty) → stop and ask the user to create a named branch (see the "Detached HEAD case" section).

Then branch on tree state:

- **Clean tree, branch ahead of `origin/$MAIN`** → proceed to Phase 2.
- **Clean tree, no commits beyond `origin/$MAIN`** → stop and tell the user there is nothing to merge.
- **Uncommitted changes** → **stop**. Do not run `git add`, `git commit`, or `git stash` on their behalf. Present a friendly summary instead of raw `git status` output:

  1. Run `git status --porcelain` and `git diff --stat HEAD` to gather the change set.
  2. Render a changelog-style list grouped by intent (added / modified / deleted / untracked), one bullet per file with a short human-readable hint about what the change is. Infer the hint from the file path and diff (e.g. `plans/high-level-plan.md` → "new high-level implementation plan").
  3. Close with a single next step: commit the changes, then re-run `/git-worktree-merge`.

  Example shape:

  ```
  Cannot merge yet — this worktree has uncommitted work.

  Changes to commit:
  • Added    plans/high-level-plan.md   — new high-level implementation plan
  • Modified src/foo.ts                  — wire up the new planner entrypoint

  Please commit these changes, then re-run /git-worktree-merge.
  ```

  Keep it concise — no raw porcelain dump, no multi-paragraph explanation.

## Phase 2 — Merge into the default branch (operating on the primary worktree)

All commands here use `git -C "$PRIMARY"` so the primary worktree is the one being updated. The linked worktree's `HEAD` stays put on `$BRANCH` — that's required, because the branch must remain checked out somewhere for the merge to reference it.

```bash
git -C "$PRIMARY" switch "$MAIN"
git -C "$PRIMARY" fetch origin
git -C "$PRIMARY" pull --ff-only origin "$MAIN"
git -C "$PRIMARY" merge --no-ff "$BRANCH" -m "Merge branch '$BRANCH'"
```

Why `--no-ff`:
- Preserves the task branch as a visible integration point.
- Makes rollback and history inspection easier.
- Fits the "one task per worktree branch" model.

### If conflicts occur

Conflicts are written into `$PRIMARY`, not the current cwd. Tell the user the path and resolve there:

```bash
git -C "$PRIMARY" status
# edit files inside $PRIMARY
git -C "$PRIMARY" add <resolved-files>
git -C "$PRIMARY" commit
```

## Phase 3 — Push and verify

```bash
git -C "$PRIMARY" push origin "$MAIN"
git -C "$PRIMARY" log --oneline --decorate -n 15
```

If the branch was previously pushed to origin, delete the remote copy now (still using primary):

```bash
git -C "$PRIMARY" push origin --delete "$BRANCH" 2>/dev/null || true
```

This must happen **before** Phase 4 — once `ExitWorktree(remove)` runs, the local branch ref is gone and you'd be guessing at its name.

## Phase 4 — Exit and remove the worktree

Call the `ExitWorktree` tool with:

```
action: "remove"
discard_changes: true
```

- `remove` deletes the linked worktree directory **and** the local `$BRANCH`. Safe now: the commits are merged into `$MAIN` and pushed.
- `discard_changes: true` is required because `ExitWorktree`'s safety check still sees `$BRANCH` as having commits "not on the original branch" (it doesn't re-check against `$MAIN` after our external merge). Since those commits are already on `$MAIN` and on `origin/$MAIN`, discarding the branch ref loses nothing.

After this call the session is back at `$PRIMARY` and the linked worktree is gone.

## Variant: linear history (rebase)

Same shape, just rebase before merging:

```bash
# Phase 2 (still inside the linked worktree)
git fetch origin
git rebase "origin/$MAIN"                              # rewrites $BRANCH
git push --force-with-lease -u origin "$BRANCH"        # only if previously pushed

git -C "$PRIMARY" switch "$MAIN"
git -C "$PRIMARY" pull --ff-only origin "$MAIN"
git -C "$PRIMARY" merge --ff-only "$BRANCH"
git -C "$PRIMARY" push origin "$MAIN"
git -C "$PRIMARY" push origin --delete "$BRANCH" 2>/dev/null || true

# Phase 4: ExitWorktree(action="remove", discard_changes=true)
```

Use rebase only when rewriting branch history is acceptable.

## Decision guide

| Situation                             | Best option                                        |
| ------------------------------------- | -------------------------------------------------- |
| Normal Claude Code worktree task      | `--no-ff` merge from primary (default flow above)  |
| Small personal branch, linear history | Rebase variant                                     |
| Experimental detached worktree        | Create a real branch first (see below), then merge |

## Universal rules

- Merge **branches**, not directories.
- Detect the default branch — never hardcode `main` or `master`.
- The worktree must be clean before Phase 2 — the skill never commits or stashes for the user.
- All default-branch operations use `git -C "$PRIMARY"`; do not `git switch "$MAIN"` inside the linked worktree (Git will refuse).
- Delete the remote feature branch (if any) **before** `ExitWorktree`, while the local ref still exists.
- Cleanup happens via one `ExitWorktree(action="remove", discard_changes=true)` call at the end — no separate `git worktree remove` step.

## Detached HEAD case

If the linked worktree was started with `--detach`, create a branch before Phase 2:

```bash
git switch -c feature/recover-work
```

## Recovery

- Stale worktree metadata after manual deletion: `git worktree prune`
- Moved worktree Git can't find: `git worktree repair`

## Team policy (Claude Code)

- One task per worktree branch.
- No direct commits on the default branch from worktree sessions.
- Merge back only after local validation succeeds.
- Delete merged worktrees and branches promptly.
