# User entity + lazy provisioning + `/me`

Status: needs-triage
Type: AFK

## Parent

`.scratch/oauth2-better-auth/PRD.md`

## What to build

Introduce the domain `User` entity in the .NET API and a `CurrentUserAccessor` deep module that reconciles incoming Entra JWT claims with a local `User` row, lazily creating the row on first authenticated request with default leave balances (`leave: 20, adv: 5, ancientiteit: 0, sickness: 0`). The very first user provisioned in a fresh database is assigned `Role = Admin`; subsequent users default to `Role = User`. Expose the resolved user via a new authenticated `GET /api/me` endpoint, and surface "Hi, &lt;name&gt;" in the web app's root navigation by calling `/me` through a server-fn shell.

This slice converts the abstract token identity from slice #3 into a concrete domain user, and delivers the smallest visible UI proof of it.

## Acceptance criteria

### Schema and migration

- [ ] A `User` entity exists in the .NET API with at least the following fields:
  - `Id` (int, PK, identity)
  - `EntraOid` (Guid, NOT NULL, unique index)
  - `Email` (string)
  - `Name` (string)
  - `Role` (string, persisted as enum: `User` | `Admin` | `ClientManager`)
  - leave columns: `LeaveDays`, `AdvDays`, `AncienniteitDays`, `SicknessDays` (or equivalent naming consistent with `requirements.md`).
- [ ] `Program.cs` calls `db.Database.Migrate()` instead of `EnsureCreated()`. An EF Core migration introducing the `User` table with the unique index on `EntraOid` is committed.

### `CurrentUserAccessor` deep module

- [ ] A scoped `CurrentUserAccessor` service exposes `Task<User> GetCurrentUserAsync()`.
- [ ] It reads `oid`, `email`, `name`, `tid` from `HttpContext.User`'s claims; `oid` and `tid` are required; missing → 401-equivalent failure.
- [ ] On lookup miss, it inserts a new `User` with claim-derived `EntraOid`/`Email`/`Name`, default leave balances per `requirements.md:139`, and `Role = Admin` only when the `User` table is empty before insert (else `Role = User`).
- [ ] On unique-constraint violation during insert (parallel first-request race), it re-fetches the row by `EntraOid` and returns the winner's row; the second caller never throws.
- [ ] It caches the resolved `User` for the request scope; multiple calls within a single request hit the DB at most twice (lookup + optional insert + optional re-fetch on race).
- [ ] Unit tests in `packages/api.tests` cover:
  - existing-user lookup,
  - first-time provisioning with default balances,
  - first-user-is-admin bootstrap,
  - non-first-user defaults to `Role = User`,
  - race-safe behavior on simulated unique-constraint violation,
  - claim-mapping correctness (`oid`, `email`, `name`).

### `/api/me` endpoint and web surface

- [ ] A `GET /api/me` minimal-API endpoint requires authentication, calls `CurrentUserAccessor.GetCurrentUserAsync()`, and returns a DTO with at least `id`, `entraOid`, `email`, `name`, `role`.
- [ ] An integration test in `packages/api.tests.integration` confirms `/api/me` for a `TestAuthHandler`-synthesized user returns `Role = Admin` on a fresh DB and `Role = User` on a subsequent different `oid`.
- [ ] OpenAPI is regenerated; `bun run gen:api` produces an updated `packages/web/src/api/schema.ts` containing the `/api/me` shape.
- [ ] A new server-fn shell `getCurrentUser` (guarded by `authedFn`) calls `client.GET('/api/me')` and is consumed by `__root.tsx` to render "Hi, &lt;name&gt;" in the nav for authenticated users.
- [ ] The nav greeting only renders inside the `_authed` layout (not on `/auth/login`).

## Blocked by

- `03-token-forwarding-and-api-validation.md`
