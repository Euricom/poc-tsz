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

## 6. Delivery order (vertical slices)

Each slice = DB migration → API endpoints → TS schema regen → FE route + tests → CHANGELOG entry.

1. **Foundation** — `TszDbContext`, `CurrentUserAccessor`, role middleware, `/api/me`; replace `Animals` seeder/module wiring; expand `_authed` shell with role-aware nav.
2. **Admin: LeaveTypes + Users** (incl. allowance subresource); seeds.
3. **Admin: Customers** — CRUD.
4. **Admin: Contracts** — CRUD + consultant/date filter endpoint.
5. **Time Entry (Prio-1)** — week endpoints, grid, hotkeys, autosave. Largest slice.
6. **Timesheets (Prio-1)** — month aggregate + click-through to week.
7. **Leave Overview (Prio-1)** — year aggregate + balance summary card.
8. **Polish & Prio-2 backlog** — week submit/approval, holidays cache, client-manager assignment, per-task rate, impersonation.

Capture ADRs (`docs/adr/`) for: single-DbContext choice, weekKey format, autosave strategy, Entra-oid ↔ User mapping rule.

## 7. Risks & open questions

- **Token refresh**: Entra access tokens ~1h; Auth.js `jwt` callback already has a refresh path in `auth.server.ts` — needs an integration test before long admin sessions are common.
- **User provisioning**: bootstrap rule for Entra `oid` ↔ `User` row. Recommend auto-create as `role=User` on first `/api/me`, with Admin promotion via UI.
- **Concurrent week edits**: low risk (single user per week), but `PUT /time-entries/week` should return a week version and accept `If-Match` to avoid two-tab clobber.
- **SQLite write load**: fine for POC; flag for Postgres swap before any real rollout.
- **Animals module retirement**: keep until slice 1 lands a parallel module; remove together with its DbContext, seeder, FE route, and migration.
