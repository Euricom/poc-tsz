#!/usr/bin/env bun
/**
 * SessionStart hook — dynamic per-module orientation.
 *
 * Prints a short orientation block at the start of every Claude Code session.
 * Claude Code injects this stdout into the session context, so Claude starts
 * already knowing which part of the codebase has active work — and the recent
 * direction of travel from git history — without spending a turn re-exploring.
 *
 * Tested standalone: `bun scripts/session-start-context.ts`
 */

import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

function projectRoot(): string {
  const fromEnv = process.env.CLAUDE_PROJECT_DIR;
  if (fromEnv) return fromEnv;
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, "..");
}

function toPosix(p: string): string {
  return p.split(path.sep).join("/");
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
      (e) => e.isFile() && e.name === "CLAUDE.md",
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

function workingTreeChanges(): string[] {
  const result = spawnSync("git", ["status", "--porcelain"], {
    encoding: "utf-8",
    timeout: 5000,
  });
  if (result.error || result.status !== 0) return [];
  const paths: string[] = [];
  for (const line of result.stdout.split("\n")) {
    if (line.length > 3) {
      paths.push(line.slice(3).trim().replace(/\\/g, "/"));
    }
  }
  return paths;
}

function activeAreas(root: string, paths: string[]): string[] {
  const governed = claudeMdAreas(root);
  const found = new Set<string>();
  for (const p of paths) {
    const area = areaOf(p, governed);
    if (area !== null) found.add(area);
  }
  return [...found].sort();
}

function recentCommits(limit = 5): string[] {
  const result = spawnSync(
    "git",
    ["log", `-${limit}`, "--pretty=format:%h %s"],
    { encoding: "utf-8", timeout: 5000 },
  );
  if (result.error || result.status !== 0) return [];
  return result.stdout
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

async function drainStdin(): Promise<void> {
  if (process.stdin.isTTY) return;
  await new Promise<void>((resolve) => {
    process.stdin.on("data", () => {});
    process.stdin.on("end", () => resolve());
    process.stdin.on("error", () => resolve());
    // Safety: don't hang forever if no EOF arrives.
    setTimeout(resolve, 100);
  });
}

async function main(): Promise<void> {
  await drainStdin();

  const lines: string[] = ["## Helpline — session orientation", ""];
  const changes = workingTreeChanges();
  const areas = activeAreas(projectRoot(), changes);

  if (areas.length > 0) {
    lines.push(`Active area(s) this session: **${areas.join(", ")}**.`);
    lines.push("Load the matching `CLAUDE.md` in each before editing.");
  } else {
    lines.push("Working tree is clean — no area has pending work.");
  }

  const commits = recentCommits();
  if (commits.length > 0) {
    lines.push("");
    lines.push("Recent commits (newest first):");
    for (const commit of commits) lines.push(`- ${commit}`);
  }

  lines.push("");
  lines.push(
    "Use `CODEBASE_MAP.md` to find where a feature lives before exploring.",
  );
  process.stdout.write(lines.join("\n") + "\n");
}

main();
