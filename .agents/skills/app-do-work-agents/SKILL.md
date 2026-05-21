---
name: do-work-contract-first
description: Execute a unit of work end-to-end: plan, implement, validate with typecheck and tests, then commit. Use when user wants to do work, build a feature, fix a bug, or implement a phase from a plan.
argument-hint: '[issue-file] [--skip-commit] — path to an issue markdown file. Pass --skip-commit to skip CHANGELOG.md update and git commit.'
disable-model-invocation: true
license: MIT
metadata:
  author: euricom
  version: "0.0.2"
---

# Do Work

Execute a complete unit of work: build it, validate it, commit it.

## Workflow

### 1. Understand the task

If an issue file was passed as an argument, read it first — it is the source of truth for scope, acceptance criteria, and any references. Otherwise, abort the skill and ask the user to provide an issue file.

Then explore the codebase to understand the relevant files, patterns, and conventions. Delegate codebase exploration beyond ~3 greps to the built-in `Explore` agent to keep context light.

If the task is ambiguous, ask the user to clarify scope before proceeding.

### 2. Implement & validate

#### Decide the execution mode first

- **No API changes** (pure UI work, refactor, bug fix, internal-only changes) → work through the plan step by step in a **single pass**, no agent team.

- **API changes involved** (new/changed endpoints, request/response shapes, status codes) → these must be specified in a TypeSpec contract, which becomes the shared source of truth. Spawn a **3-agent team** (sonnet, high effort) to implement backend and frontend in parallel, then reconcile.

#### Parallel agent team (contract-first path)

Spin up an Agent Team with `TeamCreate`, 3 agents (Backend, Frontend, Contract Reconciliation). Brief each with the issue file, the TypeSpec contract path, and the role below.

**Agent A — Backend**

- Implement the endpoints defined in the contract. Route paths, HTTP verbs, request/response shapes, and status codes **must match the contract exactly**.
- Validate before reporting done:

```bash
bun run test:api      # backend unit tests
bun run test:api:int  # backend integration tests
```

**Agent B — Frontend**

- Implement the API client calls and UI using the TypeSpec types directly. Do not wait for the backend's OpenAPI spec.
- Hand-write the expected types in src/api/schema.ts from the TypeSpec contract so the UI can compile in parallel. Agent C will overwrite this file later.
- Validate before reporting done:

```bash
bun run check     # lint, typecheck, format
bun run test:web  # frontend unit tests
```

**Agent C — Contract reconciliation**

- Wait until both Agent A and Agent B report done.
- Regenerate src/api/schema.ts from the backend's OpenAPI spec, then re-validate:

```bash
bun run gen:api   # regenerate schema.ts from runtime OpenAPI spec (API)
bun run check     # confirm types still align
```

- If check fails, diagnose which side drifted from the contract:
  - Backend wrong → send Agent A a fix instruction citing the specific mismatch.
  - Frontend wrong → send Agent B a fix instruction citing the specific mismatch.
  - Re-run gen:api + check after each round. Loop until clean.

### 3. Simplify

Run `Skill('code-review')` to simplify the code. Use the high effort.

Then run the validation loops again and fix any issues. Repeat until all pass cleanly.

```bash
bun run check     # static analysis of Typescript code with linting, typechecking, and formatting
bun run test:web  # runs frontend unit tests
bun run test:api  # runs backend unit tests
bun run test:api:int # runs backend integration tests
```

### 5. Commit

Skip this step entirely if `--skip-commit` was passed as an argument.

Once static analysis and tests pass:

- Update `CHANGELOG.md` under today's date with functional, user-facing bullet points. Each bullet answers "what can a user now do?" or "what behavior changed?" — not "what was built". No class/method names, no test counts, no migration names. Example:
  - ✅ "Admins can view all users and create new ones via an Add dialog"
  - ✅ "Creating a user automatically assigns a leave balance for each active leave type"
  - ❌ "Added UserService.CreateAsync with single SaveChangesAsync and 10 unit tests"
- commit the work. Run `Skill('git-commit')` to commit the work.

### 5. Reporting

After the work is committed (or skipped via `--skip-commit`), report back to the user with two sections:

**QA checklist** — concrete, user-facing items the user should manually verify. One bullet per behavior, phrased as an action the user takes:
- ✅ "Log in as admin → open Users page → click Add → submit form → new user appears in list"
- ❌ "Verify UserService works"

**Lessons for CLAUDE.md** — surprises, gotchas, or conventions discovered during the work that future runs should know. Keep each point tight and rule-shaped:
- A missing convention you had to infer (e.g. "API error responses use `{ code, message }`, not RFC 7807")
- A pattern that wasted time and shouldn't next time
- A non-obvious constraint in the codebase
- Adjustments or simplifications performed with `/code-review`
Make each item brief and precise. Focus on guidance a future agent should apply to prevent repeated errors or wasted time.
 
