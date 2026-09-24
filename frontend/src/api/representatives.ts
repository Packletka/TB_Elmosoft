import apiClient from "./client";
import type {
  RepresentativeCreatePayload,
  RepresentativeResponse,
  RepresentativeUpdatePayload,
} from "../types/api/representative";

export const representativeApi = {
  getRepresentatives() {
    return apiClient.get<RepresentativeResponse[]>("/representative");
  },

  getRepresentative(id: number) {
    return apiClient.get<RepresentativeResponse>(`/representative/${id}`);
  },

  createRepresentative(data: RepresentativeCreatePayload) {
    return apiClient.post<RepresentativeResponse>("/representative", data);
  },

  updateRepresentative(id: number, data: RepresentativeUpdatePayload) {
    return apiClient.patch<RepresentativeResponse>(
      `/representative/${id}`,
      data,
    );
  },

  deleteRepresentative(id: number) {
    return apiClient.delete<void>(`/representative/${id}`);
  },
};
