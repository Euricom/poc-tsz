import { useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import sortOn from 'sort-on';
import { createServerFn } from '@tanstack/react-start';
import { getLeaveTypes, type LeaveTypeDTO } from '#/api/leave-types';
import { DataTable, createColumnHelper, type ColumnDef } from '#/components/data-table';
import { Button } from '#/components/ui/button';

const fetchLeaveTypes = createServerFn({ method: 'GET' })
  .inputValidator((v: unknown) => v as boolean)
  .handler(async ({ data: includeArchived }) => {
    return (await getLeaveTypes(includeArchived)) ?? [];
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
] as ColumnDef<LeaveTypeDTO, unknown>[];

function LeaveTypes() {
  const initialData = Route.useLoaderData();
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeDTO[]>(initialData);
  const [sort, setSort] = useState<string>('name');
  const [showArchived, setShowArchived] = useState(false);
  const navigate = useNavigate();

  async function handleToggleArchived() {
    const next = !showArchived;
    setShowArchived(next);
    const data = await fetchLeaveTypes({ data: next });
    setLeaveTypes(data);
  }

  return (
    <main>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Leave Types</h1>
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={showArchived} onChange={handleToggleArchived} className="rounded" />
            Show archived
          </label>
          <Button asChild>
            <Link to="/admin/leave-types/new">Add leave type</Link>
          </Button>
        </div>
      </div>

      <DataTable<LeaveTypeDTO>
        className="mt-4"
        data={sortOn(leaveTypes, sort)}
        columns={columns}
        sortBy={sort}
        onSort={setSort}
        getRowId={(row) => String(row.id)}
        onRowClick={(row) => navigate({ to: '/admin/leave-types/$id', params: { id: String(row.id) } })}
        emptyMessage="No leave types"
      />
    </main>
  );
}
