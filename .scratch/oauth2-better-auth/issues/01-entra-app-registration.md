# Entra app registration + secrets bootstrap

Status: needs-triage
Type: HITL

## Parent

`.scratch/oauth2-better-auth/PRD.md`

## What to build

Manual configuration of a single-tenant Entra app registration that will serve as both the web confidential client and the API resource server for the application. The deliverable of this slice is configuration only: an Entra app exists, its credentials and IDs are captured in `.env.example` (web) and a documented `appsettings` template (.NET), and the manifest is correctly shaped so subsequent slices can request and validate API-scoped access tokens.

This is a HITL slice because it requires admin access to the Euricom Entra tenant.

## Acceptance criteria

- [ ] An Entra app registration exists in the Euricom tenant, named e.g. `POC-TSZ`, single-tenant ("Accounts in this organizational directory only").
- [ ] Platform = **Web** (confidential client). Redirect URIs registered: `http://localhost:3000/api/auth/callback/microsoft` (dev) and a production URL placeholder.
- [ ] A client secret has been generated and recorded out-of-band (1Password / dotnet user-secrets / .env), never committed.
- [ ] The app exposes a delegated API scope `access_as_user` under Application ID URI `api://<app-id>`.
- [ ] App manifest has `accessTokenAcceptedVersion: 2`.
- [ ] API permissions include `openid`, `profile`, `email`, `offline_access`, and the custom `api://<app-id>/access_as_user` (delegated, admin-consented).
- [ ] `packages/web/.env.example` lists `MS_CLIENT_ID`, `MS_CLIENT_SECRET`, `MS_TENANT_ID`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, with comments explaining each.
- [ ] `packages/api/appsettings.Development.json` (or a documented `dotnet user-secrets` recipe in the README) shows the required `Auth:TenantId`, `Auth:ClientId`, `Auth:Audience`, `Auth:Instance` keys.
- [ ] `.gitignore` covers `packages/web/.env`, any local `appsettings.Development.json`, and `packages/web/auth.db`.
- [ ] The README or a section of the PRD captures the manual portal steps so a second deployment (e.g. staging) is reproducible.
- [ ] A signed-in developer can decode an access token retrieved via `oauth2-proxy` or any quick test client and confirm `aud=api://<app-id>` (or `aud=<app-id>` with v2), `iss=https://login.microsoftonline.com/<tenant>/v2.0`, `tid=<euricom-tenant-id>`.

## Blocked by

None - can start immediately.
