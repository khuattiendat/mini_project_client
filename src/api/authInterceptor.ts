import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { apiClient } from "./httpClient";
import { refreshTokenApi } from "./authApi";
import {
  clearAuthStorage,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
} from "./tokenStorage";

declare module "axios" {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

let isInterceptorSetup = false;
let isRefreshing = false;
let onSessionExpiredHandler: (() => void) | null = null;
let requestQueue: Array<{
  resolve: (accessToken: string) => void;
  reject: (error: unknown) => void;
}> = [];

function flushRequestQueue(error: unknown, accessToken?: string) {
  requestQueue.forEach((request) => {
    if (error) {
      request.reject(error);
      return;
    }

    request.resolve(accessToken ?? "");
  });

  requestQueue = [];
}

function isAuthRequest(config: InternalAxiosRequestConfig): boolean {
  return Boolean(
    config.url?.includes("/auth/login") ||
    config.url?.includes("/auth/signup") ||
    config.url?.includes("/auth/refresh"),
  );
}

export function registerSessionExpiredHandler(handler: () => void): void {
  onSessionExpiredHandler = handler;
}

export function setupAuthInterceptors(): void {
  if (isInterceptorSetup) {
    return;
  }

  apiClient.interceptors.request.use((config) => {
    const accessToken = getAccessToken();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  });

  apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config;

      if (!originalRequest) {
        return Promise.reject(error);
      }

      const responseStatus = error.response?.status;

      if (
        responseStatus !== 401 ||
        originalRequest._retry ||
        isAuthRequest(originalRequest)
      ) {
        return Promise.reject(error);
      }

      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        clearAuthStorage();
        onSessionExpiredHandler?.();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          requestQueue.push({
            resolve: (newAccessToken) => {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              resolve(apiClient(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshedToken = await refreshTokenApi({ refreshToken });

        setAuthTokens(refreshedToken);
        flushRequestQueue(null, refreshedToken.accessToken);
        originalRequest.headers.Authorization = `Bearer ${refreshedToken.accessToken}`;

        return apiClient(originalRequest);
      } catch (refreshError) {
        flushRequestQueue(refreshError);
        clearAuthStorage();
        onSessionExpiredHandler?.();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    },
  );

  isInterceptorSetup = true;
}
