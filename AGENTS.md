This is a monorepo with TypeScript and C#

# Codebase Map

- `packages/api/` — C# .NET API (Program.cs, Modules, Common, Migrations, SQLite `tsz.db`)
  - `Modules/Animals/` — Animals CRUD
  - `Modules/LeaveTypes/` — LeaveType catalog (CRUD, seeder, UsersDbContext)
  - `Migrations/` — EF migrations for the Animals DbContext
  - `Migrations/Users/` — EF migrations for the Users/LeaveTypes DbContext
- `packages/api.tests/` — C# unit tests for the API
- `packages/api.tests.integration/` — C# integration tests hitting real endpoints
- `packages/web/` — TypeScript/Vite frontend app
  - `src/api/` — API client, generated schema, `animals.ts`, `leave-types.ts`
  - `src/components/` — Shared components (error boundary, theme toggle)
  - `src/components/ui/` — Reusable UI primitives (shadcn-style)
  - `src/lib/` — Client/server auth, theme, utility helpers
  - `src/routes/` — TanStack Router file-based routes (root, login, `_authed/`, `api/`)
    - `_authed/animals/` — Animals list
    - `_authed/admin/leave-types/` — Admin: LeaveType catalog
  - `src/router.tsx` — Router setup; `routeTree.gen.ts` is auto-generated
  - `tests/` — Vitest setup and fetch helpers
  - `public/` — Static assets (favicon, manifest, logos)
- `docs/adr/` — Architecture Decision Records (e.g. `0001-leave-type-catalog.md`)
- `docs/agents/` — Agent-facing conventions (C#, TypeScript, issue tracker, triage, domain)
- `docs/product/` — Product requirements, architecture overview, and `design/` (Euricom design spec)
- `.scratch/` — Per-feature issue markdown files (created lazily)
- `scripts/` — Repo utility scripts (`start.sh` — auto-port launcher; splits into tmux panes when inside tmux)

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