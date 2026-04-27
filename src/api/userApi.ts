import { apiClient } from "./httpClient";
import type {
  CreateUserPayload,
  DeleteUserResponse,
  UpdateUserPayload,
  UserEnvelope,
  UserItem,
  UserListParams,
  UserListResponse,
} from "../types/user";

export async function getUsersApi(
  params: UserListParams,
): Promise<UserListResponse> {
  const { data } = await apiClient.get<UserEnvelope<UserListResponse>>(
    "/users",
    {
      params,
    },
  );

  return data.data;
}

export async function createUserApi(
  payload: CreateUserPayload,
): Promise<UserItem> {
  const { data } = await apiClient.post<UserEnvelope<UserItem>>(
    "/users",
    payload,
  );
  return data.data;
}

export async function updateUserApi(
  id: number,
  payload: UpdateUserPayload,
): Promise<UserItem> {
  const { data } = await apiClient.patch<UserEnvelope<UserItem>>(
    `/users/${id}`,
    payload,
  );

  return data.data;
}

export async function deleteUserApi(id: number): Promise<DeleteUserResponse> {
  const { data } = await apiClient.delete<UserEnvelope<DeleteUserResponse>>(
    `/users/${id}`,
  );

  return data.data;
}
