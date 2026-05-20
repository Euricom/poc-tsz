# 02 — User create + list with leave backfill (both directions)

Status: ready-for-agent

## Parent

`.scratch/user-management/PRD.md`

## What to build

Introduce `User` and `UserLeave` alongside the existing `LeaveType` catalog, with the two backfill behaviors that bind the two modules together.

Backend:

- `User` entity (`Id`, `Name` (single free-text), `Email` unique case-insensitive, `Role` enum `Admin | User | ClientManager`). `Email` max 200, `Name` max 100.
- `UserLeave` entity (`Id`, `UserId` FK → `User`, `LeaveTypeId` FK → `LeaveType`, `Year`, `TotalDays` nullable int, `TakenDays` int default 0). Unique on `(UserId, LeaveTypeId, Year)`. Cascade delete from `User`. FK to `LeaveType` is real and DB-enforced (same `UsersDbContext`).
- New migration on `UsersDbContext` for both tables.
- `UserService` (deep module) with create: atomically writes the user row plus one `UserLeave` per **non-archived** `LeaveType`, tagged with `DateTime.UtcNow.Year`, `TotalDays = LeaveType.DefaultTotalDays` (so `null` for Unlimited), `TakenDays = 0`. The user and the backfilled rows commit in a single `SaveChangesAsync`; if backfill fails the user is not persisted.
- `LeaveTypeService.Create` extended: after inserting the new type, write one `UserLeave` per existing user for the current year, `TotalDays = DefaultTotalDays`, `TakenDays = 0`. Same single-transaction guarantee.
- Endpoints, both `RequireAuthorization()`. Response DTO projects each `UserLeave.Name`, `Allowed`, `Color`, and `IsArchived` through its `LeaveType` relationship and computes `BalanceDays` (`Total − Taken`; `null` when Unlimited). Nothing is stored that the DTO derives. Validation via the existing `ValidationFilter<T>` pattern.

```typespec
@route("/api/users")
namespace Users {
  @get op list(): UserResponse[];

  @post op create(@body body: CreateUserRequest): {
    @statusCode _: 201;
    @body user: UserResponse;
  };
}
```

Full model definitions: see `.scratch/user-management/PRD.md` — REST API Contract.

Frontend:

- New `/admin/users` route under `_authed/` with a list view (DataTable showing Name, Email, Role columns) and an Add button that opens the create form. No `onRowClick` — the edit route doesn't exist until slice 03.
- Co-located `-components/` folder for the user form and its Zod schema. The form has Name (text), Email (text), and Role (select with options "Admin", "User", "Client Manager" mapping to enum values `Admin | User | ClientManager`).
- API client module `src/api/users.ts` using the generated client.
- Add a "Users" `<Link to="/admin/users">` in `src/routes/_authed.tsx` alongside the existing nav links.
- Run `bun run gen:api` after the backend lands.

Scope notes: this slice does NOT include the user edit page, delete, the per-row leave edit modal, or the read-only leaves table on an edit page. Those land in slices 03 and 04.

## Acceptance criteria

- [ ] Migration adds `User` and `UserLeave` tables to `UsersDbContext` with the FK + unique constraints described.
- [ ] `POST /api/users` returns the created user with one `UserLeave` per non-archived `LeaveType`, all tagged with the current year, `TotalDays` matching the type's `DefaultTotalDays` (`null` for Unlimited), `TakenDays = 0`. Each `UserLeaveResponse` includes `Id`, `Name`, `Allowed`, `Color`, `IsArchived`, `TotalDays`, `TakenDays`, `BalanceDays`.
- [ ] Creating a `LeaveType` (slice 01's endpoint) now also inserts one `UserLeave` per existing user for the current year using the new type's defaults — observable through a subsequent `GET /api/users`.
- [ ] Two users cannot share the same email (case-insensitive).
- [ ] Archived `LeaveType`s are excluded from the user-create backfill.
- [ ] User create is atomic: a forced failure in backfill leaves no user row behind.
- [ ] `GET /api/users` and `POST /api/users` reject anonymous requests when `Auth:Disabled` is not set.
- [ ] Unit tests cover: user create backfill set, unique-email rule, atomicity, cross-module backfill on `LeaveType` create.
- [ ] Integration tests cover: `POST /api/users` returning embedded leaves; `POST /api/leave-types` observable through a subsequent `GET /api/users` for an existing user (new row appears).
- [ ] Frontend `/admin/users` route renders the list and allows creating a user; co-located Zod schema + spec exist; API client spec exists.
- [ ] `bun run gen:api` has been run.
- [ ] `CHANGELOG.md` updated.

## Blocked by

- `.scratch/user-management/issues/01-leave-type-catalog.md`
