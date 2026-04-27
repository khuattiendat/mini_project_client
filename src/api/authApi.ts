import { apiClient, authClient } from "./httpClient";
import type {
  ApiEnvelope,
  AuthResponse,
  AuthUser,
  LoginPayload,
  RefreshTokenPayload,
  RefreshTokenResponse,
  RegisterPayload,
} from "../types/auth";

export async function loginApi(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await authClient.post<ApiEnvelope<AuthResponse>>(
    "/auth/login",
    payload,
  );

  return data.data;
}

export async function registerApi(
  payload: RegisterPayload,
): Promise<AuthResponse> {
  const { data } = await authClient.post<ApiEnvelope<AuthResponse>>(
    "/auth/signup",
    payload,
  );

  return data.data;
}

export async function refreshTokenApi(
  payload: RefreshTokenPayload,
): Promise<RefreshTokenResponse> {
  const { data } = await authClient.post<ApiEnvelope<RefreshTokenResponse>>(
    "/auth/refresh",
    payload,
  );

  return data.data;
}

export async function logoutApi(): Promise<void> {
  await apiClient.post("/auth/logout");
}

export async function getMeApi(): Promise<AuthUser> {
  const { data } = await apiClient.get<ApiEnvelope<AuthUser>>("/auth/me");
  return data.data;
}

export async function updateProfileApi(
  fullName: string,
): Promise<AuthUser> {
  const { data } = await apiClient.patch<ApiEnvelope<AuthUser>>("/auth/me", {
    fullName,
  });
  return data.data;
}

export async function changePasswordApi(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await apiClient.post("/auth/change-password", {
    currentPassword,
    newPassword,
  });
}
