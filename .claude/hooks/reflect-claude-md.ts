#!/usr/bin/env bun
/**
 * Reflector — the *reasoning* half of the self-improving Stop hook.
 *
 * `propose-claude-md.ts` (the hook) does the cheap, deterministic part: notice
 * that something changed. This file does the expensive part:
 *
 *     A Stop hook can reflect on what happened during a session and propose
 *     CLAUDE.md updates while the context is fresh.
 *
 * It gathers the session's working-tree diff plus the current CLAUDE.md of
 * every area that changed, asks Claude (headless `claude -p`) to judge whether
 * those conventions still hold, and writes the proposal to
 * `.claude/claude-md-review.md`.
 *
 * Because it makes an LLM call (slow), the hook spawns this in the background.
 * It can also be run directly for a synchronous reflection:
 *
 *     bun scripts/reflect-claude-md.ts
 *
 * Two safety properties:
 *   * Recursion guard — the headless `claude` it spawns would fire its own
 *     Stop hook, which would spawn another reflection, forever. The `claude`
 *     child is launched with HELPLINE_AILAYER_REFLECT_LOCK=1; both this file
 *     and the hook no-op when that variable is set.
 *   * Graceful fallback — if the `claude` CLI is missing or the call fails,
 *     it writes a deterministic "re-check these files" note instead, so the
 *     AI layer still flags drift without the model.
 */

import { spawnSync } from "node:child_process";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inspect } from "node:util";
import type { Dirent } from "node:fs";

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
const REVIEW_FILE = ".claude/claude-md-review.md";
const LOG_FILE = ".claude/reflect.log";
const LOCK_ENV = "HELPLINE_AILAYER_REFLECT_LOCK";
const MAX_DIFF_CHARS = 12_000;
const CLAUDE_TIMEOUT_MS = 180_000;
const LOG = true;

let logPath: string | null = null;
function log(...args: unknown[]): void {
  if (!LOG) return;

  if (!logPath) {
    logPath = path.join(projectRoot(), LOG_FILE);
    try {
      mkdirSync(path.dirname(logPath), { recursive: true });
    } catch {
      // best-effort
    }
  }
  const line =
    `[${isoTimestamp()}] ` +
    args
      .map((a) => (typeof a === "string" ? a : inspect(a, { depth: 4 })))
      .join(" ") +
    "\n";
  try {
    appendFileSync(logPath, line, "utf-8");
  } catch {
    // best-effort — never let logging crash the reflector
  }
}

function projectRoot(): string {
  const fromEnv = process.env.CLAUDE_PROJECT_DIR;
  if (fromEnv) return fromEnv;
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, "..");
}

function toPosix(p: string): string {
  return p.split(path.sep).join("/");
}

function git(args: string[], cwd: string, timeoutMs = 10_000): string {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf-8",
    timeout: timeoutMs,
  });
  log("git", args);
  if (result.error || result.status !== 0) return "";
  return result.stdout;
}

function changedPaths(root: string): string[] {
  const out: string[] = [];
  for (const line of git(["status", "--porcelain"], root).split("\n")) {
    if (line.length > 3) out.push(line.slice(3).trim().replace(/\\/g, "/"));
  }
  return out;
}

function claudeMdAreas(root: string): Set<string> {
  const areas = new Set<string>();
  const walk = (dir: string) => {
    let entries: Dirent[];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    const hasClaudeMd = entries.some(
      (e: Dirent) => e.isFile() && (e.name === "CLAUDE.md" || e.name === "AGENTS.md"),
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

function touchedAreas(root: string): Map<string, number> {
  const governed = claudeMdAreas(root);
  const counts = new Map<string, number>();
  for (const p of changedPaths(root)) {
    const area = areaOf(p, governed);
    if (area !== null) counts.set(area, (counts.get(area) ?? 0) + 1);
  }
  return counts;
}

function readClaudeMd(root: string, area: string): string {
  const file = path.join(root, area, "CLAUDE.md");
  try {
    return readFileSync(file, "utf-8");
  } catch {
    return "(this area has no CLAUDE.md yet)";
  }
}

function buildPrompt(
  root: string,
  areas: Map<string, number>,
  diff: string,
): string {
  const blocks: string[] = [];
  for (const area of [...areas.keys()].sort()) {
    blocks.push(`### ${area}/CLAUDE.md\n\n${readClaudeMd(root, area)}`);
  }
  const current = blocks.join("\n\n");

  return `You are auditing whether a codebase's CLAUDE.md files still match \
reality after a coding session. CLAUDE.md is the instruction file an AI coding \
agent loads for that part of the repo.

Below is the git diff of the session's uncommitted changes, then the current \
CLAUDE.md for every area that changed.

For EACH area, output exactly one of:
- \`No change needed\` — the CLAUDE.md still holds; or
- a concrete proposed edit: the specific line(s) to add, change, or remove, \
plus one sentence on why.

Only propose an update when the diff introduces a genuine new convention, \
gotcha, command, or constraint that the CLAUDE.md does not yet capture. Do not \
propose stylistic rewrites. Be terse. Respond in plain text; do not use tools.

## Git diff (uncommitted work this session)

\`\`\`diff
${diff}
\`\`\`

## Current CLAUDE.md file(s)

${current}
`;
}

function which(cmd: string): string | null {
  const probe = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(probe, [cmd], { encoding: "utf-8" });
  if (result.error || result.status !== 0) return null;
  const first = result.stdout.split("\n")[0]?.trim();
  return first ? first : null;
}

function runClaude(prompt: string, root: string): string | null {
  const claude = which("claude");
  const args = [
    "-p",
    "--output-format",
    "text",
    "--allowedTools",
    '["Read", "Bash"]',
  ];

  if (!claude) return null;

  log("runClaude argv:", inspect([claude, prompt, ...args], { compact: true }));

  const env = { ...process.env, [LOCK_ENV]: "1" };
  const result = spawnSync(claude, args, {
    cwd: root,
    input: prompt,
    encoding: "utf-8",
    timeout: CLAUDE_TIMEOUT_MS,
    env,
  });
  log("runClaude result", result);
  if (result.error || result.status !== 0) return null;
  const text = (result.stdout ?? "").trim();
  return text.length > 0 ? text : null;
}

function deterministicNote(
  root: string,
  areas: Map<string, number>,
  stamp: string,
): string {
  const lines: string[] = [
    `# CLAUDE.md review — ${stamp}`,
    "",
    "_`claude` CLI unavailable — deterministic fallback. The areas below " +
      "changed this session; re-check their CLAUDE.md by hand._",
    "",
  ];
  for (const area of [...areas.keys()].sort()) {
    const count = areas.get(area) ?? 0;
    const exists = existsSync(path.join(root, area, "CLAUDE.md"));
    if (exists) {
      lines.push(
        `- **${area}** (${count} file(s)) — re-read \`${area}/CLAUDE.md\`: ` +
          `do its conventions still hold?`,
      );
    } else {
      lines.push(
        `- **${area}** (${count} file(s)) — no \`${area}/CLAUDE.md\` exists; ` +
          `consider adding one.`,
      );
    }
  }
  return lines.join("\n") + "\n";
}

function isoTimestamp(): string {
  // Seconds-precision local timestamp, matching Python `datetime.now().isoformat(timespec="seconds")`.
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

function reflect(): number {
  log("Reflecting....", Date.now().toString());

  // Recursion guard: if we are already inside a reflection-spawned `claude`,
  // do nothing — this stops the Stop hook from looping forever.
  if (process.env[LOCK_ENV]) return 0;

  const root = projectRoot();
  const areas = touchedAreas(root);
  if (areas.size === 0) return 0;

  // Scope the diff to the touched areas — a whole-repo `git diff` would drown
  // the change in unrelated noise (and blow the truncation budget).
  const sorted = [...areas.keys()].sort();
  let diff = git(["diff", "HEAD", "--", ...sorted], root);
  if (diff.length > MAX_DIFF_CHARS) {
    diff = diff.slice(0, MAX_DIFF_CHARS) + "\n... (diff truncated for the reflection)";
  }

  const stamp = isoTimestamp();
  const reflection = diff.trim()
    ? runClaude(buildPrompt(root, areas, diff), root)
    : null;
  
    
    let body: string;
    let mode: string;
    if (reflection) {
      body =
      `# CLAUDE.md review — ${stamp}\n\n` +
      `_Reflection by \`claude -p\` over ${areas.size} touched area(s): ` +
      `${sorted.join(", ")}._\n\n` +
      `${reflection}\n`;
      mode = "LLM reflection";
      log("Reflection:", body);
  } else {
    body = deterministicNote(root, areas, stamp);
    mode = "deterministic fallback";
    log("deterministic fallback:", body);
  }

  const review = path.join(root, REVIEW_FILE);

  log("write: ", REVIEW_FILE);
  try {
    mkdirSync(path.dirname(review), { recursive: true });
    writeFileSync(review, body, "utf-8");
  } catch (exc) {
    process.stderr.write(
      `[reflector] could not write ${REVIEW_FILE}: ${String(exc)}\n`,
    );
    return 1;
  }

  process.stderr.write(`[reflector] wrote ${REVIEW_FILE} (${mode})\n`);
  return 0;
}

process.exit(reflect());
