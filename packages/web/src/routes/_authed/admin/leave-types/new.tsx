import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { createLeaveType, type CreateLeaveTypeRequestDTO } from '#/api/leave-types';
import { Button } from '#/components/ui/button';
import { LeaveTypeForm } from './-components/leave-type-form';
import type { LeaveTypeFormValues } from './-components/leave-type-schema';

const createLeaveTypeFn = createServerFn({ method: 'POST' })
  .inputValidator((v: unknown) => v as CreateLeaveTypeRequestDTO)
  .handler(async ({ data }) => {
    return await createLeaveType(data);
  });

export const Route = createFileRoute('/_authed/admin/leave-types/new')({
  component: NewLeaveType,
});

function NewLeaveType() {
  const navigate = useNavigate();

  async function handleSubmit(values: LeaveTypeFormValues) {
    await createLeaveTypeFn({
      data: {
        name: values.name,
        allowed: values.allowed,
        defaultTotalDays: values.defaultTotalDays ?? undefined,
        color: values.color,
      },
    });
    await navigate({ to: '/admin/leave-types' });
  }

  return (
    <main>
      <h1 className="text-2xl font-bold">Add leave type</h1>
      <div className="mt-4 max-w-md">
        <LeaveTypeForm onSubmit={handleSubmit} />
        <Button asChild variant="outline" className="mt-2 w-full">
          <Link to="/admin/leave-types">Cancel</Link>
        </Button>
      </div>
    </main>
  );
}
