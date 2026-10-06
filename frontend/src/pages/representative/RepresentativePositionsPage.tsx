import { useEffect, useState } from "react";

import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import PositionCard from "../../components/doctors/PositionCard.tsx";
import NoOrganisationNotice from "../../components/representative/NoOrganisationNotice.tsx";
import { doctorApi } from "../../api/doctors.ts";
import { organisationApi } from "../../api/organisations.ts";
import { extractErrorMessages } from "../../api/errorMessages.ts";
import { useAuth } from "../../auth/useAuth.ts";
import type { DoctorResponse } from "../../types/api/doctor.ts";
import type { HealthOrganisationResponse } from "../../types/api/healthOrganisation.ts";

import { Link as RouterLink } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import Button from "@mui/material/Button";

function Positions({ organisationId }: { organisationId: number }) {
  const [organisation, setOrganisation] =
    useState<HealthOrganisationResponse | null>(null);
  const [doctors, setDoctors] = useState<DoctorResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      organisationApi.getOrganisation(organisationId),
      doctorApi.getDoctorsByOrganisation(organisationId),
    ])
      .then(([orgRes, doctorsRes]) => {
        if (cancelled) return;
        setOrganisation(orgRes.data);
        setDoctors(doctorsRes.data);
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

  if (loadError || !organisation) {
    return (
      <Container maxWidth="md">
        <Alert severity="error">
          {loadError ?? "Something went wrong. Please try again."}
        </Alert>
      </Container>
    );
  }

  const positions = [...new Set(doctors.map((doctor) => doctor.position))];

  return (
    <Container maxWidth="md">
      <Stack spacing={3}>
        <Stack
          direction="row"
          spacing={2}
          sx={{ justifyContent: "space-between", alignItems: "flex-start" }}
        >
          <Stack spacing={0.5}>
            <Typography variant="h4" component="h1">
              {organisation.name}
            </Typography>
            <Typography color="text.secondary">
              Choose a position to manage its doctors&apos; appointments.
            </Typography>
          </Stack>

          <Button
            component={RouterLink}
            to="/representative/doctors/new"
            variant="contained"
            startIcon={<AddIcon />}
          >
            Add doctor
          </Button>
        </Stack>

        {positions.length > 0 ? (
          <Stack spacing={2}>
            {positions.map((position) => (
              <PositionCard
                key={position}
                organisationId={organisationId}
                position={position}
                to={`/representative/doctors?position=${encodeURIComponent(position)}`}
              />
            ))}
          </Stack>
        ) : (
          <Typography color="text.secondary">
            There are no doctors in your organisation yet.
          </Typography>
        )}
      </Stack>
    </Container>
  );
}

function RepresentativePositionsPage() {
  const { user } = useAuth();

  if (!user || user.role !== "representative") {
    return null;
  }

  const organisationId = user.profile.health_organisation_id;

  if (organisationId === null) {
    return <NoOrganisationNotice />;
  }

  return <Positions organisationId={organisationId} />;
}

export default RepresentativePositionsPage;
