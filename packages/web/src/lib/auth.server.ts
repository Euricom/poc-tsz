import Database from 'better-sqlite3';
import { betterAuth } from 'better-auth';
import { createAuthMiddleware } from 'better-auth/api';
import { tanstackStartCookies } from 'better-auth/tanstack-start';

const LOG_PREFIX = '[auth]';

function ts() {
  return new Date().toISOString();
}

export const auth = betterAuth({
  baseURL: process.env.APP_BASE_URL ?? 'http://localhost:3000',
  secret: process.env.AUTH_COOKIE_SECRET,
  database: new Database(process.env.AUTH_DB_URL?.replace(/^file:/, '')),

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
    // into 4 parts.
    cookieCache: { enabled: false },
  },

  socialProviders: {
    microsoft: {
      clientId: process.env.AUTH_CLIENT_ID!,
      clientSecret: process.env.AUTH_CLIENT_SECRET!,
      tenantId: process.env.AUTH_TENANT_ID,
      prompt: 'select_account',
      disableDefaultScope: true,
      scope: ['openid', 'profile', 'email', 'offline_access', `api://${process.env.AUTH_CLIENT_ID}/access_as_user`],
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

export async function getAccessToken(headers: Headers): Promise<string | null> {
  const res = await auth.api.getAccessToken({
    body: { providerId: 'microsoft' },
    headers,
  });
  return res?.accessToken ?? null;
}
