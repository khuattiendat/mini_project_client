export type Role = "admin" | "user";

export type UserStatus = "active" | "inactive";

export interface AuthUser {
  id: number;
  userName: string;
  fullName: string;
  role: Role;
  status: UserStatus;
}

export interface LoginPayload {
  userName: string;
  password: string;
}

export interface RegisterPayload {
  userName: string;
  fullName: string;
  password: string;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  userId: number;
  userName: string;
  fullName: string;
  role: Role;
  status: UserStatus;
  token: AuthToken;
}

export interface RefreshTokenPayload {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ApiEnvelope<T> {
  status: "success";
  data: T;
}

export interface ApiErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  error?: string | { message?: string | string[] };
}

export interface AuthStoreState {
  user: AuthUser | null;
  isLoading: boolean;
  initialized: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  fetchProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

export interface PersistedAuthState {
  user: AuthUser | null;
}
