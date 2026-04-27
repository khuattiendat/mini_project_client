import {
  createUserApi,
  deleteUserApi,
  getUsersApi,
  updateUserApi,
} from "../../../api/userApi";
import type {
  CreateUserPayload,
  DeleteUserResponse,
  UpdateUserPayload,
  UserItem,
  UserListParams,
  UserListResponse,
} from "../../../types/user";

export const USERS_LIST_KEY = "users";

export function buildUsersListParams({
  page,
  limit,
  search,
  role,
  status,
}: UserListParams): UserListParams {
  return {
    page,
    limit,
    search,
    role,
    status,
  };
}

export function buildUsersListKey(params: UserListParams) {
  return [
    USERS_LIST_KEY,
    params.page ?? 1,
    params.limit ?? 10,
    params.search ?? "",
    params.role ?? "all",
    params.status ?? "all",
  ] as const;
}

export async function fetchUsersList([
  ,
  page,
  limit,
  search,
  role,
  status,
]: readonly [
  string,
  number,
  number,
  string,
  string,
  string,
]): Promise<UserListResponse> {
  return getUsersApi({
    page,
    limit,
    search: search || undefined,
    role: role === "all" ? undefined : (role as "admin" | "user"),
    status: status === "all" ? undefined : (status as "active" | "inactive"),
  });
}

export async function createUserRequest(
  payload: CreateUserPayload,
): Promise<UserItem> {
  return createUserApi(payload);
}

export async function updateUserRequest({
  id,
  payload,
}: {
  id: number;
  payload: UpdateUserPayload;
}): Promise<UserItem> {
  return updateUserApi(id, payload);
}

export async function deleteUserRequest(
  id: number,
): Promise<DeleteUserResponse> {
  return deleteUserApi(id);
}
