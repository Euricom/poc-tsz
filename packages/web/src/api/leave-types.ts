import { type components } from './schema';
import { client } from './client';

export type LeaveTypeDTO = components['schemas']['LeaveType'];
export type AllowedDTO = components['schemas']['Allowed'];
export type CreateLeaveTypeRequestDTO = components['schemas']['CreateLeaveTypeRequest'];
export type UpdateLeaveTypeRequestDTO = components['schemas']['UpdateLeaveTypeRequest'];

export const getLeaveTypes = async (includeArchived = false): Promise<LeaveTypeDTO[]> => {
  const resp = await client.GET('/api/leave-types', {
    params: { query: { includeArchived } },
  });
  return resp.data!;
};

export const createLeaveType = async (body: CreateLeaveTypeRequestDTO): Promise<LeaveTypeDTO> => {
  const resp = await client.POST('/api/leave-types', { body });
  return resp.data!;
};

export const updateLeaveType = async (id: number, body: UpdateLeaveTypeRequestDTO): Promise<void> => {
  await client.PUT('/api/leave-types/{id}', { params: { path: { id } }, body });
};

export const archiveLeaveType = async (id: number): Promise<void> => {
  await client.DELETE('/api/leave-types/{id}', { params: { path: { id } } });
};

export const unarchiveLeaveType = async (id: number): Promise<void> => {
  await client.POST('/api/leave-types/{id}/unarchive', { params: { path: { id } } });
};
