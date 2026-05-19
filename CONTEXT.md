# tsz Domain Context

Time tracking and leave management for Euricom. Single-context repo.

## Language

**Leave**:
A category of paid or unpaid time off (e.g. holiday, sick, ADV) that a user can take during a year.
_Avoid_: Leaf, holiday (when used generically), absence.

**LeaveType**:
A globally-defined leave category in the admin catalog. Has a `Name`, an `Allowed` mode (Limited or Unlimited), a `DefaultTotalDays` used as the prefill for new users, and a `Color` used by UI surfaces to visually distinguish categories.
_Avoid_: LeaveCategory, LeaveKind.

**UserLeave**:
A user's allocation of a specific `LeaveType` for a specific year. Owns the editable totals (`TotalDays`, `TakenDays`); reads its `Name`, `Allowed`, and `Color` through its `LeaveType`.
_Avoid_: UserLeaveAllocation, LeaveEntry (which would suggest a time-entry record, not a yearly bucket).

**Allowed**:
A `LeaveType` property with two values: `Limited` (has a `TotalDays` cap) and `Unlimited` (no cap; e.g. sick leave). Decided once per type at the catalog level — not editable per user.
_Avoid_: Bounded, Capped.

**TotalDays / TakenDays / BalanceDays**:
On a `UserLeave`: `TotalDays` is the cap (nullable; `null` when the type is Unlimited), `TakenDays` is how many days the user has consumed this year, `BalanceDays` is `TotalDays − TakenDays` (computed on read, not stored; `null` when Unlimited).

**Archived (LeaveType)**:
A `LeaveType` marked `IsArchived = true` is hidden from the admin catalog's "active" view and is not used in backfills, but existing `UserLeave` rows pointing to it remain visible and editable on the user form.

**Color (LeaveType)**:
A 7-character hex color string on `LeaveType` (e.g. `#3B82F6`). Required, set by the admin on create and editable on update. Used by UI surfaces (catalog list, future calendar / timesheet views) to visually distinguish categories. Read through the relationship on every `UserLeave` — not denormalized.

**Role (User)**:
Application-level enum on `User` with values `Admin`, `User`, `ClientManager`. **Data only** — not currently wired to authorization (no claim mapping). Any authenticated Entra user can call every endpoint today.

**Current year**:
Server clock year (`DateTime.UtcNow.Year`). All new `UserLeave` rows — whether from user creation or LeaveType backfill — are tagged with the current year. There is no automatic year rollover yet.

## Relationships

- A **User** has many **UserLeaves** (one per `LeaveType` per `Year`).
- A **UserLeave** belongs to exactly one **User** and exactly one **LeaveType**.
- A **LeaveType** is global; `UserLeaves` reference it but the type is not user-scoped.
- Deleting a **User** cascades to their **UserLeaves**.
- Archiving a **LeaveType** does _not_ delete or hide its **UserLeaves**; they remain editable.

## Rules

- **Backfill on add (LeaveType):** Creating a new `LeaveType` creates one `UserLeave` row tagged with the current year for every existing user, using the new type's `DefaultTotalDays`.
- **No propagation on edit (LeaveType):** Editing `DefaultTotalDays` on an existing `LeaveType` does not change any existing `UserLeave.TotalDays`. The edit only affects future backfills (new users, next year). Why: silently rewriting historical allocations every time an admin tweaks a default would be destructive and surprising.
- **No add/remove leaves at user level:** The user form exposes only `TotalDays` and `TakenDays` editing on each row. New leaves arrive via `LeaveType` creation; they go away via type archiving (the row stays visible).
- **Uniqueness:**
  - `User.Email` is unique (case-insensitive).
  - `LeaveType.Name` is unique among non-archived types (case-insensitive).
  - `UserLeave (UserId, LeaveTypeId, Year)` is unique.

## Example dialogue

> **Dev:** "If I delete a **LeaveType**, what happens to people who had taken days under it?"
> **Domain expert:** "We don't delete — we archive. The row stays on each **User**'s form so the admin can keep recording days through the rest of the year. New users just don't get that type backfilled."

> **Dev:** "When I change the default for **Verlof** from 20 to 22, does everyone's 2026 **Verlof** balance go up?"
> **Domain expert:** "No. That edit is for next year's new allocations. Existing 2026 rows are untouched — admin edits those per user if needed."

## Flagged ambiguities

- "Name" on a leave — initially treated as a free-text column on each user's leave row; revised: **Name** lives on `LeaveType` only. `UserLeave` reads it through the relationship.
- "Role" — singular enum on `User` (Admin | User | ClientManager). The admin mockups show multi-role checkboxes (Consultant, Admin, SysAdmin, Financial controller, Client manager); that richer model is deferred and is **not** in scope for this iteration.

## Out of scope (deferred)

The product requirements doc (`docs/product/requirements.md` §Users) and admin mockups describe a richer User (First/Last/Nickname, Personnel Number, Active, Staff, Start/End date, Phone, Hours per day, Dima code, Title, multi-role) and a leave-type rollover workflow. None of that is in this iteration; the requirements doc is deliberately ahead of the implementation. Likewise: year rollover (manual for now), role-based authorization (any authed user can hit every endpoint), and time-entry-driven `TakenDays` computation.
