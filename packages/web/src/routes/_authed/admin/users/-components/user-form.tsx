import { useForm } from '@tanstack/react-form';
import { Button } from '#/components/ui/button';
import { Input } from '#/components/ui/input';
import { Label } from '#/components/ui/label';
import { userSchema, type UserFormValues } from './user-schema';

interface UserFormProps {
  onSubmit: (values: UserFormValues) => Promise<void> | void;
}

export function UserForm({ onSubmit }: UserFormProps) {
  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      role: 'User' as UserFormValues['role'],
    },
    validators: { onChange: userSchema },
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

      <form.Field name="email">
        {(field) => (
          <div className="grid gap-2">
            <Label htmlFor={field.name}>Email</Label>
            <Input
              id={field.name}
              name={field.name}
              type="email"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <FieldError field={field} />
          </div>
        )}
      </form.Field>

      <form.Field name="role">
        {(field) => (
          <div className="grid gap-2">
            <Label htmlFor={field.name}>Role</Label>
            <select
              id={field.name}
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value as UserFormValues['role'])}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
            >
              <option value="Admin">Admin</option>
              <option value="User">User</option>
              <option value="ClientManager">Client Manager</option>
            </select>
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
