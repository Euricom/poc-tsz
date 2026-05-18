import { z } from 'zod';

const envSchema = z.object({
  SERVER_URL: z.url(),
  APP_BASE_URL: z.url().default('http://localhost:3000'),
  AUTH_TENANT_ID: z.string().min(1),
  AUTH_CLIENT_ID: z.string().min(1),
  AUTH_CLIENT_SECRET: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
});

export const env = envSchema.parse(process.env);
