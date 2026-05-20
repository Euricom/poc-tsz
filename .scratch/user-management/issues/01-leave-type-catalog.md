# 01 — LeaveType catalog: full CRUD + seeder

Status: done

## Parent

`.scratch/user-management/PRD.md`

## What to build

Stand up the admin catalog of `LeaveType`s end-to-end. This is the first slice and introduces the shared `UsersDbContext` that the user-management module will live in, alongside the existing untouched `AnimalDbContext`.

Backend:

- New `UsersDbContext` targeting the same `tsz.db` SQLite file as Animals, with its own migrations history table (e.g. `__EFMigrationsHistory_Users`) and migrations folder under `Migrations/Users/`.
- `LeaveType` entity (`Id`, `Name`, `Allowed` enum (`Limited | Unlimited`), `DefaultTotalDays` (nullable int; `null` when Unlimited), `Color` (7-character hex string, `#RRGGBB`; required, max length 7), `IsArchived` bool default false) with EF configuration enforcing uniqueness of `Name` (case-insensitive) among non-archived rows. `Color` is validated on the request DTO via a regex (`^#[0-9A-Fa-f]{6}$`).
- Seeder that, on first DB creation when the `LeaveType` table is empty, inserts the four defaults: `Verlof` (Limited, 20, `#3B82F6`), `ADV` (Limited, 5, `#10B981`), `Anciënniteit` (Limited, 0, `#8B5CF6`), `Ziekte` (Unlimited, `#EF4444`).
- `LeaveTypeService` (deep module) with: list (default excludes archived; `includeArchived` flips that), create, edit (name / allowed / default total days / color — must NOT touch any existing `UserLeave`), and archive-on-delete (soft delete sets `IsArchived = true`, never hard-deletes).
- Endpoints, all `RequireAuthorization()`. Validation via the existing `ValidationFilter<T>` pattern; request DTOs carry length/range/pattern attributes.

```typespec
@route("/api/leave-types")
namespace LeaveTypes {
  @get op list(@query includeArchived?: boolean): LeaveType[];

  @post op create(@body body: CreateLeaveTypeRequest): {
    @statusCode _: 201;
    @body leaveType: LeaveType;
  };

  @route("/{id}") {
    @put    op update(@path id: int32, @body body: UpdateLeaveTypeRequest): LeaveType;
    @delete op delete(@path id: int32): void;  // soft-delete: sets IsArchived = true
  }
}
```

Full model definitions: see `.scratch/user-management/PRD.md` — REST API Contract.

Frontend:

- New `/admin/leave-types` route under `_authed/` with a list view (DataTable), add/edit modal, archive action, and a "show archived" toggle. The list shows each row's `Color` as a small swatch next to the name.
- Co-located `-components/` folder for the form and its Zod schema, mirroring the Animals layout. The form includes a color field: a native `<input type="color">` paired with a synced hex text input; Zod validates the hex regex (`/^#[0-9A-Fa-f]{6}$/`) and marks it required.
- API client module `src/api/leave-types.ts` using the generated client.
- Run `bun run gen:api` after the backend lands.

Out of this slice: cross-user backfill on `LeaveType` create. Code path stays a no-op for now (no users exist yet); the behavior is added in slice 02 where it is testable.

## Acceptance criteria

- [ ] `UsersDbContext` exists, targets `tsz.db`, uses its own EF migrations history table, and its initial migration creates the `LeaveType` table.
- [ ] Seeder runs on first DB creation only and produces exactly the four defaults with the right `Allowed` modes, `DefaultTotalDays`, and `Color`.
- [ ] `GET /api/leave-types` returns only non-archived types by default; `?includeArchived=true` returns all. Response includes `Color`.
- [ ] `POST /api/leave-types` rejects a name that duplicates an existing non-archived type (case-insensitive), and rejects a `Color` that doesn't match `^#[0-9A-Fa-f]{6}$`.
- [ ] `PUT /api/leave-types/{id}` updates name / allowed / default total days / color only.
- [ ] `DELETE /api/leave-types/{id}` sets `IsArchived = true` and never hard-deletes; the row remains retrievable via `?includeArchived=true`.
- [ ] All endpoints reject anonymous requests when `Auth:Disabled` is not set.
- [ ] Unit tests (`packages/api.tests/`) cover: create, edit-doesn't-touch-UserLeave (vacuous here — assert no side-effects beyond the type's own row), soft-delete, list filtering by archived, uniqueness rule.
- [ ] Integration tests (`packages/api.tests.integration/`) cover at least one happy-path round-trip per endpoint plus the auth boundary.
- [ ] Frontend `/admin/leave-types` route renders the list (with color swatch per row), allows add/edit/archive, and supports a show-archived toggle. The form lets the admin pick a color (native picker + hex text input, kept in sync). Co-located Zod schema + spec exist (including the hex-color rule); API client spec exists.
- [ ] `bun run gen:api` has been run and the typed client exposes the new endpoints.
- [ ] `CHANGELOG.md` updated with an outcome-oriented summary.

## Blocked by

None — can start immediately.
