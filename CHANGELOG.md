# Changelog

## 2026-05-15

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
