import apiClient from "./client";
import type {
  DoctorCreatePayload,
  DoctorResponse,
  DoctorUpdatePayload,
} from "../types/api/doctor";

export const doctorApi = {
  getDoctors() {
    return apiClient.get<DoctorResponse[]>("/doctor");
  },

  getDoctorsByOrganisation(healthOrganisationId: number) {
    return apiClient.get<DoctorResponse[]>(
      `/doctor?health_organisation=${healthOrganisationId}`,
    );
  },

  getDoctor(id: number) {
    return apiClient.get<DoctorResponse>(`/doctor/${id}`);
  },

  createDoctor(data: DoctorCreatePayload) {
    return apiClient.post<DoctorResponse>("/doctor", data);
  },

  updateDoctor(id: number, data: DoctorUpdatePayload) {
    return apiClient.patch<DoctorResponse>(`/doctor/${id}`, data);
  },

  deleteDoctor(id: number) {
    return apiClient.delete<void>(`/doctor/${id}`);
  },
};
