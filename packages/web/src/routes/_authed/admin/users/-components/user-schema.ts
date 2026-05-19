import { z } from 'zod';

export const userSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().min(1, 'Email is required').email('Must be a valid email').max(200),
  role: z.enum(['Admin', 'User', 'ClientManager']),
});

export type UserFormValues = z.infer<typeof userSchema>;
