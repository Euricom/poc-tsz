import { z } from 'zod';

export const animalSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  species: z.string().min(1, 'Species is required'),
  age: z.number().int().nonnegative(),
});

export type AnimalFormValues = z.infer<typeof animalSchema>;
