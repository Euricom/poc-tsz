import { describe, it, expect } from 'vitest';
import { userSchema } from './user-schema';

describe('userSchema', () => {
  it('accepts a valid user', () => {
    const result = userSchema.safeParse({
      name: 'Alice',
      email: 'alice@example.com',
      role: 'User',
    });
    expect(result.success).toBe(true);
  });

  it('accepts all role values', () => {
    for (const role of ['Admin', 'User', 'ClientManager'] as const) {
      const result = userSchema.safeParse({ name: 'X', email: 'x@x.com', role });
      expect(result.success).toBe(true);
    }
  });

  it('rejects empty name', () => {
    const result = userSchema.safeParse({ name: '', email: 'a@a.com', role: 'User' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = userSchema.safeParse({ name: 'Alice', email: 'not-an-email', role: 'User' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid role', () => {
    const result = userSchema.safeParse({ name: 'Alice', email: 'a@a.com', role: 'SuperAdmin' });
    expect(result.success).toBe(false);
  });
});
