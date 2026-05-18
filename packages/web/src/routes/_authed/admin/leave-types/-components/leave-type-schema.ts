import { z } from 'zod';

const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

export const leaveTypeSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    allowed: z.enum(['Limited', 'Unlimited']),
    defaultTotalDays: z.number().int().nonnegative().nullable(),
    color: z.string().regex(hexColorRegex, 'Color must be a valid hex color (#RRGGBB)'),
  })
  .superRefine((val, ctx) => {
    if (val.allowed === 'Limited' && val.defaultTotalDays === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['defaultTotalDays'],
        message: 'Required for Limited leave types',
      });
    }
    if (val.allowed === 'Unlimited' && val.defaultTotalDays !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['defaultTotalDays'],
        message: 'Must be empty for Unlimited leave types',
      });
    }
  });

export type LeaveTypeFormValues = z.infer<typeof leaveTypeSchema>;
