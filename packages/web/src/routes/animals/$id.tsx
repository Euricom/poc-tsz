import { createFileRoute, useRouter } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { getAnimalById, updateAnimal } from '#/api/animals';
import { Button } from '#/components/ui/button';
import { Input } from '#/components/ui/input';
import { Label } from '#/components/ui/label';

const animalSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  species: z.string().min(1, 'Species is required'),
  age: z.number().int().nonnegative(),
});

const updateAnimalSchema = z.object({
  id: z.number().int().positive(),
  animal: animalSchema,
});

const fetchAnimalById = createServerFn({ method: 'GET' })
  .inputValidator(z.number().int().positive())
  .handler(async ({ data: id }) => {
    return await getAnimalById(id);
  });

const saveAnimal = createServerFn({ method: 'POST' })
  .inputValidator(updateAnimalSchema)
  .handler(async ({ data }) => {
    await updateAnimal(data.id, data.animal);
  });

export const Route = createFileRoute('/animals/$id')({
  loader: ({ params }) => fetchAnimalById({ data: Number(params.id) }),
  component: AnimalDetail,
});

function AnimalDetail() {
  const animal = Route.useLoaderData();
  const router = useRouter();

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
      await saveAnimal({
        data: {
          id: Number(animal?.id),
          animal: {
            name: value.name,
            species: value.species,
            age: value.age,
          },
        },
      });
      await router.invalidate();
    },
  });

  return (
    <main>
      <h1 className="text-2xl font-bold">{animal?.name}</h1>
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
    </main>
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
