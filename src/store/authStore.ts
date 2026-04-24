import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getMeApi, loginApi, logoutApi, registerApi } from "../api/authApi";
import { registerSessionExpiredHandler } from "../api/authInterceptor";
import {
  clearAuthStorage,
  getAccessToken,
  setAuthTokens,
} from "../api/tokenStorage";
import type {
  AuthResponse,
  AuthStoreState,
  AuthUser,
  PersistedAuthState,
} from "../types/auth";

function mapAuthResponseToUser(payload: AuthResponse): AuthUser {
  return {
    id: payload.userId,
    userName: payload.userName,
    fullName: payload.fullName,
    role: payload.role,
    status: payload.status,
  };
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      initialized: !getAccessToken(),
      isAuthenticated: false,
      login: async (payload) => {
        set({ isLoading: true });

        try {
          const response = await loginApi(payload);
          const user = mapAuthResponseToUser(response);

          setAuthTokens(response.token);
          set({ user, isAuthenticated: true, initialized: true });

          return user;
        } finally {
          set({ isLoading: false });
        }
      },
      register: async (payload) => {
        set({ isLoading: true });

        try {
          const response = await registerApi(payload);
          const user = mapAuthResponseToUser(response);

          setAuthTokens(response.token);
          set({ user, isAuthenticated: true, initialized: true });

          return user;
        } finally {
          set({ isLoading: false });
        }
      },
      fetchProfile: async () => {
        const accessToken = getAccessToken();

        if (!accessToken) {
          set({ user: null, isAuthenticated: false, initialized: true });
          return;
        }

        set({ isLoading: true });

        try {
          const profile = await getMeApi();
          set({ user: profile, isAuthenticated: true, initialized: true });
        } catch {
          clearAuthStorage();
          set({ user: null, isAuthenticated: false, initialized: true });
        } finally {
          set({ isLoading: false });
        }
      },
      logout: async () => {
        try {
          await logoutApi();
        } finally {
          clearAuthStorage();
          set({ user: null, isAuthenticated: false, initialized: true });
        }
      },
    }),
    {
      name: "mini-project-auth",
      partialize: (state): PersistedAuthState => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        const hasAccessToken = Boolean(getAccessToken());

        if (state) {
          state.isAuthenticated = hasAccessToken && Boolean(state.user);
          state.initialized = !hasAccessToken;
        }
      },
    },
  ),
);

registerSessionExpiredHandler(() => {
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    initialized: true,
  });
});
