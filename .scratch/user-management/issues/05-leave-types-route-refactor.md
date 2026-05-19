# 05 — LeaveType create/edit: move from modal to dedicated routes

Status: ready-for-agent

## Parent

`.scratch/user-management/PRD.md`

## What to build

Refactor the `/admin/leave-types` frontend to follow the project convention: create and edit forms for root entities live in dedicated routes, not modals on the list page.

- `routes/_authed/admin/leave-types/index.tsx` — list-only. Remove the Dialog/modal, the `editing` / `dialogOpen` state, and the `createLeaveTypeFn` / `updateLeaveTypeFn` server functions. Keep the DataTable, the "show archived" toggle, archive/unarchive actions, and add `onRowClick` navigating to `/admin/leave-types/$id`. Change the "Add leave type" button to a `<Link to="/admin/leave-types/new">`.
- `routes/_authed/admin/leave-types/new.tsx` — create form page. Moves the create logic (`createLeaveTypeFn`) from the list. On success, navigate to `/admin/leave-types` (the list). On cancel, navigate back.
- `routes/_authed/admin/leave-types/$id.tsx` — edit form page. Loads the leave type by id via `GET /api/leave-types` (filter client-side, or add a `GET /api/leave-types/{id}` endpoint if one exists). Moves the update logic (`updateLeaveTypeFn`). Shows the "Unarchive" button when `isArchived = true`. On success, stay on the page and reflect updated values. On delete (archive), navigate back to the list.

Reuse the existing `LeaveTypeForm` component and Zod schema from `-components/` without modification.

No backend changes required — all existing endpoints remain.

## Acceptance criteria

- [ ] `/admin/leave-types` list page has no modal; "Add leave type" is a link to `/admin/leave-types/new`; row click navigates to `/admin/leave-types/$id`.
- [ ] `/admin/leave-types/new` renders the create form; successful submit navigates to the list.
- [ ] `/admin/leave-types/$id` renders the edit form pre-populated with the leave type's current values; successful submit reflects the update in place; the "Archive" action navigates back to the list; the "Unarchive" button appears for archived types.
- [ ] Existing `-components/leave-type-form.tsx` and `-components/leave-type-schema.ts` are unchanged.
- [ ] `bun run check` passes; `bun run test:web` passes.
- [ ] `CHANGELOG.md` updated.

## Notes

- Check whether `GET /api/leave-types/{id}` exists before deciding how to load a single type on the edit page. If not, fetch the full list and filter by id client-side (acceptable given the small catalog size).
- Archive/unarchive actions already have server functions in the current list page — move them to the edit route.

## Blocked by

None — independent of the user-management slices.
