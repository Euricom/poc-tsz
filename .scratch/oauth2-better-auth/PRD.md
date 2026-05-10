# PRD: OAuth2 authentication with Microsoft Entra ID via better-auth

Status: needs-triage

## Problem Statement

The application has no authentication today. Every endpoint on the .NET API and every route in the TanStack Start web app is publicly reachable. Before the timesheet domain (time entries, leaves, customers, contracts, users, roles) can be implemented, every request must be tied to a known Euricom employee, and authorization rules (Admin / User / Client Manager) must have a real identity to attach to.

From a user's perspective: a Euricom employee should be able to land on the application, sign in once with their corporate Microsoft account, and use the app without re-authenticating during the working week. An admin should be able to trust that every recorded time entry belongs to the actual employee who entered it.

## Solution

Adopt a Backend-for-Frontend (BFF) shape:

- **TanStack Start** owns authentication. It uses `better-auth` to run an OAuth 2.0 Authorization Code + PKCE exchange with **Microsoft Entra ID** (single-tenant: Euricom). The resulting Entra access token and refresh token are stored server-side in better-auth's session store (a separate SQLite file owned by Start). The browser receives only an HTTP-only session cookie.
- **The .NET API** is a stateless resource server. Every endpoint (except `/` and `/openapi/*`) requires a valid Entra-issued JWT. Validation uses `Microsoft.Identity.Web` against Entra's JWKS, with `aud`, `iss`, and `tid` pinned to the Euricom tenant and to the API's custom scope.
- **The browser never holds a token.** All API calls go through TanStack Start server functions that wrap the existing `openapi-fetch` wrappers. A server-side middleware on the openapi-fetch client reads the current request's session, attaches the Entra access token as a Bearer header, transparently refreshes on 401, and retries once.
- **Future Microsoft Graph access** (out of scope for this PRD) will use a separate client-credentials grant, not the user's delegated token.

## User Stories

1. As a Euricom employee, I want to open the application URL in my browser and sign in with my corporate Microsoft account, so that I do not need to remember a separate password.
2. As a Euricom employee, I want to land on a sign-in page when I am not authenticated, so that it is obvious how to start.
3. As a Euricom employee, I want to click "Sign in with Microsoft" once, so that I am taken through the Entra authorization flow without further input on machines where I am already signed into Microsoft 365.
4. As a Euricom employee, I want my session to persist across browser restarts for up to 30 days of activity, so that I am not forced to re-authenticate during normal weekly use.
5. As a Euricom employee, I want my session to expire after 90 days regardless of activity, so that the application is not left open indefinitely on lost devices.
6. As a Euricom employee, I want the application to silently refresh my access token in the background when it expires after one hour, so that I do not see authentication errors mid-task.
7. As a Euricom employee, I want to click "Sign out" in the navigation, so that my session on this application is cleared.
8. As a Euricom employee, I want signing out of this application to **not** sign me out of Outlook, Teams, or other Microsoft 365 apps, so that I do not disrupt unrelated work.
9. As a Euricom employee, I want to be redirected to `/auth/login` after signing out, so that it is clear the action succeeded.
10. As a first-time Euricom user of the application, I want a `User` record to be created automatically on my first authenticated request, prefilled with default leave balances (leave: 20, adv: 5, ancientiteit: 0, sickness: 0), so that I can start using the app immediately.
11. As the very first user of a fresh deployment, I want my account to be assigned the `Admin` role automatically, so that I can promote other users without manual database edits.
12. As any subsequent user, I want my account to be created with the `User` role by default, so that no privilege is granted accidentally on first login.
13. As an unauthenticated user, I want to be redirected to `/auth/login` when I attempt to navigate to a protected route, so that I am not shown a broken UI.
14. As an unauthenticated user, I want the URL I originally tried to visit to be preserved as a redirect target, so that I land where I intended after signing in.
15. As an authenticated user, I want every API call to carry my identity automatically, so that the server can attribute time entries, leaves, and changes to me without my involvement.
16. As an authenticated user, I want my Entra `oid` (object id), not my email, to be the stable key the system uses to identify me, so that an email change does not split my identity.
17. As a security-conscious user, I want my Entra access token to never be readable by JavaScript in the browser, so that an XSS bug in any unrelated dependency cannot exfiltrate my Microsoft credentials.
18. As an Admin, I want the API to reject any request with an invalid, expired, or wrong-audience JWT, so that forged tokens cannot reach business endpoints.
19. As an Admin, I want the API to reject tokens from any tenant other than Euricom's, so that a Microsoft account from another organization cannot accidentally or maliciously reach our API.
20. As an Admin, I want roles (Admin / User / Client Manager) to be stored in our application database and editable in the application's own UI (future work), so that promoting a colleague does not require an IT ticket.
21. As a developer, I want existing wrapper functions in `packages/web/src/api/animals.ts` to keep their current signatures and tests, so that the auth migration is not a disruptive rewrite.
22. As a developer, I want the auth check to live in a single pathless layout route (`routes/_authed.tsx`), so that I cannot accidentally publish a new protected route without auth simply by forgetting to copy a guard.
23. As a developer, I want every server function to also enforce auth on its own, so that direct calls to `/_serverFn/*` from outside the app are rejected even if the route guard is bypassed.
24. As a developer, I want existing unit tests in `packages/web/src/api/animals.spec.ts` to keep passing without modification, so that adding auth is not a tax on test maintenance.
25. As a developer, I want existing integration tests in `packages/api.tests.integration` to keep passing by using a `TestAuthHandler` that synthesizes a `ClaimsPrincipal` from a header, so that handler tests do not have to mint real JWTs.
26. As a developer, I want one new end-to-end test (`auth-flow.spec.ts`) that exercises the real sign-in → session → server-fn → 401-and-refresh path, so that the auth design itself has a contract test.
27. As a developer, I want the auth-bypass test mode to be impossible to enable in production, so that a misconfigured environment cannot disable authentication.
28. As a developer, I want the OpenAPI document at `/openapi/v1.json` to remain anonymous, so that `bun run gen:api` continues to work without authentication.
29. As a developer, I want the better-auth SQLite database to live in `packages/web/auth.db`, separate from `packages/api/animals.db`, so that domain and auth migrations cannot collide.
30. As a developer, I want a single Entra app registration (web client + API resource) for the POC, so that there is one client ID and one secret to manage; splitting into two registrations is a future config change, not a code change.
31. As a developer, I want the Entra access token requested by better-auth to carry `aud=api://<app-id>` (not the Microsoft Graph audience), so that the .NET API can validate it without an On-Behalf-Of exchange.
32. As a developer, I want the Entra app manifest's `accessTokenAcceptedVersion` set to `2`, so that token claims are predictable and v1/v2 audience drift is avoided.
33. As a developer, I want `offline_access` requested explicitly in the OAuth scope list, so that Entra returns a refresh token and the 30-day idle session story is real.
34. As a developer, I want CSRF protection to come from existing framework defaults (SameSite=Lax cookie + TanStack Start server-fn custom-header requirement + OAuth `state` param), with a startup assertion confirming the cookie attribute, so that no custom CSRF code is added.
35. As an operator, I want client secret and tenant config in `.env` (web) and `appsettings.Development.json` / `dotnet user-secrets` (.NET), with no secrets committed to the repo, so that credentials cannot leak via git.

## Implementation Decisions

### Architecture

- **BFF pattern.** TanStack Start is the auth boundary; the .NET API is a stateless resource server.
- **Single Entra app registration**, dual-purpose (web confidential client + API resource server). Custom delegated scope `api://<app-id>/access_as_user`.
- **Single-tenant Euricom.** Entra "Accounts in this organizational directory only". JWT validation pins `iss`, `tid`, and `aud`.
- **`accessTokenAcceptedVersion: 2`** in the Entra app manifest.
- **Future Microsoft Graph access uses a separate client-credentials grant**, not the delegated token; out of scope for this PRD.

### Web (`packages/web`)

- **Better-auth instance** lives in a server-only module. Configured with the Microsoft social provider, single-tenant, and the scope list `['openid', 'profile', 'email', 'offline_access', 'api://<app-id>/access_as_user']`. Session storage = better-auth's SQLite adapter against `packages/web/auth.db`. Cookie: SameSite=Lax, HttpOnly, Secure (in prod), 30-day idle / 90-day absolute.
- **Better-auth handler mount.** A TanStack Start API catch-all route mounts better-auth at `/api/auth/*`.
- **`client.ts` becomes server-only.** Renamed/relocated so Vite cannot bundle it for the browser. Singleton openapi-fetch client. New async middleware:
  - reads the current request via `getWebRequest()` (Start's AsyncLocalStorage),
  - resolves the better-auth session,
  - attaches `Authorization: Bearer <entra_access_token>` to the outgoing request,
  - on 401 from .NET, calls `auth.api.refreshSession()` and retries once,
  - is skipped entirely when `process.env.NODE_ENV === 'test'`.
- **Existing API wrappers in `animals.ts` are unchanged.** Each wrapper is invoked from the browser via a per-wrapper `createServerFn` shell.
- **`authedFn` deep module.** A small wrapper that takes a `createServerFn` body, asserts a session exists, and either invokes the body with the session attached to context or throws a 401 Response. Applied to every server-fn shell.
- **Pathless `_authed` route layout.** `routes/_authed.tsx` runs a `beforeLoad` that calls a `getCurrentSession` server fn; on miss, throws `redirect({ to: '/auth/login', search: { redirect: location.href } })`. All currently-existing routes (`/`, `/animals/*`) move under `_authed/`.
- **Public route surface.** `/auth/login` (sign-in page with a single "Sign in with Microsoft" button posting to `/api/auth/sign-in/microsoft`) and the better-auth handler at `/api/auth/*`. Nothing else.
- **User menu + logout** added to `__root.tsx` nav. "Sign out" calls `auth.api.signOut()`, redirects to `/auth/login` with a "You've been signed out" banner.

### API (`packages/api`)

- **JWT bearer registered in `Program.cs`** via `Microsoft.Identity.Web`'s `AddMicrosoftIdentityWebApi`. Tenant, client id, and audience read from configuration. `ValidAudiences = ['api://<app-id>', '<app-id>']` to tolerate both forms.
- **Default authorization policy = `RequireAuthorization()`** on every minimal-API endpoint. `/` and `/openapi/*` are explicitly `.AllowAnonymous()`.
- **`User` entity** added to the existing DbContext (or a new `UserDbContext` — to be decided during implementation; default: extend `AnimalDbContext` for the POC, split if it grows). Fields:
  - `Id` (int, PK)
  - `EntraOid` (Guid, unique index)
  - `Email` (string)
  - `Name` (string)
  - `Role` (string enum: `User` | `Admin` | `ClientManager`)
  - leave-related fields per `requirements.md` (leave, adv, ancientiteit, sickness — initial defaults 20/5/0/0)
- **`CurrentUserAccessor` service** (scoped). Deep module exposing `Task<User> GetCurrentUserAsync()`. Reads `oid`, `email`, `name`, `tid` from the validated `ClaimsPrincipal`. Look-up by `EntraOid`; on miss, insert with defaults; on unique-constraint violation (parallel first-request race), retry once via re-fetch. Caches the resolved `User` in the request scope. Becomes the single entry point handlers use to know "who is the caller".
- **First-user-is-admin bootstrap.** Inside the create path, if `User` table is empty before insert, role = `Admin`; otherwise `User`. No config list.
- **`TestAuthHandler`** registered when `app.Environment.IsEnvironment("Testing")`. Reads `X-Test-User: <oid>` header, synthesizes a `ClaimsPrincipal` with `oid`, `email`, `tid` claims for the test. Production refuses to start with `Testing` env via a startup guard.
- **Database migrations.** Replace `db.Database.EnsureCreated()` in `Program.cs` with `db.Database.Migrate()`. Add an EF Core migration introducing the `User` table and unique index on `EntraOid`.

### Configuration & Secrets

- **`packages/web/.env`** (gitignored): `MS_CLIENT_ID`, `MS_CLIENT_SECRET`, `MS_TENANT_ID`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, existing `SERVER_URL`.
- **`packages/api/appsettings.json` / `appsettings.Development.json`**: `Auth:TenantId`, `Auth:ClientId`, `Auth:Audience`, `Auth:Instance`. Local secret values live in `dotnet user-secrets` or `appsettings.Development.json` (gitignored).
- **Entra app registration (manual portal step, captured in implementation issue):** Web platform (not SPA), redirect URIs `http://localhost:3000/api/auth/callback/microsoft` and the future production URL, expose API scope `access_as_user`, `accessTokenAcceptedVersion: 2`, single-tenant.

### Session lifetime

- Cookie: 30 days idle, 90 days absolute.
- Access token refresh: lazy, triggered by 401 from .NET; one retry.
- Logout: local only — clears better-auth session row and cookie. Entra SSO is intentionally untouched.

## Testing Decisions

### What makes a good test here

Tests assert observable contract behaviour, never library internals. We do not test that JwtBearer validates JWTs (Microsoft tests that). We do not test better-auth's session storage (better-auth tests that). We test the small amount of project-specific glue: the user-reconciliation logic, the server-fn auth wrapper, and one end-to-end contract that the moving parts are wired together correctly.

### Modules to test

1. **`CurrentUserAccessor`** (.NET unit tests in `packages/api.tests`):
   - Resolves the existing `User` row when `EntraOid` matches.
   - Creates a new `User` row with default leave balances and `Role = User` when `EntraOid` is unknown.
   - Assigns `Role = Admin` when the `User` table is empty before insert.
   - Survives a parallel first-request race: simulate a unique-constraint violation, expect the second call to re-fetch and return the winner's row.
   - Maps `oid`, `email`, `name` claims correctly onto entity fields.

2. **`authedFn` server-fn wrapper** (web unit tests with Vitest):
   - Throws a 401 Response when no session is resolvable.
   - Invokes the inner body with the session attached to context when a session exists.
   - (No need to test the wrapped handlers themselves — those have their own tests.)

3. **`auth-flow.spec.ts` end-to-end contract test** (web, Vitest):
   - Mounts a fake Entra IdP (or stubs `auth.api.signInSocial` to return canned tokens),
   - Drives sign-in → session creation → calling a server fn → middleware attaches Bearer → mocked .NET returns 401 → middleware refreshes → retries → success,
   - Asserts the outgoing request to the .NET mock carries the new Bearer.

### Tests that must keep passing without changes

- `packages/web/src/api/animals.spec.ts` (existing wrapper tests). Achieved by gating the new auth middleware on `process.env.NODE_ENV === 'test'`.
- `packages/api.tests.integration` existing integration tests. Achieved by registering `TestAuthHandler` when `IsEnvironment("Testing")` and updating any test-host bootstrap that needs to opt in.

### Prior art

- `packages/web/src/api/animals.spec.ts` — fetch-mocking pattern for wrapper tests. New `authedFn` tests follow the same style (vitest + hoisted mocks).
- `packages/api.tests/Modules/Animals/*` — xUnit unit-test layout for service-style classes (`AnimalService`). New `CurrentUserAccessor` tests follow the same arrangement.
- `packages/api.tests.integration` — `WebApplicationFactory`-based handler tests. The `TestAuthHandler` is registered via the same `ConfigureWebHost` hook these tests already use.

## Out of Scope

- **Microsoft Graph API access** for the user (calendar, mail, profile photo, etc.). Future work; will use a separate client-credentials grant and a dedicated service in the .NET API. Not addressed by the user's delegated token.
- **Multi-tenant support.** Single-tenant Euricom is hard-pinned in JWT validation.
- **Federated (RP-initiated) logout** that signs the user out of Microsoft 365 globally. Possible future opt-in if a kiosked-machine use case appears.
- **Entra App Roles or Entra Group-based authorization.** Roles are domain-managed in the local `User.Role` column.
- **An in-app "promote to Admin" UI.** Bootstrap is "first user wins"; subsequent role changes will be addressed when the Users admin screen lands (a separate feature per `requirements.md`).
- **Bootstrap-admin seed list** in configuration. Explicitly rejected in favour of first-user-wins for POC simplicity.
- **A second Entra app registration** for the API resource. Explicitly rejected for POC scale; promotion is config-only later.
- **Replacing `openapi-fetch` with TanStack Query / RPC**. The wrappers stay.
- **Splitting auth storage to Postgres**. Stays SQLite for the POC; the better-auth adapter swap is one config line later.
- **CSRF tokens (double-submit cookie)** beyond the framework-default protections.
- **Account linking, MFA enforcement, password reset** — not relevant; Entra owns identity entirely.
- **Real-time session revocation** when an Entra account is disabled mid-session. Mitigated by the 1-hour access-token TTL — disabled accounts fail their next refresh and bounce to re-auth on next 401. A push-based revocation channel is not built.

## Further Notes

- The architecture document `docs/product/architecture.md` already names better-auth and Entra ID as the planned auth stack; this PRD turns that note into an implementation contract. The doc's sketch of `routes/auth/login.tsx` and `features/auth/` aligns with this PRD's structure.
- The `gen:api` workflow remains: developer runs the .NET API locally, then `bun run --filter web gen:api`. Because `/openapi/v1.json` stays anonymous, no token plumbing is needed.
- The implementation should land as a sequence of focused issues rather than a single mega-PR. A reasonable first cut at ticket boundaries:
  1. Entra app registration + manifest changes (manual, captured as a checklist issue).
  2. Better-auth instance, handler mount, sign-in/sign-out pages, `_authed` layout.
  3. Server-only `client.ts` middleware + per-wrapper server-fn shells + `authedFn` helper.
  4. `Microsoft.Identity.Web` registration, `RequireAuthorization()` default, `AllowAnonymous` exemptions.
  5. `User` entity, EF migration, `CurrentUserAccessor` with race-safe find-or-create.
  6. `TestAuthHandler` + integration-test wiring.
  7. End-to-end `auth-flow.spec.ts` contract test.
- Token-version landmine: confirm the token actually carries `aud=api://<app-id>` (or `<app-id>` for v2 with `accessTokenAcceptedVersion: 2`) by decoding it during initial integration. If the token still has `aud=https://graph.microsoft.com`, the scope list in better-auth is wrong — that is the most common first-attempt failure mode.
- Refresh-lock race: when two parallel server fns hit a 401 simultaneously, both attempt a refresh. Better-auth's `account` row update uses optimistic locking on `updatedAt`, so only one refresh wins; the loser re-reads the new token. We rely on this rather than implementing app-level locking.
- The first-user-is-admin bootstrap is recorded as a known limitation: in dev, the first hit wins; if the wrong person hits it, fix is `UPDATE User SET Role='Admin' WHERE …`. Acceptable for the POC; revisit if/when promoting via UI lands.
