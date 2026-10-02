import { useEffect, useState } from "react";
import {
  Link as RouterLink,
  Navigate,
  useSearchParams,
} from "react-router-dom";

import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import DoctorCard from "../../components/doctors/DoctorCard.tsx";
import NoOrganisationNotice from "../../components/representative/NoOrganisationNotice.tsx";
import { doctorApi } from "../../api/doctors.ts";
import { extractErrorMessages } from "../../api/errorMessages.ts";
import { useAuth } from "../../auth/useAuth.ts";
import { getPluralPosition } from "../../utils/position.ts";
import type { DoctorResponse } from "../../types/api/doctor.ts";

function Doctors({ organisationId }: { organisationId: number }) {
  const [searchParams] = useSearchParams();
  const position = searchParams.get("position");

  const [doctors, setDoctors] = useState<DoctorResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    doctorApi
      .getDoctorsByOrganisation(organisationId)
      .then((res) => {
        if (!cancelled) setDoctors(res.data);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(extractErrorMessages(err).join(" "));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [organisationId]);

  if (isLoading) {
    return (
      <Container maxWidth="md">
        <Stack sx={{ alignItems: "center", py: 6 }}>
          <CircularProgress />
        </Stack>
      </Container>
    );
  }

  if (loadError) {
    return (
      <Container maxWidth="md">
        <Alert severity="error">{loadError}</Alert>
      </Container>
    );
  }

  if (
    position === null ||
    !doctors.some((doctor) => doctor.position === position)
  ) {
    return <Navigate to="/representative/positions" replace />;
  }

  const filteredDoctors = doctors.filter(
    (doctor) => doctor.position === position,
  );

  return (
    <Container maxWidth="md">
      <Stack spacing={3}>
        <Link component={RouterLink} to="/representative/positions">
          ← Back to positions
        </Link>

        <Typography variant="h4" component="h1">
          {getPluralPosition(position)}
        </Typography>

        <Stack spacing={2}>
          {filteredDoctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              to={`/representative/doctors/${doctor.id}/talons`}
            />
          ))}
        </Stack>
      </Stack>
    </Container>
  );
}

function RepresentativeDoctorsPage() {
  const { user } = useAuth();

  if (!user || user.role !== "representative") {
    return null;
  }

  const organisationId = user.profile.health_organisation_id;

  if (organisationId === null) {
    return <NoOrganisationNotice />;
  }

  return <Doctors organisationId={organisationId} />;
}

export default RepresentativeDoctorsPage;
