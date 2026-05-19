This is a monorepo with TypeScript and C#

# Codebase Map

- `packages/api/` — C# .NET API (Program.cs, Modules, Common, Migrations, SQLite `tsz.db`)
- `packages/api.tests/` — C# unit tests for the API
- `packages/api.tests.integration/` — C# integration tests hitting real endpoints
- `packages/web/` — TypeScript/Vite frontend app
  - `src/api/` — API client, generated schema, animals endpoint module
  - `src/components/` — Shared components (error boundary, theme toggle)
  - `src/components/ui/` — Reusable UI primitives (shadcn-style)
  - `src/lib/` — Client/server auth, theme, utility helpers
  - `src/routes/` — TanStack Router file-based routes (root, login, `_authed/`, `api/`)
  - `src/router.tsx` — Router setup; `routeTree.gen.ts` is auto-generated
  - `tests/` — Vitest setup and fetch helpers
  - `public/` — Static assets (favicon, manifest, logos)
- `docs/adr/` — Architecture Decision Records
- `docs/agents/` — Agent-facing conventions (C#, TypeScript, issue tracker, triage, domain)
- `docs/product/` — Product requirements and architecture overview
- `.scratch/` — Per-feature issue markdown files (created lazily)
- `scripts/` — Repo utility scripts (e.g. `start.sh` launcher)

# Important Notes

- The monorepo is powered by bun, do not use npm or pnpm
- For C# conventions, see `docs/agents/conventions-csharp.md`
- For TypeScript conventions, see `docs/agents/conventions-typescript.md`
- When reporting information to me, be extremely concise and sacrifice grammar for the sake of concision.
- Before committing, update the CHANGELOG.md file with the changes made. Use an outcome-oriented summary not the iteration steps.

## Agent skills

### Issue tracker

Issues live as markdown files under `.scratch/<feature-slug>/` in this repo. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical label vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: `CONTEXT.md` and `docs/adr/` at the repo root (created lazily). See `docs/agents/domain.md`.
