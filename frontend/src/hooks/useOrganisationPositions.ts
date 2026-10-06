import { useEffect, useState } from "react";

import { doctorApi } from "../api/doctors";

/** The distinct positions already used in an organisation, for suggestions. */
export function useOrganisationPositions(organisationId: number): string[] {
  const [positions, setPositions] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    doctorApi
      .getDoctorsByOrganisation(organisationId)
      .then((res) => {
        if (!cancelled) {
          setPositions([...new Set(res.data.map((doctor) => doctor.position))]);
        }
      })
      // Suggestions are optional, so a failed request just means none.
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [organisationId]);

  return positions;
}
