# Token forwarding + .NET validation tracer bullet

Status: needs-triage
Type: AFK

## What to build

Close the browser → Start → .NET pipe so that authenticated requests carry the user's Entra access token end-to-end and the .NET API validates it. After this slice, the existing animals page works exactly as before — but every API call goes through a TanStack Start server function, the Bearer token is injected server-side from the better-auth session, and the .NET API requires (and validates) a real Entra-issued JWT.

Existing wrapper unit tests in `packages/web/src/api/animals.spec.ts` and existing .NET integration tests in `packages/api.tests.integration` must keep passing without test-body modifications, via a test-mode bypass on the web side and a `TestAuthHandler` on the .NET side.

This is the actual tracer bullet: it cuts through the browser, the Start server, the openapi-fetch middleware, the Entra JWT validation, and the existing animals handler in a single end-to-end demo.

## Acceptance criteria

### Web — server-fn shells and token injection

- [ ] `client.ts` is renamed/relocated so it is server-only (e.g. `client.server.ts`), and Vite refuses to bundle it for the browser.
- [ ] An async middleware on the openapi-fetch client reads the current request via `getWebRequest()`, resolves the better-auth session, and attaches `Authorization: Bearer <accessToken>` to outgoing requests.
- [ ] On a 401 response from .NET, the middleware calls `auth.api.refreshSession()` once, reissues the request with the new token, and propagates a final non-401 response or throws `ApiRequestError`.
- [ ] The middleware short-circuits (no-op) when `process.env.NODE_ENV === 'test'`.
- [ ] A new `lib/server-fn.ts` exports an `authedFn` helper that wraps a `createServerFn` body, asserts a session exists via `auth.api.getSession({ headers })`, and either invokes the body with the session in context or throws `new Response('Unauthorized', { status: 401 })`.
- [ ] Each existing wrapper in `packages/web/src/api/animals.ts` (`getAnimals`, `getAnimalById`, `createAnimal`, `updateAnimal`, `removeAnimal`) is exposed to the browser via a per-wrapper `createServerFn` shell guarded by `authedFn`. Components/loaders call the server-fn shells, not the wrappers directly.
- [ ] The wrapper bodies in `animals.ts` are unchanged in signature and import shape (`import { client } from './client'` style stays).
- [ ] `packages/web/src/api/animals.spec.ts` passes unchanged.
- [ ] Unit tests for `authedFn` cover: no session → 401 Response thrown; session present → inner body invoked with session in context.

### API — JWT bearer, default authorization, test handler

- [ ] `Microsoft.Identity.Web` (or `Microsoft.AspNetCore.Authentication.JwtBearer` configured equivalently) is registered in `Program.cs` with tenant, client id, and audience read from `Auth:*` configuration.
- [ ] Token validation pins `iss = https://login.microsoftonline.com/<tenant>/v2.0`, `tid = <euricom-tenant-id>`, and `ValidAudiences = ['api://<app-id>', '<app-id>']`.
- [ ] Default authorization policy on every minimal-API endpoint requires authentication. `/` and `/openapi/*` are explicitly `.AllowAnonymous()`.
- [ ] A `TestAuthHandler` is registered when `app.Environment.IsEnvironment("Testing")`. It reads `X-Test-User: <oid>` (and optionally `X-Test-Email`, `X-Test-Tid`) from the request and synthesizes a `ClaimsPrincipal`.
- [ ] A startup guard refuses to start with `ASPNETCORE_ENVIRONMENT=Testing` outside of `WebApplicationFactory` (e.g. asserts a test-only flag set by the test host is also present).
- [ ] Existing `packages/api.tests` and `packages/api.tests.integration` suites pass unchanged.
- [ ] `bun run gen:api` continues to work against a running .NET dev server (i.e. `/openapi/v1.json` is reachable anonymously).

### End-to-end behavior

- [ ] Manual smoke: signing in via the web app, navigating to `/animals`, and creating/updating/deleting an animal works exactly as before. Network inspector confirms the browser only talks to `/api/auth/*` and `/_serverFn/*` (or the local Start origin) — never to the .NET origin directly.
- [ ] Manual smoke: making a direct `curl` call to a .NET endpoint without `Authorization` returns 401.
- [ ] Manual smoke: hitting a .NET endpoint with a token whose `tid` is not Euricom's returns 401.

## Blocked by

- `02-signin-roundtrip-authed-guard.md`
