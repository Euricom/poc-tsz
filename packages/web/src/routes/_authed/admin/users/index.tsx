import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import sortOn from 'sort-on';
import { createServerFn } from '@tanstack/react-start';
import { getUsers, createUser, type UserDTO, type CreateUserRequestDTO } from '#/api/users';
import { DataTable, createColumnHelper, type ColumnDef } from '#/components/data-table';
import { Button } from '#/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '#/components/ui/dialog';
import { UserForm } from './-components/user-form';
import type { UserFormValues } from './-components/user-schema';

const fetchUsers = createServerFn({ method: 'GET' }).handler(async () => {
  return (await getUsers()) ?? [];
});

const createUserFn = createServerFn({ method: 'POST' })
  .inputValidator((v: unknown) => v as CreateUserRequestDTO)
  .handler(async ({ data }) => {
    return await createUser(data);
  });

export const Route = createFileRoute('/_authed/admin/users/')({
  loader: () => fetchUsers(),
  component: Users,
  errorComponent: ({ error }) => (
    <div>
      <p>Failed to load users.</p>
      <pre>{error instanceof Error ? error.message : 'Unknown error'}</pre>
    </div>
  ),
});

const columnHelper = createColumnHelper<UserDTO>();

function Users() {
  const initialData = Route.useLoaderData();
  const [users, setUsers] = useState<UserDTO[]>(initialData);
  const [sort, setSort] = useState<string>('name');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const data = await fetchUsers();
    setUsers(data);
  }

  async function handleSubmit(values: UserFormValues) {
    setError(null);
    try {
      await createUserFn({
        data: {
          name: values.name,
          email: values.email,
          role: values.role,
        },
      });
      setDialogOpen(false);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }

  const columns = [
    columnHelper.accessor('name', { header: 'Name' }),
    columnHelper.accessor('email', { header: 'Email' }),
    columnHelper.accessor('role', { header: 'Role' }),
    columnHelper.accessor('leaves', {
      header: 'Leaves',
      enableSorting: false,
      cell: ({ getValue }) => `${getValue().length} type(s)`,
    }),
  ] as ColumnDef<UserDTO, unknown>[];

  return (
    <main>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
        <Button
          onClick={() => {
            setError(null);
            setDialogOpen(true);
          }}
        >
          Add user
        </Button>
      </div>

      <DataTable<UserDTO>
        className="mt-4"
        data={sortOn(users, sort)}
        columns={columns}
        sortBy={sort}
        onSort={setSort}
        getRowId={(row) => String(row.id)}
        emptyMessage="No users"
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add user</DialogTitle>
          </DialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <UserForm onSubmit={handleSubmit} />
        </DialogContent>
      </Dialog>
    </main>
  );
}
