# End-to-end auth-flow contract test

Status: needs-triage
Type: AFK

## Parent

`.scratch/oauth2-better-auth/PRD.md`

## What to build

A single Vitest spec, `packages/web/src/api/auth-flow.spec.ts` (or a sibling location consistent with the existing test layout), that exercises the project-specific auth wiring end-to-end:

1. A simulated sign-in produces a session with stored access and refresh tokens.
2. A server-fn invocation under that session triggers the openapi-fetch middleware.
3. The middleware attaches the access token as a Bearer header on the outgoing request.
4. The (mocked) .NET endpoint returns 401 on the first call.
5. The middleware calls `auth.api.refreshSession()`, obtains a new access token, retries the request once.
6. The retry succeeds and the server-fn returns the expected payload.

The test asserts the *contract* of the auth design (token attaches; 401 triggers exactly one refresh + retry; second 401 does not loop) without exercising real Entra or real .NET. It is the regression net for slice #3.

## Acceptance criteria

- [ ] A new spec file exists at the conventional location for web tests in this repo and is picked up by `bun run --filter web test`.
- [ ] The test stubs/mocks the better-auth `auth.api` surface (or uses a local in-memory better-auth instance) so no external Entra round-trip is needed.
- [ ] The test stubs `globalThis.fetch` (or equivalent) so the .NET destination is mocked. The mock returns 401 once, then 200 with a known body.
- [ ] The first outgoing fetch carries `Authorization: Bearer <initial-token>`.
- [ ] After the 401, the middleware invokes the refresh path exactly once and the second outgoing fetch carries `Authorization: Bearer <refreshed-token>` (different from the initial token).
- [ ] If both attempts return 401, the test asserts the middleware does **not** loop; it surfaces the failure as `ApiRequestError(401)` on the second attempt.
- [ ] The test does not depend on filesystem state of `auth.db`; better-auth state is in-memory or per-test fixture.
- [ ] The test runs deterministically; no real network access, no time-based flakiness.

## Blocked by

- `03-token-forwarding-and-api-validation.md`
