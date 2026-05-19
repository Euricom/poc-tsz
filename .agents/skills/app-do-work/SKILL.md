---
name: do-work
description: Execute a unit of work end-to-end: plan, implement, validate with typecheck and tests, then commit. Use when user wants to do work, build a feature, fix a bug, or implement a phase from a plan.
argument-hint: '[issue-file] — path to an issue markdown file.'
disable-model-invocation: true
---

# Do Work

Execute a complete unit of work: plan it, build it, validate it, commit it.

## Workflow

### 1. Understand the task

If an issue file was passed as an argument, read it first — it is the source of truth for scope, acceptance criteria, and any references. Otherwise, read any referenced plan or PRD. Explore the codebase to understand the relevant files, patterns, and conventions. If the task is ambiguous, ask the user to clarify scope before proceeding.

### 2. Plan the implementation (optional)

If the task has not already been planned, create a plan for it. Suggest to the user to start a grill session to plan the work.

### 2. Implement

Work through the plan step by step.

### 4. Validate

Run the feedback loops and fix any issues. Repeat until all pass cleanly.

```bash
bun run check     # static analysis of Typescript code with linting, typechecking, and formatting
bun run test:web  # runs frontend unit tests
bun run test:api  # runs backend unit tests
```

### 5. Commit

Once static analysis and tests pass

- summarize changes in CHANGELOG.md as single-line, outcome-focused entries.
- commit the work. Run `Skill('git-commit')` to commit the work.
