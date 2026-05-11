import { useForm } from '@tanstack/react-form';
import type { Animal } from '#/api/animals';
import { Button } from '#/components/ui/button';
import { Input } from '#/components/ui/input';
import { Label } from '#/components/ui/label';
import { animalSchema, type AnimalFormValues } from './animal-schema';

interface AnimalFormProps {
  animal: Animal | undefined;
  onSubmit: (values: AnimalFormValues) => Promise<void> | void;
}

export function AnimalForm({ animal, onSubmit }: AnimalFormProps) {
  const form = useForm({
    defaultValues: {
      name: String(animal?.name ?? ''),
      species: String(animal?.species ?? ''),
      age: Number(animal?.age ?? 0),
    },
    validators: {
      onChange: animalSchema,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
      }}
      className="mt-4 grid max-w-md gap-4"
    >
      <div className="grid gap-2">
        <Label htmlFor="id">ID</Label>
        <Input id="id" value={String(animal?.id ?? '')} disabled />
      </div>

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

      <form.Field name="species">
        {(field) => (
          <div className="grid gap-2">
            <Label htmlFor={field.name}>Species</Label>
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

      <form.Field name="age">
        {(field) => (
          <div className="grid gap-2">
            <Label htmlFor={field.name}>Age</Label>
            <Input
              id={field.name}
              name={field.name}
              type="number"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value === '' ? 0 : e.target.valueAsNumber)}
            />
            <FieldError field={field} />
          </div>
        )}
      </form.Field>

      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => (
          <div>
            <Button type="submit" disabled={!canSubmit}>
              {isSubmitting ? 'Saving…' : 'Save'}
            </Button>
          </div>
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
