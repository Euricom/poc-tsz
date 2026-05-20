---
name: typespec-contract
description: >
  Model REST API contracts using TypeSpec notation. Use this skill whenever you are designing,
  planning, or documenting API contracts — in PRDs, issues, implementation plans, or any API
  contract work. Apply it proactively any time an endpoint, route, HTTP verb, request body,
  response shape, or status code is being defined or discussed, even if the user has not
  explicitly asked for TypeSpec. This skill should trigger automatically during PRD writing,
  issue creation, feature planning, or architecture discussions that involve a REST API.
user-invocable: false
metadata:
  state: in-review
---

# TypeSpec REST Contract

When a feature involves new or modified REST endpoints, define the API contract using TypeSpec notation. TypeSpec is used here as a **modeling language only** — no compilation is required. Write it as a `typespec` code block.

For full TypeSpec syntax, types, decorators, and patterns — read `references/typespec-notation.md`.

## What to focus on

- Resource names and namespace grouping
- HTTP verbs (`@get`, `@post`, `@put`, `@delete`, `@patch`)
- Route params (`@path`), query params (`@query`), request bodies (`@body`)
- Response shapes and status codes
- Keep models minimal — only the fields the feature actually needs

## Example

```typespec
@route("/leave-types")
namespace LeaveTypes {
  @get op list(): LeaveType[];
  @post op create(@body body: CreateLeaveTypeRequest): LeaveType;

  @route("/{id}") {
    @get op get(@path id: string): LeaveType;
    @put op update(@path id: string, @body body: UpdateLeaveTypeRequest): LeaveType;
    @delete op delete(@path id: string): void;
  }
}

model LeaveType {
  id: string;
  name: string;
  color: string;
  defaultTotalDays: int32;
}

model CreateLeaveTypeRequest {
  name: string;
  color: string;
  defaultTotalDays: int32;
}

model UpdateLeaveTypeRequest {
  name?: string;
  color?: string;
  defaultTotalDays?: int32;
}
```

## Where the contract lives

In a PRD or issue, put the TypeSpec block under a `## REST API Contract` section. This becomes the shared source of truth for both the frontend and backend implementation — both sides implement against this contract rather than against each other.
