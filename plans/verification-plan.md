# Verification Plan — TSZ (Time Tracking & Leave)

Companion to `plans/high-level-plan.md`. Defines how each slice is verified before it's merged into `master`.

## 1. Verification levels

| Level | Tool | Scope |
| --- | --- | --- |
| Unit | `vitest` (web), `xunit`/`dotnet test` (api) | Pure functions, hooks, validators, services with fakes. |
| Integration | `WebApplicationFactory` + SQLite | Endpoint behavior end-to-end inside the API process. |
| Contract | `bun run gen:api` diff + zod parsing | OpenAPI schema is the source of truth; FE types must match. |
| E2E smoke | Playwright (web → api → SQLite) | One happy path per Prio-1 feature. |
| Manual | Browser + dev seed | Sign-off on UX, role gating, hotkeys. |

Anything above unit runs against the dev seeder (admin user from `DEV_ADMIN_OID`, default LeaveTypes).

## 2. Pre-merge gates (per slice)

Every worktree branch must clear all of these before `/git-worktree-merge`:

- `dotnet test` green (unit + integration).
- `bun run test` green.
- `vp check` (web) clean.
- `dotnet format --verify-no-changes` clean.
- `bun run gen:api` committed if API contracts changed.
- One manual smoke pass through the slice's exit criterion (see §4).

## 3. Per-area test catalog

### Auth & `/api/me`
- Unit: `CurrentUserAccessor` resolves `oid` claim; throws when missing.
- Integration: 401 without bearer; 200 + `{user, role, allowances}` with seeded admin token; auto-provisions unknown `oid` as `role=User`.
- Manual: dev login lands on the role-aware shell; admin nav visible.

### Admin CRUD (LeaveTypes, Users, Customers, Contracts)
- Unit: validators reject empty name, bad email, end-date < start-date, duplicate `entraObjectId`.
- Integration: full CRUD round-trip; `RequireRole("Admin")` returns 403 for `role=User`.
- Contract filter: `GET /api/contracts?consultantId=&date=` returns only contracts where `date ∈ [start,end]` and `consultantUserId == consultantId`.
- Manual: list + form for each entity; allowance editor prefills on new user.

### Time Entry
- Unit (api): week-upsert idempotency; `(contractId XOR leaveTypeId)`; `15 ≤ minutes ≤ 480`; Sat/Sun rejected; contract-active check; over-allowance returns warning, not error.
- Unit (web): `useWeekTotals` row/column/grand totals; autosave debounce (500 ms); hotkey map (`d`/`h`/`del`); week-key parsing/formatting.
- Integration: `GET …?weekKey=` then `PUT …/week` round-trip; ETag conflict returns 412 on stale `If-Match`.
- E2E (Playwright): fill a week, blur → autosaved; reload → same values; change row → second `PUT` returns new ETag; open second tab → second save 412s.
- Manual: hotkeys work; Sat/Sun visually muted and read-only; row picker only lists active contracts for the week start.

### Timesheets
- Unit: month aggregate groups per-day + per-contract sums.
- Integration: `GET …?from=&to=` totals equal the sum of underlying entries.
- E2E: click a day in the month view → routes to `/time-entry/$week` with that week loaded.

### Leave Overview
- Unit: year aggregate groups by `leaveTypeId`; balance = allowance − used (unlimited types return `null`).
- Integration: balance reflects entries inserted via `PUT …/week`.
- Manual: over-allowance renders a warning chip; weekend cells styled correctly.

## 4. Slice exit criteria (recap)

Each slice in `plans/high-level-plan.md` §6 is "verified" when:

1. **Foundation** — `GET /api/me` returns the seeded admin; FE shell shows role-aware nav.
2. **Admin: LeaveTypes + Users** — admin can edit `isLimited`/default total; user create prefills current-year allowances; new login auto-provisions.
3. **Admin: Customers** — list searches by name/number; form round-trip persists.
4. **Admin: Contracts** — `/contracts?consultantId=&date=` returns the correct slice for arbitrary dates.
5. **Time Entry** — user fills a week, reloads, sees the same data; second tab gets 412.
6. **Timesheets** — month totals match underlying entries; day click routes to the correct week.
7. **Leave Overview** — year view balance matches allowance − used; over-allowance warns.
8. **Polish / Prio-2** — each backlog item has its own exit criterion when picked up.

## 5. Manual test data

The dev seeder is the single source of fixtures. To exercise a slice manually:

- `DEV_ADMIN_OID` env var ↔ your Entra `oid` so first login lands as Admin.
- Default LeaveTypes seeded (Holiday 20, ADV 5, Sickness unlimited, Ancientiteit 0, Holiday Replacement).
- Create one Customer + one Contract assigned to your user before exercising Time Entry.

## 6. Out of scope (for now)

- Load / performance testing — flag if SQLite write contention shows up in dev.
- Cross-browser matrix — Chromium-only for the Playwright smoke.
- Accessibility audit — defer until Prio-1 UI is stable.
- Security review — pick up once Prio-2 admin impersonation lands.
