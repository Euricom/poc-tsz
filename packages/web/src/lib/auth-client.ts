import { createAuthClient } from 'better-auth/react';

const LOG_PREFIX = '[auth-client]';

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  fetchOptions: {
    onRequest(ctx) {
      console.log(`${LOG_PREFIX} → ${ctx.method ?? 'GET'} ${ctx.url}`);
    },
    onResponse(ctx) {
      console.log(`${LOG_PREFIX} ← ${ctx.response.status} ${ctx.request.url}`);
    },
    onError(ctx) {
      console.error(`${LOG_PREFIX} ✗ ${ctx.request.url}`, ctx.error);
    },
  },
});

export const { signIn, signOut, useSession } = authClient;
