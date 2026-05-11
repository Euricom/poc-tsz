# Changelog

## 2026-05-11

- refactor(web/auth): move sessions/accounts/verification to shared SQLite at `<root>/db/tsz.db`; disable cookie cache to avoid 4-chunk session cookie
- refactor(api): point EF Core at the shared `<root>/db/tsz.db` so the C# API and better-auth share one DB

## 2026-05-10

- fix(web/theme): move theme to SSR-readable cookie; remove hydration mismatch on `<html>`
- feat(web/auth): Microsoft OAuth2 login via better-auth (stateless cookies, guard layout, debug hooks)
- test(api): add ValidationFilter unit tests and root `test` script
- refactor(animals): extract AnimalForm and schema with unit tests
- feat(animals-api): implement CRUD operations for animals and add tests

## 2026-05-08

- refactor(README): update content to reflect new POC Timesheet Zone and remove outdated sections
- chore(agents): consolidate skills under `.agents` and adopt AGENTS.md
- chore: initial content
