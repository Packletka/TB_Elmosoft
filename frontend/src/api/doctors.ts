import apiClient from "./client";
import type { DoctorResponse } from "../types/api/doctor";

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
};
