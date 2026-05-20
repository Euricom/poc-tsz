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

If there is no TypeSpec contract (pure UI work, refactor, bug fix), work through the plan step by step in a single pass/agent.

Otherwise, use it as the shared source of truth and spawn an 3 agent team to implement the backend and frontend in parallel.

- First one will implement the backend, implemening the endpoints defined in the contract; route paths, verbs, request/response shapes, and status codes must match exactly. After implementation run the following validation steps:

```bash
bun run test:api  # runs backend unit tests
bun run test:api:int # runs backend integration tests
```

- Second one will implement the frontend, implement the API client calls and UI using the TypeSpec types directly — do not wait for the BE to emit an OpenAPI spec. Update the src/api/schema.ts file with future types. After implementation run the following validation steps:

```bash
bun run check     # static analysis of Typescript code with linting, typechecking, and formatting
bun run test:web  # runs frontend unit tests
```

- Third one will wait for the backend and frontend to be implemented, then generate the schema.ts again from the open api spec and validate the types are still correct. When there are type errors, see if the backend or the frontend is wrong and fix it by instructing the other agents to fix it. 

```bash
# generate the schema.ts file from the open api spec
bun run gen:api

# validate again the types are correct
bun run check
```

### 3. Simplify

Run `Skill('simplify')` to simplify the code.

Run the validation loops again and fix any issues. Repeat until all pass cleanly.

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
  - ✓ "Admins can view all users and create new ones via an Add dialog"
  - ✓ "Creating a user automatically assigns a leave balance for each active leave type"
  - ✗ "Added UserService.CreateAsync with single SaveChangesAsync and 10 unit tests"
- commit the work. Run `Skill('git-commit')` to commit the work.

### 5. Report QA

Write a list of items the user should test to verify the work.
