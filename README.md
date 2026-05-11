# POC Timesheet Zone

Sample application for AI learning purposes.

## Prerequisites

Install the following tools

- [Bun](https://bun.sh/)
- [Dotnet](https://dotnet.microsoft.com/)
- [VS Code](https://code.visualstudio.com/)

Make sure you have an API key for the following MCP tools:

- [Ref](https://ref.tools/keys)
- [Exa](https://dashboard.exa.ai/api-keys)

Configure the following environment variables:

- `REF_API_KEY`
- `EXA_API_KEY`

## Local development

### Web (`packages/web`)

Copy `.env.example` to `.env` and fill in the Microsoft app registration values (`AUTH_CLIENT_ID`, `AUTH_CLIENT_SECRET`, `AUTH_TENANT_ID`) plus a 32-byte hex `AUTH_COOKIE_SECRET`. Then:

```bash
bun run dev
```

### API (`packages/api`)

The API validates Microsoft Entra-issued JWTs on `/api/animals`. Configuration is loaded from `packages/api/.env` (via `DotNetEnv`). Copy `.env.example` to `.env` and fill in:

```bash
cd packages/api && cp .env.example .env
# then edit .env with the tenant/client IDs (same client ID as the web app)
```

Then run it from the repo root:

```bash
bun run dev:api
```

The `__` in env-var names is the ASP.NET section separator: `AzureAd__TenantId` maps to the `AzureAd:TenantId` configuration key. Use the same convention for any nested settings.

#### Bypass auth for local testing

To run the API without token validation (e.g. to hit endpoints directly with curl), add this line to `packages/api/.env`:

```
Auth__Disabled=true
```

A warning is logged at startup when auth is disabled. Default is `false` — production stays secure unless the flag is explicitly set.
