import apiClient from "./client";
import type { MeResponse } from "../types/api/user";
import type { UpdateMePayload } from "../types/api/profile";

export const profileApi = {
  updateMe(data: UpdateMePayload) {
    return apiClient.patch<MeResponse>("/user/update_me", data);
  },

  deleteMe() {
    return apiClient.delete<void>("/user/delete_me");
  },
};
