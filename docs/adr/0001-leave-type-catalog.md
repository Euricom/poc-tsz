# 0001 — Global LeaveType catalog with per-user per-year allocation rows

A user's leaves are modeled as two entities: a global, admin-managed `LeaveType` catalog (name, allowed mode, default total days, color) and per-user `UserLeave` rows that reference a `LeaveType` and carry the editable values (`TotalDays`, `TakenDays`) scoped by `Year`. Creating a `LeaveType` backfills a row for the current year on every existing user; deleting a `LeaveType` archives it (existing `UserLeave` rows are kept and remain editable); admins cannot add or remove leaves at the user level. We rejected free-text `Name` on each leave row (Q2 → revised in Q5): that approach allowed typo-divergence across users, made "rename Verlof" impossible without a data migration, and gave us no single place to set defaults. We rejected a single User+Leave aggregate without a separate catalog because the user explicitly wanted a root-level admin page to manage the catalog independently of users.

Each `LeaveType` carries a `Color` (hex string, e.g. `#3B82F6`) that downstream UI surfaces (catalog list, future calendar / timesheet views) use to visually distinguish categories. Color lives on `LeaveType` rather than `UserLeave` for the same reason `Name` does: one canonical value, edited in one place, propagates everywhere.

## Consequences

- Schema has a real FK from `UserLeave.LeaveTypeId` → `LeaveType.Id`; both entities live in the same `UsersDbContext` so the constraint is DB-enforced.
- Renaming a `LeaveType` propagates everywhere immediately (one canonical name). That is the intended behavior.
- Editing `DefaultTotalDays` does **not** propagate to existing `UserLeave.TotalDays` — only affects future backfills. This rule is in `CONTEXT.md`.
- Editing `Color` propagates everywhere immediately (read through the `LeaveType` relationship — not denormalized onto `UserLeave`). Intended behavior, same shape as `Name`.
- Year rollover is deliberately not modeled yet; current year only. Each rollover decision (auto-job vs. manual button) is a future ADR.
