import { useForm } from '@tanstack/react-form';
import type { LeaveTypeDTO } from '#/api/leave-types';
import { Button } from '#/components/ui/button';
import { Input } from '#/components/ui/input';
import { Label } from '#/components/ui/label';
import { leaveTypeSchema, type LeaveTypeFormValues } from './leave-type-schema';

interface LeaveTypeFormProps {
  leaveType?: LeaveTypeDTO;
  onSubmit: (values: LeaveTypeFormValues) => Promise<void> | void;
}

export function LeaveTypeForm({ leaveType, onSubmit }: LeaveTypeFormProps) {
  const form = useForm({
    defaultValues: {
      name: leaveType?.name ?? '',
      allowed: (leaveType?.allowed ?? 'Limited') as 'Limited' | 'Unlimited',
      defaultTotalDays: leaveType?.defaultTotalDays ?? null,
      color: leaveType?.color ?? '#3B82F6',
    },
    validators: { onChange: leaveTypeSchema },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="grid gap-4"
    >
      <form.Field name="name">
        {(field) => (
          <div className="grid gap-2">
            <Label htmlFor={field.name}>Name</Label>
            <Input
              id={field.name}
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <FieldError field={field} />
          </div>
        )}
      </form.Field>

      <form.Field name="allowed">
        {(field) => (
          <div className="grid gap-2">
            <Label htmlFor={field.name}>Type</Label>
            <select
              id={field.name}
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value as 'Limited' | 'Unlimited')}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
            >
              <option value="Limited">Limited</option>
              <option value="Unlimited">Unlimited</option>
            </select>
            <FieldError field={field} />
          </div>
        )}
      </form.Field>

      <form.Subscribe selector={(s) => s.values.allowed}>
        {(allowed) =>
          allowed === 'Limited' ? (
            <form.Field name="defaultTotalDays">
              {(field) => (
                <div className="grid gap-2">
                  <Label htmlFor={field.name}>Default Total Days</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="number"
                    min={0}
                    value={field.state.value ?? ''}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value === '' ? null : e.target.valueAsNumber)}
                  />
                  <FieldError field={field} />
                </div>
              )}
            </form.Field>
          ) : null
        }
      </form.Subscribe>

      <form.Field name="color">
        {(field) => (
          <div className="grid gap-2">
            <Label htmlFor={field.name}>Color</Label>
            <div className="flex gap-2">
              <input
                type="color"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded-md border border-input p-1"
              />
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                maxLength={7}
                className="font-mono"
              />
            </div>
            <FieldError field={field} />
          </div>
        )}
      </form.Field>

      <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => (
          <Button type="submit" disabled={!canSubmit}>
            {isSubmitting ? 'Saving…' : 'Save'}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}

function FieldError({ field }: { field: { state: { meta: { isTouched: boolean; errors: Array<unknown> } } } }) {
  if (!field.state.meta.isTouched || field.state.meta.errors.length === 0) return null;
  const message = field.state.meta.errors
    .map((err) => (typeof err === 'string' ? err : (err as { message?: string })?.message))
    .filter(Boolean)
    .join(', ');
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}
