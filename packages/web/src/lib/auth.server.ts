import { betterAuth } from 'better-auth';
import { createAuthMiddleware } from 'better-auth/api';
import { tanstackStartCookies } from 'better-auth/tanstack-start';

const LOG_PREFIX = '[auth]';

function ts() {
  return new Date().toISOString();
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  secret: process.env.BETTER_AUTH_SECRET,

  // Stateless: no `database`. better-auth signs/encrypts the session into
  // the cookie itself, and OAuth state + account info also live in cookies
  // (storeStateStrategy="cookie", storeAccountCookie auto-true with no DB).
  logger: {
    level: 'debug',
    log(level, message, ...args) {
      console.log(`${ts()} ${LOG_PREFIX} ${level}: ${message}`, ...args);
    },
  },

  session: {
    cookieCache: {
      enabled: false,
    },
  },
  storeAccountCookie: false,

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
