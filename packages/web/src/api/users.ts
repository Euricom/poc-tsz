import { type components } from './schema';
import { client } from './client';

export type UserDTO = components['schemas']['UserResponse'];
export type UserLeaveDTO = components['schemas']['UserLeaveResponse'];
export type CreateUserRequestDTO = components['schemas']['CreateUserRequest'];
export type RoleDTO = components['schemas']['Role'];

export const getUsers = async (): Promise<UserDTO[]> => {
  const resp = await client.GET('/api/users');
  return resp.data!;
};

export const createUser = async (body: CreateUserRequestDTO): Promise<UserDTO> => {
  const resp = await client.POST('/api/users', { body });
  return resp.data!;
};
