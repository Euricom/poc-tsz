import { describe, it, expect } from 'vite-plus/test';
import { animalSchema } from './animal-schema';

describe('animalSchema', () => {
  it('accepts a valid animal', () => {
    const result = animalSchema.safeParse({ name: 'Rex', species: 'dog', age: 3 });
    expect(result.success).toBe(true);
  });

  it('accepts age = 0', () => {
    const result = animalSchema.safeParse({ name: 'Rex', species: 'dog', age: 0 });
    expect(result.success).toBe(true);
  });

  it('rejects empty name with message', () => {
    const result = animalSchema.safeParse({ name: '', species: 'dog', age: 3 });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Name is required');
    expect(result.error?.issues[0]?.path).toEqual(['name']);
  });

  it('rejects empty species with message', () => {
    const result = animalSchema.safeParse({ name: 'Rex', species: '', age: 3 });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Species is required');
    expect(result.error?.issues[0]?.path).toEqual(['species']);
  });

  it('rejects negative age', () => {
    const result = animalSchema.safeParse({ name: 'Rex', species: 'dog', age: -1 });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['age']);
  });

  it('rejects non-integer age', () => {
    const result = animalSchema.safeParse({ name: 'Rex', species: 'dog', age: 3.5 });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['age']);
  });

  it('rejects non-number age', () => {
    const result = animalSchema.safeParse({ name: 'Rex', species: 'dog', age: '3' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['age']);
  });

  it('rejects missing fields', () => {
    const result = animalSchema.safeParse({});
    expect(result.success).toBe(false);
    const paths = result.error?.issues.map((i) => i.path[0]).sort();
    expect(paths).toEqual(['age', 'name', 'species']);
  });
});
