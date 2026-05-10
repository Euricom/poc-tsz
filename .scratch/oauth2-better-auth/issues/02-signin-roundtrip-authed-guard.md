# Sign-in / sign-out roundtrip with `_authed` guard

Status: needs-triage
Type: AFK

## Parent

`.scratch/oauth2-better-auth/PRD.md`

## What to build

End-to-end browser auth roundtrip in TanStack Start: an unauthenticated user lands on `/auth/login`, clicks "Sign in with Microsoft", is redirected through Entra, lands back on the originally-requested URL with a session cookie. A pathless `_authed` layout route gates every existing protected route by redirecting to `/auth/login` when no session exists. A user menu in the root layout exposes "Sign out" which clears the local session and lands on `/auth/login` with a banner.

This slice does **not** touch the .NET API. The API stays anonymous; the existing animals page continues to work because the browser still calls .NET directly. Token forwarding and API-side validation arrive in slice #3.

## Acceptance criteria

- [ ] `better-auth` and a SQLite adapter (using `bun:sqlite`) are installed in `packages/web` and configured against `packages/web/auth.db`.
- [ ] A server-only `auth.server.ts` exports a configured `auth` instance with the Microsoft social provider, `tenantId` from `MS_TENANT_ID`, scope list `['openid', 'profile', 'email', 'offline_access', 'api://${MS_CLIENT_ID}/access_as_user']`, and cookie session config (SameSite=Lax, HttpOnly, Secure in prod, 30-day idle / 90-day absolute).
- [ ] Better-auth's handler is mounted on the TanStack Start API surface at `/api/auth/*` (catch-all route).
- [ ] `routes/auth/login.tsx` exists as a public route. It renders a single "Sign in with Microsoft" button that posts to `/api/auth/sign-in/microsoft` and shows a "You've been signed out" banner when arriving via logout (e.g., a `?signedOut=1` search param).
- [ ] `routes/_authed.tsx` exists as a pathless layout route. Its `beforeLoad` resolves the session via a server fn; on miss it throws `redirect({ to: '/auth/login', search: { redirect: <current href> } })`.
- [ ] Existing `routes/index.tsx` and `routes/animals/*` are relocated under `routes/_authed/` so they are protected automatically.
- [ ] `__root.tsx` nav exposes a "Sign out" affordance (button or user menu) that calls `auth.api.signOut()` and navigates to `/auth/login?signedOut=1`. Federated logout is **not** performed.
- [ ] An unauthenticated browser hitting `/animals` is redirected to `/auth/login?redirect=/animals`; after successful sign-in the user lands on `/animals`.
- [ ] A signed-in browser hitting `/auth/login` is redirected to `/`.
- [ ] A startup assertion in `auth.server.ts` (or equivalent) verifies the cookie SameSite attribute is `lax`. Misconfiguration fails fast.
- [ ] The .NET API is not modified; existing endpoints stay anonymous; existing tests stay green.
- [ ] One Vitest happy-path test exercises the sign-in route guard: an unauthed render of `_authed` triggers the redirect; a stubbed-session render does not.
- [ ] `packages/web/auth.db` is gitignored and absent from the repo.

## Blocked by

- `01-entra-app-registration.md`
