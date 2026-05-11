# Changelog

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
