import apiClient from "./client";
import type { MeResponse } from "../types/api/user";
import type { DetailResponse } from "../types/api/auth";
import type {
  PhoneChangeConfirmPayload,
  PhoneChangeConfirmResponse,
  PhoneChangeRequestPayload,
  UpdateMePayload,
} from "../types/api/profile";

export const profileApi = {
  updateMe(data: UpdateMePayload) {
    return apiClient.patch<MeResponse>("/user/update_me", data);
  },

  // The number changes in two steps: a code is emailed, then it is entered
  requestPhoneChange(data: PhoneChangeRequestPayload) {
    return apiClient.post<DetailResponse>("/phone/change/request", data);
  },

  confirmPhoneChange(data: PhoneChangeConfirmPayload) {
    return apiClient.post<PhoneChangeConfirmResponse>(
      "/phone/change/confirm",
      data,
    );
  },

  deleteMe() {
    return apiClient.delete<void>("/user/delete_me");
  },
};
