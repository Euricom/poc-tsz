import { describe, it, expect } from 'vitest';
import { leaveTypeSchema } from './leave-type-schema';

describe('leaveTypeSchema', () => {
  it('accepts a valid Limited type', () => {
    const result = leaveTypeSchema.safeParse({
      name: 'Verlof',
      allowed: 'Limited',
      defaultTotalDays: 20,
      color: '#3B82F6',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a valid Unlimited type', () => {
    const result = leaveTypeSchema.safeParse({
      name: 'Ziekte',
      allowed: 'Unlimited',
      defaultTotalDays: null,
      color: '#EF4444',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = leaveTypeSchema.safeParse({
      name: '',
      allowed: 'Limited',
      defaultTotalDays: 5,
      color: '#000000',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid hex color', () => {
    const result = leaveTypeSchema.safeParse({
      name: 'Test',
      allowed: 'Limited',
      defaultTotalDays: 5,
      color: 'red',
    });
    expect(result.success).toBe(false);
  });

  it('rejects hex color without #', () => {
    const result = leaveTypeSchema.safeParse({
      name: 'Test',
      allowed: 'Limited',
      defaultTotalDays: 5,
      color: 'FF0000',
    });
    expect(result.success).toBe(false);
  });

  it('rejects Limited with null defaultTotalDays', () => {
    const result = leaveTypeSchema.safeParse({
      name: 'Test',
      allowed: 'Limited',
      defaultTotalDays: null,
      color: '#000000',
    });
    expect(result.success).toBe(false);
  });

  it('rejects Unlimited with a defaultTotalDays value', () => {
    const result = leaveTypeSchema.safeParse({
      name: 'Test',
      allowed: 'Unlimited',
      defaultTotalDays: 5,
      color: '#000000',
    });
    expect(result.success).toBe(false);
  });

  it('accepts zero defaultTotalDays for Limited', () => {
    const result = leaveTypeSchema.safeParse({
      name: 'Anciënniteit',
      allowed: 'Limited',
      defaultTotalDays: 0,
      color: '#8B5CF6',
    });
    expect(result.success).toBe(true);
  });
});
