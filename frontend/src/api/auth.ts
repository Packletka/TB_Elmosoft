import type { AxiosRequestConfig } from "axios";
import apiClient from "./client";
import type { RegisterPayload } from "../types/api/auth";
import type {
  DetailResponse,
  PasswordResetPayload,
  TokenPairResponse,
  RefreshResponse,
  RegisterResponse,
} from "../types/api/auth";
import type { MeResponse } from "../types/api/user";

export const authApi = {
  login(email: string, password: string) {
    return apiClient.post<TokenPairResponse>("/token/", {
      email,
      password,
    });
  },

  refresh(refreshToken: string) {
    return apiClient.post<RefreshResponse>("/token/refresh/", {
      refresh: refreshToken,
    });
  },

  logout(refreshToken: string) {
    return apiClient.post<unknown>("/token/blacklist/", {
      refresh: refreshToken,
    });
  },

  getCurrentUser(config?: AxiosRequestConfig) {
    return apiClient.get<MeResponse>("/user/me", config);
  },

  register(data: RegisterPayload) {
    return apiClient.post<RegisterResponse>("/user/register", data);
  },

  // Public endpoints: the backend ignores any token sent along, so a stale
  // one left in localStorage cannot turn these calls into a 401.
  requestPasswordReset(email: string) {
    return apiClient.post<DetailResponse>("/password/forgot", { email });
  },

  resetPassword(data: PasswordResetPayload) {
    return apiClient.post<DetailResponse>("/password/reset", data);
  },
};
