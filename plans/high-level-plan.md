# High-Level Implementation Plan — TSZ (Time Tracking & Leave)

Source: `docs/product/requirements.md`, `docs/product/architecture.md`. Current skeleton: TanStack Start web + .NET 10 minimal-API + EF Core/SQLite, with a reference `Animals` module and Entra ID auth (Auth.js swap in `plans/my-plan.md`).

## 1. Scope summary

End-state Prio-1 application:

- **Login** (Entra ID, single-tenant).
- **Time Entry** (weekly grid; tasks + leaves rows; hot-keys; autosave).
- **Timesheets** (month overview; click-day → week editor).
- **Leave Overview** (year grid + balance summary).
- **Admin**: Customers, Contracts, Users + per-user leave allowances.

Prio-2 items (approval flow, school/work holidays, client-manager assignment, per-task rates) are deferred but the data model accommodates them.

## 2. Domain model (single source of truth = .NET / EF Core)

Bounded context: **TimeTracking**. One DB (SQLite) — one `DbContext` (`TszDbContext`) or per-module contexts behind a shared connection. Recommend a single context for FK integrity.

Entities (Prio-1 in **bold**, Prio-2 italic):

- **User** — id, entraObjectId, name, email, role (`Admin|User|ClientManager`), active.
- **UserLeaveAllowance** — userId, year, leaveTypeId, totalDays (nullable = unlimited), prefilled on user create.
- **LeaveType** — id, name, isLimited (e.g. Holiday, Sickness, ADV, Ancientiteit, Holiday Replacement).
- **Customer** — id, number (auto), name, address {street, zip, city, country}, contactName, contactEmail, *clientManagerUserId*.
- **Contract** — id, number (auto), customerId, subject, consultantUserId, startDate, endDate, *taskName*, *dayRate*, *clientManagerUserId*.
- **TimeEntry** — id, userId, date (yyyy-mm-dd), rowKind (`Contract|Leave`), contractId? / leaveTypeId?, minutes, *approved*, weekKey (derived: ISO year-week).
- *WeekSubmission* — userId, weekKey, status (`Draft|Submitted|Approved`), submittedAt — Prio-2.
- *Holiday* — date, name, country, region — populated from openholidaysapi.org — Prio-2.

Invariants:
- A `TimeEntry` references exactly one of `contractId` / `leaveTypeId`.
- `0:15 ≤ minutes ≤ 8:00` per cell; week-end days reject writes server-side.
- Contracts only selectable when `date ∈ [startDate, endDate]` and `consultantUserId == currentUser`.

## 3. API surface (REST, OpenAPI generated → TS types)

Routing under `/api`. Mirrors existing `Animals` module style: one folder per module with `*Endpoints.cs`, `*Service.cs`, `*Configuration.cs`, `*Contracts.cs`.

Modules:

- `Auth` — `GET /api/me` (current user + roles, used by FE bootstrap).
- `Users` (Admin) — list/get/create/update; leave-allowance subresource `GET/PUT /api/users/{id}/allowances?year=`.
- `Customers` (Admin) — CRUD.
- `Contracts` (Admin) — CRUD; `GET /api/contracts?consultantId=&date=` for time-entry picker.
- `LeaveTypes` (Admin) — CRUD (seeded defaults: leave 20d, adv 5d, sickness unlimited, ancientiteit 0).
- `TimeEntries` — `GET /api/time-entries?userId=&weekKey=`; `PUT /api/time-entries/week` (whole-week upsert, batch); `GET …?userId=&from=&to=` for timesheets/leave overview.
- *Weeks* — `POST /api/weeks/{weekKey}/submit` (Prio-2).
- *Holidays* — `GET /api/holidays?year=` (Prio-2; backed by openholidaysapi cache).

Authorization:
- JWT (Entra) validated as today. Claims → roles via `appsettings`. Endpoint filters: `[RequireRole("Admin")]` on admin CRUD; user routes scoped to `sub`/`oid` claim → User.entraObjectId mapping for non-admins.

## 4. Frontend (TanStack Start)

Folder layout under `packages/web/src`:

```
api/                # openapi-fetch + generated schema.ts (one file per module)
lib/auth.ts         # Auth.js (per plans/my-plan.md)
features/
  time-entry/       # WeekGrid, RowPicker, useWeekAutosave, hotkeys
  timesheets/       # MonthView
  leave/            # YearGrid, BalanceCard
  admin-users/
  admin-customers/
  admin-contracts/
components/ui/      # shadcn primitives (already present)
routes/
  __root.tsx        # session in router context
  login.tsx
  _authed.tsx       # role-aware shell + nav
  _authed/
    index.tsx              # → redirect to /time-entry/this-week
    time-entry/$week.tsx   # weekKey param (yyyy-Www); default 'current'
    timesheets/$month.tsx  # yyyy-MM
    leave/$year.tsx
    admin/
      users/...
      customers/...
      contracts/...
```

Key UX bits:
- **Week grid**: 7 columns; columns 6–7 (Sat/Sun) read-only; `d`/`h`/`del` hotkeys per cell; row total + day total + week total derived. Autosave on blur/route-change/week-change (single batched `PUT /time-entries/week`).
- **Row picker**: combobox sourced from `/api/contracts?consultantId=me&date=weekStart` + `/api/leave-types?userId=me`.
- **Month/Year grids**: server-rendered initial data via TanStack Start loaders; client query (TanStack Query) for refetch + optimistic updates.
- **Role gating**: `_authed.tsx` reads `Route.useRouteContext().session.user.role` and hides admin nav; admin routes also have a `beforeLoad` guard that throws redirect on insufficient role.

State / data:
- TanStack Query everywhere data is mutated; loaders for read-only first-paint.
- Forms via TanStack Form + zod schemas (shared with `openapi-fetch` request types).
- No global store; URL is the state for week/month/year navigation.

## 5. Cross-cutting

- **Validation**: zod on FE, FluentValidation (or minimal-API endpoint filter) on .NET — duplicate but cheap; OpenAPI schema is the contract.
- **Time zone**: store dates as local-Europe/Brussels in DB as `DATE` (no time component for time entries); week keys are ISO-8601 (`2026-W19`).
- **Seeding**: dev seeder adds default LeaveTypes + one Admin user mapped to a real Entra `oid` from env (`DEV_ADMIN_OID`) so first login lands as Admin.
- **Tests**:
  - .NET unit tests per service (`packages/api.tests`) — leave-balance calc, week-upsert idempotency, role guards.
  - .NET integration (`api.tests.integration`) — happy-path for each endpoint with `WebApplicationFactory` + SQLite in-memory.
  - Web: vitest for hooks (`useWeekTotals`, autosave debounce), and a playwright smoke for the time-entry round-trip (optional, Prio-1 stretch).
- **Tooling**: keep `vp check` (oxlint+oxfmt) on web, `dotnet format` on api; CI later.

## 6. Delivery order (vertical slices)

Each slice = DB migration + API endpoints + TS schema regen + FE route + tests.

1. **Foundation** — `TszDbContext`, role middleware, `/api/me`, FE `_authed` shell w/ role-aware nav, retire the `Animals` reference module (or keep until last slice replaces it).
2. **Admin: Users + LeaveTypes** — minimum needed to author later data; seed defaults.
3. **Admin: Customers** — CRUD.
4. **Admin: Contracts** — CRUD + consultant/date filter endpoint.
5. **Time Entry (Prio-1)** — week endpoints, FE grid, hotkeys, autosave. Biggest slice; budget the most time.
6. **Timesheets (Prio-1)** — month aggregate + click-through.
7. **Leave Overview (Prio-1)** — year aggregate + balance summary.
8. **Polish & Prio-2 backlog** — week submit/approval, holidays API, client-manager assignment, per-task rates, role impersonation.

Each slice produces a runnable demo; ADRs (under `docs/adr/`) recorded for: single-DbContext choice, weekKey representation, autosave strategy, role-claim mapping.

## 7. Risks & open questions

- **Token refresh**: noted in `plans/my-plan.md`; Microsoft access tokens expire ~1h. Need a `jwt`-callback refresh path before long admin sessions become annoying.
- **Identity mapping**: Entra `oid` ↔ `User` row needs a bootstrap rule (auto-create on first login? whitelist? admin-provisioned?). Recommend auto-create as role=User on first login, admin promotes.
- **Concurrent week edits**: low risk (one user per week) but `PUT /time-entries/week` should be a full-week replace with an `If-Match` etag (week version) to prevent two tabs clobbering.
- **SQLite for multi-user write load**: fine for POC, flag for swap to Postgres before any real rollout.
