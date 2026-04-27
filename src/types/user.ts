import type { ApiEnvelope } from "./auth";

export type UserRole = "admin" | "user";

export type UserStatus = "active" | "inactive";

export interface UserItem {
  id: number;
  userName: string;
  fullName: string;
  deviceId: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface UserListMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface UserListResponse {
  items: UserItem[];
  meta: UserListMeta;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface CreateUserPayload {
  userName: string;
  password: string;
  fullName: string;
  deviceId?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface UpdateUserPayload {
  userName?: string;
  password?: string;
  fullName?: string;
  deviceId?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface DeleteUserResponse {
  message: string;
}

export type UserEnvelope<T> = ApiEnvelope<T>;
