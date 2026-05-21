# TypeScript Guidelines

**General guidelines:**
- Make sure the follow the base coding guidelines in `docs/agents/coding-guidelines.md`

**TypeScript specific guidelines:**

- Use strict TypeScript
- Avoid using `any`
- Prefer `unknown` for untrusted input, then narrow with guards or schemas
- After TypeScript changes, run `bun check` and fix all errors
