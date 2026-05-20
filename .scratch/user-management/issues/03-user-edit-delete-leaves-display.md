# 03 — User edit + delete + leaves read-only display

Status: ready-for-agent

## Parent

`.scratch/user-management/PRD.md`

## What to build

Close out the user-level CRUD surface and surface each user's leave allocations on an edit page (read-only in this slice; per-row editing arrives in slice 04).

Backend:

- `UserService` gains update and delete. Update changes only `Name` / `Email` / `Role` with no leaf-related side effects. Delete cascades to `UserLeave` rows (already DB-enforced from slice 02).
- Endpoints, all `RequireAuthorization()`. Same DTO projection rules as slice 02: `Name`, `Allowed`, `Color`, and `IsArchived` projected from the `LeaveType` relationship; `BalanceDays` computed; `null` for Unlimited. (`IsArchived` was added to `UserLeaveResponse` in slice 02 — no DTO change needed here.)

```typespec
@route("/api/users/{id}") {
  @get    op get(@path id: int32): UserResponse;
  @put    op update(@path id: int32, @body body: UpdateUserRequest): UserResponse;
  @delete op delete(@path id: int32): void;
}
```

Full model definitions: see `.scratch/user-management/PRD.md` — REST API Contract.

Frontend:

- Add `onRowClick={(row) => navigate({ to: '/admin/users/$id', params: { id: String(row.id) } })}` to the users DataTable in `routes/_authed/admin/users/index.tsx` (omitted in slice 02 because the route didn't exist yet).
- New `/admin/users/{id}` route under `_authed/` with:
  - A form to edit `Name` / `Email` / `Role`.
  - A flat leaves table (no year grouping — year rollover is out of scope) displaying a color swatch (`Color`), `Name`, `Allowed`, `TotalDays`, `TakenDays`, `BalanceDays`. **Read-only in this slice**; no row actions yet.
  - Unlimited rows render with `TotalDays` and `BalanceDays` blank (or a clear "—") rather than showing meaningless numbers.
  - Rows whose `LeaveType.IsArchived = true` render with a visible "archived" hint but remain in the list.
- Delete button on the edit page with a confirmation step.
- Run `bun run gen:api` after the backend lands.

## Acceptance criteria

- [ ] `PUT /api/users/{id}` changes only `Name` / `Email` / `Role`; existing `UserLeave` rows are untouched.
- [ ] `DELETE /api/users/{id}` removes the user and all its `UserLeave` rows (cascade); orphaned rows do not accumulate.
- [ ] `GET /api/users/{id}` returns the user with embedded `leaves[]` for the current year.
- [ ] Unique email is still enforced on update.
- [ ] All endpoints reject anonymous requests when `Auth:Disabled` is not set.
- [ ] Unit tests cover: update touches only allowed fields, delete cascades, archived `LeaveType`s appear in the `GET` response with their archived flag exposed (so the UI can render the hint).
- [ ] Integration tests cover the round-trip for `GET` / `PUT` / `DELETE`.
- [ ] Frontend `/admin/users/{id}` route renders the form, the leaves table with the per-row Allowed-aware blanks, and an "archived" hint on archived rows.
- [ ] Delete on the frontend prompts for confirmation and navigates back to the list on success.
- [ ] `bun run gen:api` has been run.
- [ ] `CHANGELOG.md` updated.

## Blocked by

- `.scratch/user-management/issues/02-user-create-list-with-backfill.md`
