import apiClient from "./client";
import type { HealthOrganisationResponse } from "../types/api/healthOrganisation";

export const organisationApi = {
  getOrganisations() {
    return apiClient.get<HealthOrganisationResponse[]>("/health-organisation");
  },

  getOrganisation(id: number) {
    return apiClient.get<HealthOrganisationResponse>(
      `/health-organisation/${id}`,
    );
  },
};
