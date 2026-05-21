#!/usr/bin/env bun
/**
 * Stop hook — the *trigger* half of the self-improving AI layer.
 *
 * Reflection on what happened in a session is an LLM call — too slow to block
 * the end of every turn on. The work is split:
 *
 *   * This file (the hook) does the cheap, deterministic part — notice which
 *     CLAUDE.md-governed areas changed and decide whether a reflection is
 *     worth it. "Area" = any directory carrying its own CLAUDE.md, so the hook
 *     follows the CLAUDE.md hierarchy and is not tied to any repo layout.
 *   * `reflect-claude-md.ts` (the reflector) does the LLM call that actually
 *     reflects and proposes concrete CLAUDE.md edits.
 *
 * When something changed, this hook spawns the reflector in the **background**
 * and returns immediately; the reflector writes `.claude/claude-md-review.md`
 * a little after the turn ends.
 *
 * Three guards keep it well-behaved:
 *   * Recursion guard — the reflector spawns a headless `claude` whose own
 *     Stop hook lands right back here; HELPLINE_AILAYER_REFLECT_LOCK makes
 *     that a no-op.
 *   * Dedup — the Stop hook fires every turn but the diff usually has not
 *     changed; a fingerprint of `git diff HEAD` skips re-reflecting on a diff
 *     already handled.
 *   * Fallback — if the reflector is missing the hook simply skips, so an
 *     incomplete install never crashes the session.
 *
 * Tested standalone: `bun scripts/propose-claude-md.ts`
 */

import { createHash } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { type Dirent } from "node:fs";

const EXCLUDE_DIRS = new Set([
  ".git",
  ".venv",
  "venv",
  "env",
  "node_modules",
  "__pycache__",
  ".pytest_cache",
  ".mypy_cache",
  ".ruff_cache",
  "build",
  "dist",
]);
const LOCK_ENV = "HELPLINE_AILAYER_REFLECT_LOCK";
const STATE_FILE = ".claude/.claude-md-review-state";
const REFLECTOR = "reflect-claude-md.ts";

function projectRoot(): string {
  const fromEnv = process.env.CLAUDE_PROJECT_DIR;
  if (fromEnv) return fromEnv;
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, "..");
}

function toPosix(p: string): string {
  return p.split(path.sep).join("/");
}

function git(args: string[], cwd: string): string {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf-8",
    timeout: 5000,
  });
  if (result.error || result.status !== 0) return "";
  return result.stdout;
}

function claudeMdAreas(root: string): Set<string> {
  const areas = new Set<string>();
  const walk = (dir: string) => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    const hasClaudeMd = entries.some(
      (e: Dirent) => e.isFile() && e.name === "CLAUDE.md" || e.name === "AGENTS.md",
    );
    if (hasClaudeMd) {
      const rel = toPosix(path.relative(root, dir));
      if (rel !== "" && rel !== ".") areas.add(rel);
    }
    for (const entry of entries) {
      if (entry.isDirectory() && !EXCLUDE_DIRS.has(entry.name)) {
        walk(path.join(dir, entry.name));
      }
    }
  };
  walk(root);
  return areas;
}

function areaOf(changed: string, areas: Set<string>): string | null {
  const parts = changed.split("/");
  for (let depth = parts.length - 1; depth > 0; depth--) {
    const candidate = parts.slice(0, depth).join("/");
    if (areas.has(candidate)) return candidate;
  }
  return null;
}

function touchedAreas(root: string): Set<string> {
  const governed = claudeMdAreas(root);
  const touched = new Set<string>();
  for (const line of git(["status", "--porcelain"], root).split("\n")) {
    if (line.length <= 3) continue;
    const p = line.slice(3).trim().replace(/\\/g, "/");
    const area = areaOf(p, governed);
    if (area !== null) touched.add(area);
  }
  return touched;
}

function diffFingerprint(root: string, areas: Set<string>): string {
  const sorted = [...areas].sort();
  const raw = git(["diff", "HEAD", "--", ...sorted], root);
  return createHash("sha256").update(raw, "utf-8").digest("hex");
}

function spawnReflector(reflector: string, root: string): boolean {
  try {
    const child = spawn(process.execPath, [reflector], {
      cwd: root,
      stdio: "ignore",
      detached: true,
      env: process.env,
    });
    child.unref();
    return true;
  } catch (exc) {
    process.stderr.write(
      `[self-improving hook] could not start reflector: ${String(exc)}\n`,
    );
    return false;
  }
}

async function drainStdin(): Promise<void> {
  if (process.stdin.isTTY) return;
  await new Promise<void>((resolve) => {
    process.stdin.on("data", () => {});
    process.stdin.on("end", () => resolve());
    process.stdin.on("error", () => resolve());
    setTimeout(resolve, 100);
  });
}

async function main(): Promise<number> {
  await drainStdin();

  // Guard 1 — recursion. A reflection spawns a headless `claude` whose own
  // Stop hook runs this file again. If the lock is set, do nothing.
  if (process.env[LOCK_ENV]) return 0;

  const root = projectRoot();
  const areas = touchedAreas(root);
  if (areas.size === 0) return 0;

  // Guard 2 — dedup. The Stop hook fires every turn; only reflect when the
  // diff itself is new since the last reflection.
  const fingerprint = diffFingerprint(root, areas);
  const statePath = path.join(root, STATE_FILE);
  try {
    if (readFileSync(statePath, "utf-8").trim() === fingerprint) return 0;
  } catch {
    // no prior state — first reflection for this diff
  }

  const reflector = path.join(path.dirname(fileURLToPath(import.meta.url)), REFLECTOR);
  try {
    readFileSync(reflector);
  } catch {

    process.stderr.write(
      `[self-improving hook] ${REFLECTOR} missing — skipped\n`,
    );
    return 0;
  }

  if (!spawnReflector(reflector, root)) return 0;

  // Record the fingerprint so identical follow-up turns do not re-spawn.
  try {
    mkdirSync(path.dirname(statePath), { recursive: true });
    writeFileSync(statePath, fingerprint, "utf-8");
  } catch {
    // best-effort
  }

  const list = [...areas].sort().join(", ");
  process.stderr.write(
    `[self-improving hook] ${areas.size} area(s) changed (${list}) — ` +
      `reflecting in the background → .claude/claude-md-review.md\n`,
  );
  return 0;
}

main().then((code) => process.exit(code));
