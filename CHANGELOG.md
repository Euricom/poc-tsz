# Changelog

## 2026-05-19

- chore(agents): add `do-work` and `do-work-tdd` skills that drive a unit of work end-to-end (plan → implement → validate via `bun run check`/`test:web`/`test:api` → CHANGELOG update → commit); `do-work-tdd` adds red/green/refactor for backend code
- chore(agents): mark `matt-zoom-out` skill state as `research`
- chore(build): rename root `test` script to `test:web` so `bun run test:web` runs frontend unit tests; `test:api` still runs backend tests

## 2026-05-18

- refactor(web): centralize env vars in `src/env.ts` — Zod schema validates `SERVER_URL`, `APP_BASE_URL`, `AUTH_TENANT_ID`, `AUTH_CLIENT_ID`, `AUTH_CLIENT_SECRET`, `AUTH_SECRET` at startup; `auth.server.ts` and `api/client.ts` replaced all `process.env.*` references with typed `env.*` imports; removed intermediate constant aliases in `auth.server.ts` so `env.*` is used directly at each call site

## 2026-05-16

- feat(user-mgmt): implement LeaveType catalog (slice 01) — admins can list, create, edit, and archive leave types at `/admin/leave-types`; each type carries a name, Limited/Unlimited mode, optional day quota, and a hex color shown as a swatch in the table; soft-delete (archive) never hard-deletes rows; `UsersDbContext` runs migrations into `__EFMigrationsHistory_Users` and seeds four defaults (Verlof 20d, ADV 5d, Anciënniteit 0d, Ziekte unlimited) on first run; case-insensitive name uniqueness enforced by a SQLite `COLLATE NOCASE` filtered index and checked at the service layer with a 409 response; 9 unit tests and 12 integration tests covering all CRUD paths, auth boundary, soft-delete, and filtering by archived state; frontend add/edit modal with color picker (native + hex text input kept in sync) and show-archived toggle

- docs(design): add Euricom design system spec at `docs/product/design/DESIGN.md` — color tokens (deep teal `#014046` + electric lime `#00FF00`), Montserrat typography scale, and component patterns for use when building UI

## 2026-05-15

- docs(user-mgmt): put slice 04 (UserLeave row editing) on hold — moved from `ready-for-agent` to `needs-triage` pending maintainer approval
- docs(user-mgmt): add `Color` to the `LeaveType` catalog (7-char hex, required) across ADR 0001, `CONTEXT.md`, the PRD, and slice 01 — UI surfaces project the color through the `LeaveType` relationship; seeded defaults get concrete hex values; admin form gains a color picker
- docs(user-mgmt): add PRD for user management (User + LeaveType catalog + per-user-per-year UserLeave with backfill), repo-root `CONTEXT.md` glossary, and ADR 0001 capturing the global-catalog-vs-free-text-name decision
- docs(agents): add codebase map to root `AGENTS.md` listing every important folder with a one-line description (including a nested breakdown of `packages/web/src`)
- chore(agents): fix `git-worktree-merge` skill frontmatter — replace unsupported `invocation: user-only` with `disable-model-invocation: true`
- feat(web): add reusable `DataTable<T>` component on top of `@tanstack/react-table` with controlled multi-column sort (`name,-age` string format, compatible with `sort-on`), single/multi row selection, row-click handler, loading skeleton and empty state; refactor `/animals` route to sort via `sort-on`
- chore: ignore Claude Code `worktrees/` directories in `.gitignore`
- feat(dev): add `scripts/start.sh` launcher that runs web + api together with auto-assigned ports (web 3000-3005, api random 5200-5999) and forwards `SERVER_URL` to the web process
- feat(api): print API URL banner on startup so it surfaces in the dev launcher output
- chore(agents): add `start-app` skill that runs the launcher via a Monitor task and reports the Web/API URLs
- chore(vscode): add `.claude/launch.json` debug configurations for web and api
- docs(plans): remove high-level plan (moved to issue tracker)

## 2026-05-13

- docs(plans): trim high-level plan back to delivery overview — drop phase-by-phase detail and pre-merge checklist, keep the 8-slice list
- docs(plans): add high-level implementation plan for TSZ app (domain model, REST API, FE layout, 8-slice delivery order, risks)
- refactor(web/auth): replace better-auth with Auth.js (`@auth/core`); sessions are now stateless JWE cookies, removing the shared SQLite dependency and the one-time `better-auth migrate` step from the web app
- chore(web/auth): rename `AUTH_COOKIE_SECRET` → `AUTH_SECRET`, drop `AUTH_DB_URL`; Azure redirect URI moves from `/api/auth/callback/microsoft` to `/api/auth/callback/microsoft-entra-id`

## 2026-05-12

- refactor(api): move DB config to env-driven `App__DatabaseUrl` with universal `DatabaseUrl.ToSqliteConnectionString` converter (accepts `file:`, `sqlite:`, bare paths, and native `Data Source=...` connection strings)
- refactor(api): rename auth config prefix `AzureAd:` → `Auth:` for consistency with `Auth:Disabled`
- chore(web/auth): rename requested API scope from `api` to `access_as_user` (Microsoft delegated-scope convention); requires matching rename in the Entra app registration
- chore(web/auth): rename `AUTH_DB_PATH` → `AUTH_DB_URL` (Prisma-style `file:` URL convention)

## 2026-05-11

- refactor(api): slim `Program.cs` by extracting JWT auth, OpenAPI schema, and DB seed into `Common/Extensions` + module helpers
- feat(api/auth): validate Entra-issued JWT bearer tokens on `/api/animals`; config via `.env` (DotNetEnv) with `AzureAd__TenantId`/`AzureAd__ClientId`; `Auth__Disabled=true` for local bypass
- feat(web/auth): request the API scope at sign-in and forward the Microsoft access token on every API call from the BFF
- feat(web/auth): add FE auth layout — Microsoft OAuth2 login page, protected route guard, better-auth wired into routes/deps/docs
- feat(web/auth): persist sessions/accounts/verification to SQLite via better-sqlite3
- fix(web/theme): move theme to SSR-readable cookie; remove hydration mismatch on `<html>`

## 2026-05-10

- test(api): add ValidationFilter unit tests and root `test` script
- refactor(animals): extract AnimalForm and schema with unit tests
- feat(animals-api): implement CRUD operations for animals and add tests

## 2026-05-08

- refactor(README): update content to reflect new POC Timesheet Zone and remove outdated sections
- chore(agents): consolidate skills under `.agents` and adopt AGENTS.md
- chore: initial content
