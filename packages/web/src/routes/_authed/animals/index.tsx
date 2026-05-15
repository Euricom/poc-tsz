import { useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import sortOn from 'sort-on';
import { getAnimals, type AnimalDTO } from '#/api/animals';
import { DataTable, createColumnHelper, type ColumnDef } from '#/components/data-table';

const fetchAnimals = createServerFn({ method: 'GET' }).handler(async () => {
  return (await getAnimals()) ?? [];
});

export const Route = createFileRoute('/_authed/animals/')({
  loader: () => fetchAnimals(),
  component: Animals,
  errorComponent: ({ error }) => (
    <div>
      <p>Failed to load animals.</p>
      <pre>{error instanceof Error ? error.message : 'Unknown error'}</pre>
    </div>
  ),
});

const columnHelper = createColumnHelper<AnimalDTO>();

const columns = [
  columnHelper.accessor('name', {
    header: 'Name',
    cell: ({ row, getValue }) => (
      <Link
        to="/animals/$id"
        params={{ id: String(row.original.id) }}
        className="hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor('species', { header: 'Species' }),
  columnHelper.accessor('age', { header: 'Age' }),
] as ColumnDef<AnimalDTO, unknown>[];

function Animals() {
  const animals = Route.useLoaderData();
  const navigate = useNavigate();
  const [sort, setSort] = useState<string>('name');

  const sortedAnimals = sortOn(animals, sort);

  return (
    <main>
      <h1 className="text-2xl font-bold">Animals</h1>
      <DataTable<AnimalDTO>
        className="mt-4"
        data={sortedAnimals}
        columns={columns}
        sortBy={sort}
        onSort={setSort}
        getRowId={(row) => String(row.id)}
        onRowClick={(row) => navigate({ to: '/animals/$id', params: { id: String(row.id) } })}
        emptyMessage="No animals"
      />
    </main>
  );
}
