# poc-tsz — Codebase Map

A lightweight map of the repo so an agent can find where a feature lives
*before* it starts reading files. Layered: top-level groups first, then the
modules inside each. Keep this current when you add or move a package/module.

## Top level

| Path           | What it is                                                                   |
| -------------- | ---------------------------------------------------------------------------- |
| `packages/`    | The runnable apps (C# API, Vite web) and their test projects.                |
| `docs/`        | Product specs, ADRs, and agent-facing conventions.                           |
| `scripts/`     | Repo utility scripts (`start.sh`, worktree + session helpers).               |
| `.scratch/`    | Per-feature issue markdown files (lazy, see `docs/agents/issue-tracker.md`). |
| `.agents/`     | Skill definitions used by the agent workflow.                                |
| `CONTEXT.md`   | Domain language reference (root entities, terminology).                      |
| `CHANGELOG.md` | Outcome-oriented log; updated before every commit.                           |

## packages/

| Package                 | Entry points                    | Responsibility                                    |
| ----------------------- | ------------------------------- | ------------------------------------------------- |
| `api`                   | `Program.cs`, `Modules/*/`      | C# .NET minimal-API. EF Core + SQLite (`tsz.db`). |
| `api.tests`             | `Modules/*Tests.cs`             | xUnit tests; folder layout mirrors `api/`.        |
| `api.tests.integration` | `*EndpointsTests.cs`            | Black-box tests against the running API.          |
| `web`                   | `src/router.tsx`, `src/routes/` | TanStack Start frontend (Vite + React).           |

## packages/api/

| Path                  | What it is                                                                  |
| --------------------- | --------------------------------------------------------------------------- |
| `Program.cs`          | Host bootstrap, DI, endpoint mapping.                                       |
| `Modules/Animals/`    | Animals feature (Entity, Service, Endpoints, Contracts, Seeder, DbContext). |
| `Modules/LeaveTypes/` | Leave-type catalog (same pattern + `Allowed.cs`).                           |
| `Modules/Users/`      | Users module (scaffolding).                                                 |
| `Common/`             | Cross-cutting bits: `Extensions/`, `Filters/`, `SchemaNameAttribute.cs`.    |
| `Migrations/`         | EF Core migrations + model snapshot.                                        |
| `appsettings*.json`   | Runtime config.                                                             |

Each module follows the same file shape: `<Entity>.cs`, `<Entity>Configuration.cs`,
`<Entity>Contracts.cs`, `<Entity>DbContext.cs`, `<Entity>Endpoints.cs`,
`<Entity>Service.cs`, `<Entity>Seeder.cs`. See `docs/agents/conventions-csharp.md`.

## packages/web/src/

| Path                                    | What it is                                                                            |
| --------------------------------------- | ------------------------------------------------------------------------------------- |
| `router.tsx` / `routeTree.gen.ts`       | Router setup; tree is auto-generated.                                                 |
| `routes/__root.tsx`, `routes/login.tsx` | Shell + login.                                                                        |
| `routes/_authed/`                       | Authenticated area: `index.tsx`, `animals/`, `admin/leave-types/`, `admin/users/`.    |
| `routes/api/auth/$.tsx`                 | Catch-all auth callback route.                                                        |
| `api/`                                  | Client + generated `schema.ts`; per-feature modules (`animals.ts`, `leave-types.ts`). |
| `components/`                           | Shared app components (error boundary, theme toggle, data table).                     |
| `components/ui/`                        | shadcn primitives only — do not add custom components here.                           |
| `lib/`                                  | `auth-client.ts`, `auth.server.ts`, `theme.ts`, `utils.ts`.                           |
| `server.ts`, `env.server.ts`            | Server entry + env loading.                                                           |

Edit forms for root entities live in their own `$id.tsx` route (not in a modal).

## docs/

| Path       | What it is                                                                                                                         |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `adr/`     | Architecture Decision Records (`0001-leave-type-catalog.md`, …).                                                                   |
| `agents/`  | Conventions (`conventions-csharp.md`, `conventions-typescript.md`), issue tracker, triage labels, domain notes, coding guidelines. |
| `product/` | `requirements.md`, `architecture.md`, design assets.                                                                               |

## Finding a feature

- **An HTTP endpoint** → `packages/api/Modules/<Feature>/<Feature>Endpoints.cs`.
- **Domain rules / persistence** → `<Feature>Service.cs` + `<Feature>Configuration.cs`.
- **Request/response shape** → `<Feature>Contracts.cs` (server) and `packages/web/src/api/schema.ts` (client). 
- **A UI screen** → `packages/web/src/routes/_authed/.../index.tsx` (list) or `$id.tsx` (edit).
- **Calls from the web to the API** → `packages/web/src/api/<feature>.ts`.
- **Auth flow** → `packages/web/src/lib/auth*.ts` + `routes/api/auth/$.tsx`.
- **Domain terminology** → `CONTEXT.md`. **Why we did X** → `docs/adr/`.
