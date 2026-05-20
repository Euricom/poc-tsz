import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import {
  getLeaveTypes,
  updateLeaveType,
  archiveLeaveType,
  unarchiveLeaveType,
  type UpdateLeaveTypeRequestDTO,
} from '#/api/leave-types';
import { Button } from '#/components/ui/button';
import { LeaveTypeForm } from './-components/leave-type-form';
import type { LeaveTypeFormValues } from './-components/leave-type-schema';

const fetchLeaveTypes = createServerFn({ method: 'GET' }).handler(async () => {
  return (await getLeaveTypes(true)) ?? [];
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

export const Route = createFileRoute('/_authed/admin/leave-types/$id')({
  loader: async ({ params }) => {
    const all = await fetchLeaveTypes();
    const leaveType = all.find((lt) => lt.id === Number(params.id));
    if (!leaveType) throw new Error(`Leave type ${params.id} not found`);
    return leaveType;
  },
  component: EditLeaveType,
  errorComponent: ({ error }) => (
    <div>
      <p>Failed to load leave type.</p>
      <pre>{error instanceof Error ? error.message : 'Unknown error'}</pre>
    </div>
  ),
});

function EditLeaveType() {
  const leaveType = Route.useLoaderData();
  const navigate = useNavigate();
  const router = useRouter();

  async function handleSubmit(values: LeaveTypeFormValues) {
    await updateLeaveTypeFn({
      data: {
        id: leaveType.id,
        body: {
          name: values.name,
          allowed: values.allowed,
          defaultTotalDays: values.defaultTotalDays ?? undefined,
          color: values.color,
        },
      },
    });
    await router.invalidate();
  }

  async function handleArchive() {
    await archiveLeaveTypeFn({ data: leaveType.id });
    await navigate({ to: '/admin/leave-types' });
  }

  async function handleUnarchive() {
    await unarchiveLeaveTypeFn({ data: leaveType.id });
    await router.invalidate();
  }

  return (
    <main>
      <h1 className="text-2xl font-bold">Edit leave type</h1>
      <div className="mt-4 max-w-md">
        <LeaveTypeForm key={leaveType.id} leaveType={leaveType} onSubmit={handleSubmit} />
        <div className="mt-4">
          {leaveType.isArchived ? (
            <Button variant="outline" onClick={handleUnarchive}>
              Unarchive
            </Button>
          ) : (
            <Button variant="destructive" onClick={handleArchive}>
              Archive
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
