import { createFileRoute, useRouter } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { getAnimalById, updateAnimal } from '#/api/animals';
import { AnimalForm } from './-components/animal-form';

const updateAnimalSchema = z.object({
  id: z.number().int().positive(),
  animal: z.object({
    name: z.string().min(1),
    species: z.string().min(1),
    age: z.number().int().nonnegative(),
  }),
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

export const Route = createFileRoute('/_authed/animals/$id')({
  loader: ({ params }) => fetchAnimalById({ data: Number(params.id) }),
  component: AnimalDetail,
});

function AnimalDetail() {
  const animal = Route.useLoaderData();
  const router = useRouter();

  return (
    <main>
      <h1 className="text-2xl font-bold">{animal?.name}</h1>
      <AnimalForm
        animal={animal}
        onSubmit={async (value) => {
          await saveAnimal({
            data: {
              id: Number(animal?.id),
              animal: value,
            },
          });
          await router.invalidate();
        }}
      />
    </main>
  );
}
