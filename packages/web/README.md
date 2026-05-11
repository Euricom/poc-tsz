# web-tanstack-start

TanStack Start frontend for the dotnet-spa template. Uses TanStack Router (file-based), TanStack Query, Tailwind CSS v4, and connects to the .NET API.

## Getting Started

```bash
# from the workspace root
bun run dev:tanstack

# or from this directory
bun run dev
```

The dev server runs on http://localhost:3000. Make sure the API is running (`bun run dev:api` from the root).

## Scripts

| Script    | Description              |
| --------- | ------------------------ |
| `dev`     | Start dev server         |
| `build`   | Production build         |
| `preview` | Preview production build |
| `test`    | Run tests with Vitest    |

## Project Structure

```
src/
  api/                  API client (openapi-fetch, generated types)
  components/           Shared components
  integrations/         TanStack Query provider setup
  lib/
    auth.server.ts      better-auth instance (Microsoft, stateless)
    auth-client.ts      React auth client (signIn/signOut/useSession)
  routes/
    __root.tsx          HTML shell (no nav — nav lives in _authed.tsx)
    login.tsx           Public login page
    api/auth/$.tsx      better-auth handler (catch-all)
    _authed.tsx         Pathless guard layout (redirects to /login if no session)
    _authed/
      index.tsx         Home (shows user info + logout)
      animals/...       Protected animal routes
  router.tsx            Router factory
  styles.css            Tailwind CSS entry
```

## Authentication

OAuth2 with Microsoft (Entra ID) via [better-auth](https://www.better-auth.com/). Sessions, accounts and verification rows persist to a **shared SQLite database** at `<repo-root>/db/tsz.db` — the same file the .NET API uses for `Animals`. The cookie carries only an opaque session id (with a 5-minute cookie-cache for performance).

### Database setup (one-time)

better-auth shares the SQLite file with the .NET API at `<repo-root>/db/tsz.db`.

1. Start the API once (`bun run dev:api` from the repo root) so EF Core creates `db/tsz.db` with the `Animals` schema and seed data.
2. From `packages/web`, run:
   ```bash
   bunx @better-auth/cli@latest migrate
   ```
   This adds the better-auth tables (`user`, `session`, `account`, `verification`) to the same file.

Re-run step 2 after adding new better-auth plugins.

If you're migrating from the previous setup, the old `packages/api/animals.db` is now orphan and can be removed: `rm packages/api/animals.db*`.

### Required env vars

Copy `.env.example` → `.env` and fill in:

```env
SERVER_URL=http://localhost:5204

# Azure App Registration (Euricom tenant, single-tenant)
AUTH_CLIENT_ID=<application (client) id>
AUTH_CLIENT_SECRET=<client secret value>
AUTH_TENANT_ID=<directory (tenant) id>

# better-auth
BETTER_AUTH_SECRET=<32-byte hex>      # bun -e "console.log(crypto.randomBytes(32).toString('hex'))"
BETTER_AUTH_URL=http://localhost:3000
```

### Azure setup

1. App Registration → Supported account types: **Accounts in this organizational directory only**
2. Authentication → Add a **Web** redirect URI: `http://localhost:3000/api/auth/callback/microsoft`
3. Certificates & secrets → New client secret → copy the **value** into `AUTH_CLIENT_SECRET`
4. Copy the Application (client) ID into `AUTH_CLIENT_ID` and the Directory (tenant) ID into `AUTH_TENANT_ID`

### Debug logging

`auth.server.ts` registers a custom `logger` (level `debug`) plus `hooks.before` / `hooks.after` that log every auth request (`[auth] → GET /sign-in/social/microsoft …` etc.). `auth-client.ts` mirrors this on the browser side (`[auth-client] →/←`). The `_authed` guard logs every session check (`[guard] …`). Login button and logout button log their actions. To quiet things down, drop the `logger.level` or remove the `console.log` calls in `hooks.before/after`.

## Adding Routes

Add a new file in `src/routes/`. TanStack Router auto-generates the route tree.

```tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/my-page')({
  component: MyPage,
});

function MyPage() {
  return <h1>My Page</h1>;
}
```

## Adding shadcn/ui Components

```bash
npx shadcn@latest add button
```
