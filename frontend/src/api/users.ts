import apiClient from "./client";
import type {
  AdminUserCreatePayload,
  AdminUserResponse,
  AdminUserUpdatePayload,
} from "../types/api/adminUser";

export const userApi = {
  getUsers() {
    return apiClient.get<AdminUserResponse[]>("/user");
  },

  getUser(id: number) {
    return apiClient.get<AdminUserResponse>(`/user/${id}`);
  },

  createUser(data: AdminUserCreatePayload) {
    return apiClient.post<AdminUserResponse>("/user", data);
  },

  updateUser(id: number, data: AdminUserUpdatePayload) {
    return apiClient.patch<AdminUserResponse>(`/user/${id}`, data);
  },

  deleteUser(id: number) {
    return apiClient.delete<void>(`/user/${id}`);
  },
};
