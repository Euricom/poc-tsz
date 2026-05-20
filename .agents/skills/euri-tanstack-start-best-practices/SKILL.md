---
name: tanstack-start-best-practices
description: React and TanStack Start performance optimization guidelines. This skill should be used when writing, reviewing, or refactoring React/Tanstack Start code to ensure optimal performance patterns. Triggers on tasks involving React components, Tanstack Start routes, data fetching, bundle optimization, or performance improvements.
license: MIT
metadata:
  author: euricom
  version: "0.0.1"
  state: wip
---

# Tanstack Start Best Practices

Comprehensive performance optimization guide for React and TanStack Start applications, maintained by Euricom. Contains rules across multiple categories, prioritized by impact to guide automated refactoring and code generation.

## When to Apply

Reference these guidelines when:
- Writing new React components or Tanstack Start routes
- Implementing data fetching (client or server-side)
- Reviewing code for performance issues
- Refactoring existing React/Tanstack Start code
- Optimizing bundle size or load times

## Quick Reference

### 5. Re-render Optimization (MEDIUM)

- `rerender-memo` - Extract expensive work into memoized components

## How to Use

Read individual rule files for detailed explanations and code examples:

```
rules/async-parallel.md
rules/bundle-barrel-imports.md
```

Each rule file contains:
- Brief explanation of why it matters
- Incorrect code example with explanation
- Correct code example with explanation
- Additional context and references