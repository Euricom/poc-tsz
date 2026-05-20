# TypeScript Guidelines

**General guidelines:**
- Make sure the follow the base coding guidelines in `docs/agents/coding-guidelines.md`

**TypeScript specific guidelines:**

- Use strict TypeScript
- Avoid using `any`
- Prefer `unknown` for untrusted input, then narrow with guards or schemas
- After TypeScript changes, run `bun check` and fix all errors

## ReactRouting

- Create and edit forms for root entities (e.g. User, Animal, LeaveType) must live in dedicated routes (`new.tsx` for create, `$id.tsx` for edit), not modals on the list page.
