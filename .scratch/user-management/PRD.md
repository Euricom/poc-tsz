# PRD — User management

Status: ready-for-agent

## Problem Statement

Today the application has no notion of a user beyond a JWT identity. Admins cannot see who uses the app, change anyone's role, or configure the leave allocations needed by the upcoming time-tracking and leave-overview features. Every downstream feature (Time Entry, Timesheets, Leave Overview) needs to read per-user leave totals, but those totals don't exist anywhere yet.

## Solution

Introduce a user management module mirroring the existing Animal module pattern: a CRUD-able `User` (name, email, role) plus a per-user, per-year list of `UserLeaves` whose categories come from a globally admin-managed `LeaveType` catalog. Admins reach both surfaces via a new `/admin` section in the frontend. The catalog drives defaults; per-user rows are auto-created on user creation and on new LeaveType creation; admins cannot add or remove rows on a user — only edit `TotalDays` and `TakenDays`. The model is deliberately minimal so it can be extended later without painful migrations.

## User Stories

1. As an admin, I want to see a list of all users in the system, so that I have visibility on who has access.
2. As an admin, I want to add a new user with name, email, and role, so that I can onboard a new colleague.
3. As an admin, I want a newly-created user to automatically receive the standard leave allocations for the current year, so that I don't have to set them up by hand every time.
4. As an admin, I want to edit a user's name, email, and role, so that I can correct mistakes or reflect role changes.
5. As an admin, I want to delete a user, so that I can remove people who have left.
6. As an admin, I want each user's email to be unique, so that the user is unambiguously identified.
7. As an admin, I want to see each user's leave allocations on the user edit page, grouped per year, so that I can review their balance at a glance.
8. As an admin, I want to edit `TotalDays` and `TakenDays` on an existing leave row of a user, so that I can correct allocation or record taken days.
9. As an admin, I want the system to compute and display each row's `BalanceDays` (`Total − Taken`), so that I don't have to do math.
10. As an admin, I want unlimited leave rows (e.g. sick leave) to omit `TotalDays` and `BalanceDays` in the UI, so that the form does not show meaningless numbers.
11. As an admin, I want a separate page for managing the catalog of leave types, so that I can curate the categories without touching individual users.
12. As an admin, I want to define a leave type with a name, an Allowed mode (Limited / Unlimited), a default total days, and a color, so that future users get the right starting point and the type is visually distinguishable in the UI.
13. As an admin, I want every existing user to automatically gain a new leave row for the current year when I add a new leave type, so that I don't have to manually visit every user.
14. As an admin, I want to edit a leave type's name, Allowed mode, default total days, and color, so that I can correct or evolve the catalog.
15. As an admin, I want editing a leave type's default total days to *not* rewrite existing user allocations, so that historical data is preserved.
16. As an admin, I want to archive a leave type instead of deleting it, so that existing user rows referencing it remain intact.
17. As an admin, I want archived leave types to still appear (clearly marked) on existing users' leave lists and remain editable, so that I can continue to record taken days through the rest of the year.
18. As an admin, I want archived leave types to be excluded from backfills on new user creation, so that phased-out categories don't keep reappearing.
19. As an admin, I want leave type names to be unique among active (non-archived) types, so that I cannot create two "Verlof" entries by accident.
20. As an admin, I want a freshly-installed system to come pre-seeded with the standard four leave types (Verlof 20, ADV 5, Anciënniteit 0, Ziekte Unlimited), so that I can create my first user without configuring the catalog first.
21. As an admin, I want the user list and the leave-type list to live under `/admin/...` URLs, so that it is clear which screens are administration surfaces.
22. As an authenticated user, I want every admin endpoint to require a valid Entra JWT, so that the system is not openly readable.
23. As an admin, I want a deleted user's leave allocations to be removed along with the user, so that orphaned rows do not accumulate.
24. As a future developer, I want the user/leave-type schema to live on the same SQLite file as the Animals module but in its own DbContext and migrations folder, so that I do not have to rework existing migrations.
25. As a frontend developer, I want the API to expose the user with their leaves embedded in a single response, so that the edit page renders without a fan-out of requests.
26. As a frontend developer, I want a dedicated nested endpoint for updating a single leave row, so that the per-row "Update leave" modal maps to a single HTTP call.
27. As a frontend developer, I want the generated OpenAPI client to expose the new endpoints after running `bun run gen:api`, so that I can call them with full type-safety.

## Implementation Decisions

### Domain model

Three entities are introduced (see `CONTEXT.md` for canonical definitions):

- **User** — `Id`, `Name` (single free-text string), `Email` (unique, case-insensitive), `Role` enum (`Admin | User | ClientManager`). Email max length 200, name max 100. **`User.Role` is application data only and does not gate any endpoint today.**
- **LeaveType** — `Id`, `Name` (unique among non-archived, case-insensitive), `Allowed` enum (`Limited | Unlimited`), `DefaultTotalDays` (nullable int; `null` when Unlimited), `Color` (7-character hex string, e.g. `#3B82F6`; required), `IsArchived` (bool, default false).
- **UserLeave** — `Id`, `UserId` (FK → `User`), `LeaveTypeId` (FK → `LeaveType`), `Year`, `TotalDays` (nullable int; `null` when the referenced type is Unlimited), `TakenDays` (int, default 0). Unique on `(UserId, LeaveTypeId, Year)`.

`BalanceDays` and the `Name` / `Allowed` / `Color` of a `UserLeave` are **derived in the response DTO** (projected from the `LeaveType` relationship), not stored.

### Module layout

Two modules, one shared `DbContext`. Folder separation reflects the two admin pages; the FK from `UserLeave` to `LeaveType` is real and DB-enforced because both live in the same `UsersDbContext`. The existing `AnimalDbContext` is untouched.

- **Users module** — owns `User`, `UserLeave`, their EF configurations, the user endpoints, and the user-leave update endpoint. Houses the shared `UsersDbContext`.
- **LeaveTypes module** — owns `LeaveType`, its configuration, the catalog endpoints, and the seeder for the four default types.

Both contexts target the same `tsz.db` SQLite file. The new context uses a separate EF migrations history table (e.g. `__EFMigrationsHistory_Users`) so its migrations are independent of Animals'. New migrations live in a `Migrations/Users/` folder.

### Deep modules

Three deep modules emerge — each owns real behavior, has a narrow interface, and is worth testing in isolation:

- **`LeaveTypeService`** — CRUD over the catalog, with two non-trivial behaviors: backfilling current-year `UserLeave` rows on every existing user when a type is created, and soft-deleting (archiving) on `Delete`. Interface accepts request DTOs and a `CancellationToken`; returns response DTOs.
- **`UserService`** — CRUD over `User`, with the load-bearing behavior of backfilling current-year `UserLeave` rows from all non-archived `LeaveType`s on creation, atomically in one `SaveChangesAsync`.
- **`UserLeaveService`** — narrow service responsible for updating a single `UserLeave` row's `TotalDays` and `TakenDays`. The "you cannot add or remove leaves at the user level" rule lives in the absence of those methods.

The endpoint files are intentionally thin (HTTP plumbing only) and not deep modules.

### Behavior rules (must be enforced in service code)

- **Create user** is atomic: the user row and the backfilled leaves commit together in a single `SaveChangesAsync`. If backfill fails, the user is not persisted.
- **Backfill on LeaveType create** writes one `UserLeave` per existing user, `Year = DateTime.UtcNow.Year`, `TotalDays = LeaveType.DefaultTotalDays`, `TakenDays = 0`.
- **Edit LeaveType** updates only the type's own row (`Name` / `Allowed` / `DefaultTotalDays` / `Color`); it must not touch any existing `UserLeave`. (Future backfills will use the new defaults. `Color` and `Name` propagate to existing rows via the relationship — they are not denormalized.)
- **Delete LeaveType** sets `IsArchived = true`. The catalog list endpoint excludes archived types by default; an `includeArchived=true` query string flips that. The endpoint never hard-deletes.
- **`User.Name`** is a single free-text field. The richer name model (First/Last/Nickname/...) and the multi-role checkbox model from the requirements doc are explicitly **out of scope**.

### API contracts

All endpoints require `RequireAuthorization()`. Same convention as the Animals module (auth can be disabled via the existing `Auth:Disabled` config key for local development).

```
GET    /api/users                            → User[]                      (each with embedded leaves[])
GET    /api/users/{id}                       → User                        (with embedded leaves[])
POST   /api/users                            → User                        (Created; backfills leaves atomically)
PUT    /api/users/{id}                       → User                        (Name / Email / Role only)
DELETE /api/users/{id}                       → NoContent                   (cascades to UserLeaves)
PUT    /api/users/{id}/leaves/{leaveId}      → UserLeave                   (TotalDays + TakenDays only)

GET    /api/leave-types?includeArchived=...  → LeaveType[]                 (default excludes archived)
POST   /api/leave-types                      → LeaveType                   (Created; backfills UserLeaves for all users for current year)
PUT    /api/leave-types/{id}                 → LeaveType                   (Name / Allowed / DefaultTotalDays / Color)
DELETE /api/leave-types/{id}                 → NoContent                   (soft-delete: sets IsArchived)
```

The `User` and `UserLeave` response DTOs project `Name`, `Allowed`, and `Color` from the `LeaveType` relationship and compute `BalanceDays`. Validation uses the same `ValidationFilter<T>` pattern that Animals uses; range/length attributes live on the request DTOs. `Color` is validated as a 7-character `#RRGGBB` hex string (regex), required on create.

After the C# endpoints land, the frontend's typed client is refreshed with `bun run gen:api` (required step per `packages/api/CLAUDE.md`).

### Seeding

- **LeaveTypes** are seeded on first DB creation when the table is empty: `Verlof` (Limited, 20, `#3B82F6`), `ADV` (Limited, 5, `#10B981`), `Anciënniteit` (Limited, 0, `#8B5CF6`), `Ziekte` (Unlimited, `#EF4444`).
- **Users** are *not* seeded. The list view starts empty.

### Frontend layout

A new `/admin` segment is added under the existing `_authed/` layout:

- `routes/_authed/admin/users/index.tsx` — list view (DataTable, Add button).
- `routes/_authed/admin/users/$id.tsx` — edit page (form + leaves table with per-row edit modal).
- `routes/_authed/admin/leave-types/index.tsx` — catalog list with add/edit/archive (and toggle to show archived). The list renders each row's `Color` as a swatch alongside the name; the add/edit form has a color input (native `<input type="color">` plus a hex text field) wired to the Zod schema.
- Co-located `-components/` folders hold the user form, the leave-edit modal, the leave-type form, and their schemas — mirroring the Animals layout.
- API client modules: `src/api/users.ts` and `src/api/leave-types.ts`, using the generated client.

Archived `LeaveType` rows shown on the user edit page render with a visible "archived" hint but remain editable.

## Testing Decisions

A good test exercises external behavior — the inputs and outputs of a deep module — not implementation details. Tests should not assert on private state, query the DB directly to look at columns the module hides, or pin string literals from log messages. Each test sets up a scenario, calls the public interface, and asserts on the response (or on a subsequent observable side-effect via the same public interface).

Prior art lives in `packages/api.tests/` (xUnit unit tests against services with an in-memory or test SQLite context) and `packages/api.tests.integration/` (xUnit + `Microsoft.AspNetCore.Mvc.Testing` hitting real endpoints). New tests follow whichever shape is already established for the corresponding Animals module — extend the same conventions.

### Unit tests — `packages/api.tests/`

The three deep services are the primary unit-test surfaces:

- **`LeaveTypeService`**
  - Creating a leave type backfills a current-year `UserLeave` row for every existing user, using the new type's default total days.
  - Editing a leave type does *not* alter any existing `UserLeave.TotalDays`.
  - Deleting a leave type sets `IsArchived = true` and does not remove `UserLeave` rows.
  - The catalog list excludes archived types by default and includes them when asked.
  - Two non-archived types with the same name (case-insensitive) cannot coexist.

- **`UserService`**
  - Creating a user backfills one `UserLeave` per non-archived `LeaveType`, all tagged with the current year.
  - Backfill copies `DefaultTotalDays` into `TotalDays`; unlimited types yield `TotalDays = null`.
  - Two users cannot share the same email (case-insensitive).
  - Deleting a user removes its `UserLeave` rows (cascade).
  - User update changes only `Name` / `Email` / `Role` — no leaf-related side-effects.

- **`UserLeaveService`**
  - Updating a leave row changes only `TotalDays` and `TakenDays`; other fields (`Year`, FKs) are unaffected.
  - Attempting to update a row that does not belong to the given user returns a not-found-style result.
  - The service exposes no "add" or "remove" method on `UserLeave` — the absence is part of the contract.

### Integration tests — `packages/api.tests.integration/`

Endpoint-level tests cover the happy paths and the auth boundary using the same harness as the Animals integration tests:

- `GET /api/users` returns the embedded leaves shape.
- `POST /api/users` returns the created user with the four seeded leaves embedded.
- `POST /api/leave-types` is observable through a subsequent `GET /api/users` for an existing user (new row appears).
- `PUT /api/users/{id}/leaves/{leaveId}` reflects changes on subsequent reads.
- All endpoints reject anonymous requests when `Auth:Disabled` is not set.

### Frontend tests

The Animals route has Vitest tests against the API client (`packages/web/src/api/animals.spec.ts`) and a Zod schema spec. Mirror that for users and leave-types: one spec per API client module, one schema spec per form. No full-page rendering tests are in scope.

## Out of Scope

- The richer User model from `docs/product/requirements.md` §Users and the admin mockups: First/Last/Nickname, Personnel Number, Active flag, Staff flag, Start/End date, Phone, Hours per day, Dima Code, Title, multi-role checkbox set (Consultant, Admin, SysAdmin, Financial controller, Client manager).
- Role-based authorization or any mapping of Entra claims to `User.Role`. All endpoints today require only a valid JWT.
- Automatic year rollover: no scheduled job or first-request-of-the-year hook creates next year's `UserLeave` rows.
- Computing `TakenDays` from time entries. The Time Entry feature does not exist yet; for now `TakenDays` is admin-editable on the user form.
- Letting admins add or remove leaves at the user level. The only way new rows enter a user is via `LeaveType` creation or user creation.
- Migrating the existing `AnimalDbContext` into a consolidated app context.
- User self-service: a non-admin user cannot edit their own profile.
- Search, sort, pagination, or filtering on the user list beyond what the existing DataTable component gives for free.
- Bulk operations (CSV import, bulk archive).

## Further Notes

- The repo's CONTEXT.md and ADR 0001 (`docs/adr/0001-leave-type-catalog.md`) cover the domain language and the central architectural decision behind this module. Implementers should treat both as canonical.
- `packages/api/CLAUDE.md` requires running `bun run gen:api` after API endpoint changes — do not skip this between backend and frontend work.
- `CHANGELOG.md` is updated outcome-oriented before any commit per the root `CLAUDE.md`.
- The "Verlof / ADV / Anciënniteit / Ziekte" naming for seeded LeaveTypes follows the existing mockups; English equivalents (Holiday / ADV / Seniority / Sick) are equally acceptable if the team prefers them — change in the seeder.
