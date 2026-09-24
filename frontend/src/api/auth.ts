import type { AxiosRequestConfig } from "axios";
import apiClient from "./client";
import type { RegisterPayload } from "../types/auth";
import type {
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
};
