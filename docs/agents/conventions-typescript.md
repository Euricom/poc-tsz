# TypeScript Guidelines

- Use strict TypeScript
- Avoid using `any`
- Prefer `unknown` for untrusted input, then narrow with guards or schemas
- After TypeScript changes, run `bun check` and fix all errors

## Routing

- Create and edit forms for root entities (e.g. User, Animal, LeaveType) must live in dedicated routes (`new.tsx` for create, `$id.tsx` for edit), not modals on the list page.
