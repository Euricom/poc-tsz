# High-Level Implementation Plan — TSZ (Time Tracking & Leave)

Sources: `docs/product/requirements.md`, `docs/product/architecture.md`.
Current skeleton: TanStack Start web (Auth.js + Entra ID via `lib/auth.server.ts`) + .NET 10 minimal-API with EF Core/SQLite, plus an `Animals` reference module showing the per-module folder pattern.

## 1. Scope

Prio-1 target: **Login → Time Entry → Timesheets → Leave Overview**, supported by admin CRUD for **Customers, Contracts, Users (+ leave allowances)** and seeded **Leave Types**.
Prio-2 (week submit/approval, school+work holidays via openholidaysapi, client-manager assignment, per-task rates/day-rate, role impersonation) is deferred but the data model leaves room.

## 2. Domain model (.NET / EF Core is source of truth)

Single bounded context **TimeTracking**, one DB, one `TszDbContext` (replaces `AnimalDbContext`) for FK integrity.

Entities (Prio-1 in **bold**, Prio-2 italic):

- **User** — id, entraObjectId (oid claim), name, email, role (`Admin|User|ClientManager`), active.
- **LeaveType** — id, name, isLimited. Seeds: Holiday(20, limited), ADV(5, limited), Sickness(unlimited), Ancientiteit(0, limited), Holiday Replacement.
- **UserLeaveAllowance** — userId, year, leaveTypeId, totalDays (null = unlimited). Prefilled on user create per Prio-1 rules.
- **Customer** — id, number(auto), name, address{street,zip,city,country}, contactName, contactEmail, *clientManagerUserId*.
- **Contract** — id, number(auto), customerId, subject, consultantUserId, startDate, endDate, *taskName*, *dayRate*, *clientManagerUserId*.
- **TimeEntry** — id, userId, date(DATE), rowKind(`Contract|Leave`), contractId? / leaveTypeId? (exactly one), minutes, *approved*, weekKey (derived ISO `yyyy-Www`).
- *WeekSubmission* — userId, weekKey, status(`Draft|Submitted|Approved`), submittedAt — Prio-2.
- *Holiday* — date, name, country, region — cached from openholidaysapi.org — Prio-2.

Invariants enforced server-side:
- TimeEntry references exactly one of `contractId` / `leaveTypeId`.
- `15 ≤ minutes ≤ 480` per cell; Sat/Sun reject writes.
- Contract pickable only when `date ∈ [start,end]` and `consultantUserId == currentUser`.

## 3. API surface (REST, OpenAPI → TS types via `bun run gen:api`)

All under `/api`. One folder per module mirroring `Modules/Animals` (`*Endpoints.cs`, `*Service.cs`, `*Configuration.cs`, `*Contracts.cs`).

- `Me` — `GET /api/me` (FE bootstrap: user + role + allowances summary).
- `Users` (Admin) — CRUD; subresource `GET/PUT /api/users/{id}/allowances?year=`.
- `Customers` (Admin) — CRUD.
- `Contracts` (Admin) — CRUD; `GET /api/contracts?consultantId=&date=` for the time-entry row picker.
- `LeaveTypes` (Admin) — CRUD (defaults seeded).
- `TimeEntries`
  - `GET /api/time-entries?userId=&weekKey=` (grid load)
  - `GET /api/time-entries?userId=&from=&to=` (timesheets + leave overview aggregates)
  - `PUT /api/time-entries/week` — whole-week upsert (batch, idempotent).
- *Weeks* `POST /api/weeks/{weekKey}/submit` — Prio-2.
- *Holidays* `GET /api/holidays?year=` — Prio-2.

AuthZ: existing Entra JWT (`AddEntraJwtAuth`) already validates. Map `oid` claim → `User.entraObjectId` in a `CurrentUserAccessor`. Admin endpoints behind a `RequireRole("Admin")` endpoint filter; user endpoints scoped to current user unless caller is Admin.

## 4. Frontend (TanStack Start)

`packages/web/src` layout:

```
api/                  # openapi-fetch + generated schema.ts (one client per module)
lib/auth.server.ts    # already in place (Auth.js / Entra)
features/
  time-entry/         # WeekGrid, RowPicker, useWeekAutosave, hotkeys
  timesheets/         # MonthView
  leave/              # YearGrid, BalanceCard
  admin-users/
  admin-customers/
  admin-contracts/
components/ui/        # shadcn primitives (present)
routes/
  __root.tsx
  login.tsx           # present
  _authed.tsx         # role-aware shell + nav (present, expand)
  _authed/
    index.tsx                 # redirect → /time-entry/current
    time-entry/$week.tsx      # weekKey (yyyy-Www) | 'current'
    timesheets/$month.tsx     # yyyy-MM
    leave/$year.tsx
    admin/
      users/ ...
      customers/ ...
      contracts/ ...
```

Key UX:
- **Week grid**: 7 cols; Sat/Sun read-only; hotkeys `d`=8:00, `h`=4:00, `del`=clear; per-row + per-day + week totals derived; autosave on blur, week-change, and route-leave via a single batched `PUT /time-entries/week`.
- **Row picker**: combobox sourced from `/contracts?consultantId=me&date=weekStart` and `/leave-types` filtered by user allowance.
- **Month/Year aggregates**: server loaders for first paint, TanStack Query for refetch + optimistic updates; click-through opens the corresponding week editor.
- **Role gating**: `_authed.tsx` exposes `session.user.role` via router context, hides admin nav; admin routes also have `beforeLoad` guards.

State / data: TanStack Query for mutations, loaders for read-only first paint; TanStack Form + zod for forms (zod types derived from `openapi-fetch` request shapes); URL is the only state for week/month/year nav.

## 5. Cross-cutting

- **Validation**: zod (FE) + FluentValidation or `ValidationFilter<T>` (API, pattern already in `Common/Filters`). OpenAPI schema is the contract.
- **Time zone**: dates stored as plain `DATE` (no time), assumed Europe/Brussels; week keys ISO `yyyy-Www`.
- **Seeding**: dev seeder writes default LeaveTypes + one Admin User bound to `DEV_ADMIN_OID` env so first dev login lands as Admin. Replaces `EnsureAnimalDbSeeded`.
- **Tests**:
  - `api.tests` — leave-balance calc, week upsert idempotency, role guards.
  - `api.tests.integration` — happy path per endpoint with `WebApplicationFactory` + SQLite.
  - Web vitest for hooks (`useWeekTotals`, autosave debounce); optional Playwright smoke for the time-entry round-trip.
- **Tooling**: `vp check` on web, `dotnet format` on api. After API changes run `bun run gen:api`.

## 6. Phased delivery

Each phase is a vertical slice landed on its own worktree branch and merged into `master`. Per-phase rhythm:

1. EF migration (`dotnet ef migrations add <Name> -p packages/api`).
2. Endpoints + service + contracts + validators (mirror `Modules/Animals` shape).
3. `bun run gen:api` to refresh `packages/web/src/api/schema.ts`.
4. FE route(s) + feature folder + zod forms.
5. Unit + integration tests, `vp check`, `dotnet format`, `dotnet test`.
6. Update `CHANGELOG.md` (outcome-oriented); open an ADR if a real decision was made.

ADRs to capture along the way: single-DbContext choice, weekKey format, autosave strategy, Entra-oid ↔ User mapping, role claim shape.

### Phase 0 — Bootstrap & cleanup (no user-visible feature)
- Add `TszDbContext` alongside `AnimalDbContext`; copy registration in `Program.cs`.
- Introduce `Common/CurrentUserAccessor.cs` reading `oid` from `HttpContext.User`; register scoped.
- Add `RequireRoleAttribute` / endpoint filter driven by `User.role`.
- Replace `EnsureAnimalDbSeeded` with `TszSeeder` (LeaveTypes + dev admin from `DEV_ADMIN_OID`).
- `/api/me` returning `{ user, role, allowances }` (allowances empty until Phase 2).
- FE: loader at `_authed.tsx` calls `/api/me`, stashes in router context; role-aware nav stub.
- Keep `Animals` module live; remove only after Phase 2 has a parallel CRUD landed.
- Exit: dev login lands on empty shell; `GET /api/me` returns the seeded admin.

### Phase 1 — Admin: Leave Types
- Entity `LeaveType` + EF config + migration; seeder writes the 5 defaults idempotently.
- `LeaveTypesEndpoints` CRUD behind `RequireRole("Admin")`.
- FE `features/admin-leave-types/` list + edit dialog; route `admin/leave-types`.
- Exit: admin can edit `isLimited` and default total; seeds visible.

### Phase 2 — Admin: Users + allowances
- Entities `User`, `UserLeaveAllowance` + migration; unique index on `entraObjectId`.
- Endpoints: `Users` CRUD; nested `GET/PUT /api/users/{id}/allowances?year=`.
- On user create: prefill current-year allowances from `LeaveType` defaults.
- Auto-provision: first `/api/me` for an unknown `oid` inserts a `User(role=User)`.
- FE `features/admin-users/`: list, detail with allowance editor (year selector).
- Retire `Animals` module + migration + FE route here.
- Exit: admin can promote a user; allowances editable per year; new logins auto-provision.

### Phase 3 — Admin: Customers
- Entity + migration with owned `Address` value object.
- CRUD endpoints, list filter on `name` / `number`.
- FE `features/admin-customers/`: list + form (TanStack Form + zod).
- Exit: customer list paginates + searches by name.

### Phase 4 — Admin: Contracts
- Entity + migration; FKs to Customer + consultant User.
- CRUD endpoints + filter `GET /api/contracts?consultantId=&date=` returning active contracts for that date.
- FE `features/admin-contracts/`: list grouped by customer; form picks customer + consultant.
- Exit: contracts searchable; filter endpoint returns the correct slice for arbitrary dates.

### Phase 5 — Time Entry (largest slice)
- Entity `TimeEntry` + migration; check constraint `(contractId IS NULL) <> (leaveTypeId IS NULL)`; index `(userId, date)`.
- `GET /api/time-entries?userId=&weekKey=` (defaults to current user; admin override).
- `PUT /api/time-entries/week`: full-week batch upsert; per-cell `15..480`; rejects Sat/Sun; returns new `weekVersion` ETag.
- Server invariants: contract must be active for `date` and assigned to `userId`; for limited leave types, warn (don't block) on over-allowance in Prio-1.
- FE `features/time-entry/`:
  - `WeekGrid` (7 cols, totals row + column); Sat/Sun muted + read-only.
  - `RowPicker` combobox sourced from `/contracts?consultantId=me&date=weekStart` + `/leave-types`.
  - Hotkeys `d`=480, `h`=240, `del`=clear; arrow keys move focus.
  - `useWeekAutosave`: 500 ms debounce; flushes on blur, route-leave, week-change; sends `If-Match: weekVersion`.
  - Route `time-entry/$week.tsx`; `current` segment resolves to today's ISO week.
- Tests: week-upsert idempotency, ETag conflict, totals + hotkey hooks (vitest), Playwright happy path.
- Exit: user fills a week, refreshes, sees the same data; concurrent tab gets `412`.

### Phase 6 — Timesheets
- Endpoint `GET /api/time-entries?userId=&from=&to=` returning per-day + per-contract sums.
- FE `features/timesheets/MonthView`: month grid; click a day → `/time-entry/$week`.
- Server loader for first paint; TanStack Query refresh after mutation.
- Exit: month totals match underlying entries; navigation round-trips.

### Phase 7 — Leave Overview
- Reuse the date-range aggregate, group by `leaveTypeId`.
- FE `features/leave/`: `YearGrid` (12×31 heatmap) + `BalanceCard` (used vs allowance per limited type).
- Exit: year view shows accurate balance; over-allowance renders a warning chip.

### Phase 8 — Hardening & Prio-2 backlog
Each item is its own worktree slice:
- WeekSubmission + `POST /api/weeks/{weekKey}/submit`; "Submitted" lock in the grid.
- Approver flow (ClientManager role on contracts).
- Holidays cache (background fetch from openholidaysapi, table + DI service).
- Per-task rate / day-rate on Contract; surface in admin form + timesheet export.
- Admin role impersonation (header `X-Act-As-User-Id` + audit log).
- SQLite → Postgres swap (connection string + EF provider, container compose).

## 7. Cross-phase checklist

Before merging any phase branch:
- [ ] `bun run gen:api` committed when API contracts changed.
- [ ] `dotnet test` + `bun run test` green.
- [ ] `vp check` (web) and `dotnet format --verify-no-changes` clean.
- [ ] Migration is reversible (smoke `dotnet ef database update <prev>` locally).
- [ ] `CHANGELOG.md` updated (outcome, not steps).
- [ ] ADR added if a non-obvious decision was made.
- [ ] Worktree merged via the `git-worktree-merge` skill; branch + worktree removed.

## 8. Risks & open questions

- **Token refresh**: Entra access tokens ~1h; Auth.js `jwt` callback already has a refresh path in `auth.server.ts` — needs an integration test before long admin sessions are common.
- **User provisioning**: bootstrap rule for Entra `oid` ↔ `User` row. Recommend auto-create as `role=User` on first `/api/me`, with Admin promotion via UI.
- **Concurrent week edits**: low risk (single user per week), but `PUT /time-entries/week` should return a week version and accept `If-Match` to avoid two-tab clobber.
- **SQLite write load**: fine for POC; flag for Postgres swap before any real rollout.
- **Animals module retirement**: keep until slice 1 lands a parallel module; remove together with its DbContext, seeder, FE route, and migration.
