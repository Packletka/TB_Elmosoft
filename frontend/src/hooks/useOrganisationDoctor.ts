import { useEffect, useState } from "react";
import axios from "axios";

import { doctorApi } from "../api/doctors";
import { extractErrorMessages } from "../api/errorMessages";
import type { DoctorResponse } from "../types/api/doctor";

interface OrganisationDoctorState {
  doctor: DoctorResponse | null;
  isLoading: boolean;
  notFound: boolean;
  loadError: string | null;
}

const NOT_FOUND: OrganisationDoctorState = {
  doctor: null,
  isLoading: false,
  notFound: true,
  loadError: null,
};

/**
 * Loads a doctor and checks that they belong to the given organisation.
 * Doctors are public, so the backend returns any doctor. One from another
 * organisation is reported as not found here.
 */
export function useOrganisationDoctor(
  doctorIdParam: string | undefined,
  organisationId: number,
): OrganisationDoctorState {
  const [state, setState] = useState<OrganisationDoctorState>({
    doctor: null,
    isLoading: true,
    notFound: false,
    loadError: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<OrganisationDoctorState> {
      const numericId = Number(doctorIdParam);

      if (!doctorIdParam || !Number.isFinite(numericId)) {
        return NOT_FOUND;
      }

      try {
        const res = await doctorApi.getDoctor(numericId);

        if (res.data.health_organisation?.id !== organisationId) {
          return NOT_FOUND;
        }

        return {
          doctor: res.data,
          isLoading: false,
          notFound: false,
          loadError: null,
        };
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          return NOT_FOUND;
        }
        return {
          doctor: null,
          isLoading: false,
          notFound: false,
          loadError: extractErrorMessages(err).join(" "),
        };
      }
    }

    load().then((next) => {
      if (!cancelled) setState(next);
    });

    return () => {
      cancelled = true;
    };
  }, [doctorIdParam, organisationId]);

  return state;
}
