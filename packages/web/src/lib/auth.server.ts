import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { betterAuth } from 'better-auth';
import { createAuthMiddleware } from 'better-auth/api';
import { tanstackStartCookies } from 'better-auth/tanstack-start';

const LOG_PREFIX = '[auth]';

function ts() {
  return new Date().toISOString();
}

// Sessions, accounts and verification rows persist to the shared SQLite DB
// at <repo-root>/db/tsz.db — the same file the .NET API uses for `Animals`.
// Sharing the file lets the C# API later join domain rows to the better-auth
// `user` table without a sync pipeline.
const DEFAULT_DB_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../db/tsz.db');
const db = new Database(process.env.AUTH_DB_PATH ?? DEFAULT_DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  secret: process.env.BETTER_AUTH_SECRET,
  database: db,

  logger: {
    level: 'debug',
    log(level, message, ...args) {
      console.log(`${ts()} ${LOG_PREFIX} ${level}: ${message}`, ...args);
    },
  },

  session: {
    // Cookie cache disabled: Microsoft Graph hands back the profile photo
    // as a ~10KB base64 data URL in `user.image`, which would push the
    // signed cookie past the 4KB-per-cookie browser limit and chunk it
    // into 4 parts. With WAL-mode SQLite, resolving the opaque session
    // token against the DB on every request is cheap enough.
    cookieCache: { enabled: false },
  },

  socialProviders: {
    microsoft: {
      clientId: process.env.AUTH_CLIENT_ID!,
      clientSecret: process.env.AUTH_CLIENT_SECRET!,
      tenantId: process.env.AUTH_TENANT_ID,
      prompt: 'select_account',
    },
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      console.log(
        `${ts()} ${LOG_PREFIX} → ${ctx.method} ${ctx.path}`,
        ctx.query && Object.keys(ctx.query).length ? { query: ctx.query } : '',
      );
    }),
    after: createAuthMiddleware(async (ctx) => {
      const status =
        ctx.context.returned instanceof Response ? ctx.context.returned.status : ctx.context.returned ? 200 : undefined;
      console.log(`${ts()} ${LOG_PREFIX} ← ${ctx.method} ${ctx.path}`, status !== undefined ? `status=${status}` : '');
    }),
  },

  plugins: [tanstackStartCookies()],
});
