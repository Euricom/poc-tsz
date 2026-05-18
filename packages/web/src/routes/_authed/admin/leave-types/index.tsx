import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import sortOn from 'sort-on';
import { createServerFn } from '@tanstack/react-start';
import {
  getLeaveTypes,
  createLeaveType,
  updateLeaveType,
  archiveLeaveType,
  unarchiveLeaveType,
  type LeaveTypeDTO,
  type CreateLeaveTypeRequestDTO,
  type UpdateLeaveTypeRequestDTO,
} from '#/api/leave-types';
import { DataTable, createColumnHelper, type ColumnDef } from '#/components/data-table';
import { Button } from '#/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '#/components/ui/dialog';
import { LeaveTypeForm } from './-components/leave-type-form';
import type { LeaveTypeFormValues } from './-components/leave-type-schema';

const fetchLeaveTypes = createServerFn({ method: 'GET' })
  .inputValidator((v: unknown) => v as boolean)
  .handler(async ({ data: includeArchived }) => {
    return (await getLeaveTypes(includeArchived)) ?? [];
  });

const createLeaveTypeFn = createServerFn({ method: 'POST' })
  .inputValidator((v: unknown) => v as CreateLeaveTypeRequestDTO)
  .handler(async ({ data }) => {
    return await createLeaveType(data);
  });

const updateLeaveTypeFn = createServerFn({ method: 'POST' })
  .inputValidator((v: unknown) => v as { id: number; body: UpdateLeaveTypeRequestDTO })
  .handler(async ({ data }) => {
    await updateLeaveType(data.id, data.body);
  });

const archiveLeaveTypeFn = createServerFn({ method: 'POST' })
  .inputValidator((v: unknown) => v as number)
  .handler(async ({ data: id }) => {
    await archiveLeaveType(id);
  });

const unarchiveLeaveTypeFn = createServerFn({ method: 'POST' })
  .inputValidator((v: unknown) => v as number)
  .handler(async ({ data: id }) => {
    await unarchiveLeaveType(id);
  });

export const Route = createFileRoute('/_authed/admin/leave-types/')({
  loader: () => fetchLeaveTypes({ data: false }),
  component: LeaveTypes,
  errorComponent: ({ error }) => (
    <div>
      <p>Failed to load leave types.</p>
      <pre>{error instanceof Error ? error.message : 'Unknown error'}</pre>
    </div>
  ),
});

const columnHelper = createColumnHelper<LeaveTypeDTO>();

function LeaveTypes() {
  const initialData = Route.useLoaderData();
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeDTO[]>(initialData);
  const [sort, setSort] = useState<string>('name');
  const [showArchived, setShowArchived] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LeaveTypeDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reload(includeArchived: boolean) {
    const data = await fetchLeaveTypes({ data: includeArchived });
    setLeaveTypes(data);
  }

  async function handleToggleArchived() {
    const next = !showArchived;
    setShowArchived(next);
    await reload(next);
  }

  function openAdd() {
    setEditing(null);
    setError(null);
    setDialogOpen(true);
  }

  function openEdit(row: LeaveTypeDTO) {
    setEditing(row);
    setError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(values: LeaveTypeFormValues) {
    setError(null);
    try {
      if (editing) {
        await updateLeaveTypeFn({
          data: {
            id: editing.id,
            body: {
              name: values.name,
              allowed: values.allowed,
              defaultTotalDays: values.defaultTotalDays ?? undefined,
              color: values.color,
            },
          },
        });
      } else {
        await createLeaveTypeFn({
          data: {
            name: values.name,
            allowed: values.allowed,
            defaultTotalDays: values.defaultTotalDays ?? undefined,
            color: values.color,
          },
        });
      }
      setDialogOpen(false);
      await reload(showArchived);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }

  async function handleArchive(row: LeaveTypeDTO) {
    await archiveLeaveTypeFn({ data: row.id });
    await reload(showArchived);
  }

  async function handleUnarchive(row: LeaveTypeDTO) {
    await unarchiveLeaveTypeFn({ data: row.id });
    setDialogOpen(false);
    await reload(showArchived);
  }

  const columns = [
    columnHelper.accessor('color', {
      header: '',
      enableSorting: false,
      cell: ({ getValue }) => (
        <span className="inline-block size-4 rounded-sm border border-border" style={{ backgroundColor: getValue() }} />
      ),
    }),
    columnHelper.accessor('name', { header: 'Name' }),
    columnHelper.accessor('allowed', { header: 'Type' }),
    columnHelper.accessor('defaultTotalDays', {
      header: 'Days',
      cell: ({ getValue }) => getValue() ?? '—',
    }),
    columnHelper.accessor('isArchived', {
      header: 'Archived',
      cell: ({ getValue }) => (getValue() ? 'Yes' : 'No'),
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => openEdit(row.original)}>
            Edit
          </Button>
          {!row.original.isArchived && (
            <Button size="sm" variant="destructive" onClick={() => handleArchive(row.original)}>
              Archive
            </Button>
          )}
        </div>
      ),
    }),
  ] as ColumnDef<LeaveTypeDTO, unknown>[];

  return (
    <main>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Leave Types</h1>
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={showArchived} onChange={handleToggleArchived} className="rounded" />
            Show archived
          </label>
          <Button onClick={openAdd}>Add leave type</Button>
        </div>
      </div>

      <DataTable<LeaveTypeDTO>
        className="mt-4"
        data={sortOn(leaveTypes, sort)}
        columns={columns}
        sortBy={sort}
        onSort={setSort}
        getRowId={(row) => String(row.id)}
        emptyMessage="No leave types"
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit leave type' : 'Add leave type'}</DialogTitle>
          </DialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <LeaveTypeForm key={editing?.id ?? 'new'} leaveType={editing ?? undefined} onSubmit={handleSubmit} />
          {editing?.isArchived && (
            <Button variant="outline" onClick={() => handleUnarchive(editing)}>
              Unarchive
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
