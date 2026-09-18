import { useEffect, useState } from "react";
import {
  Link as RouterLink,
  Navigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import axios from "axios";

import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import DoctorCard from "../../components/doctors/DoctorCard";
import ResourceNotFound from "../../components/ui/ResourceNotFound";
import { organisationApi } from "../../api/organisations";
import { doctorApi } from "../../api/doctors";
import { extractErrorMessages } from "../../api/errorMessages";
import { getPluralPosition } from "../../utils/position";
import type { HealthOrganisationResponse } from "../../types/api/healthOrganisation";
import type { DoctorResponse } from "../../types/api/doctor";

function DoctorsPage() {
  const { organisationId } = useParams();
  const [searchParams] = useSearchParams();
  const position = searchParams.get("position");

  const [organisation, setOrganisation] =
    useState<HealthOrganisationResponse | null>(null);
  const [doctors, setDoctors] = useState<DoctorResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const numericId = Number(organisationId);

      if (!organisationId || !Number.isFinite(numericId)) {
        return { kind: "notFound" as const };
      }

      try {
        const [orgRes, doctorsRes] = await Promise.all([
          organisationApi.getOrganisation(numericId),
          doctorApi.getDoctorsByOrganisation(numericId),
        ]);
        return {
          kind: "success" as const,
          organisation: orgRes.data,
          doctors: doctorsRes.data,
        };
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          return { kind: "notFound" as const };
        }
        return {
          kind: "error" as const,
          message: extractErrorMessages(err).join(" "),
        };
      }
    }

    load().then((result) => {
      if (cancelled) return;

      if (result.kind === "success") {
        setOrganisation(result.organisation);
        setDoctors(result.doctors);
      } else if (result.kind === "notFound") {
        setNotFound(true);
      } else {
        setLoadError(result.message);
      }

      setIsLoading(false);
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

  if (notFound) {
    return (
      <ResourceNotFound
        title="Organisation not found"
        message="The requested health organisation does not exist."
        backTo="/organisations"
        backLabel="Back to Health Organisations"
      />
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

  const availablePositions = new Set(doctors.map((doctor) => doctor.position));

  if (position === null || !availablePositions.has(position)) {
    return <Navigate to={`/organisations/${organisation.id}`} replace />;
  }

  const filteredDoctors = doctors.filter(
    (doctor) => doctor.position === position,
  );

  return (
    <Container maxWidth="md">
      <Stack spacing={3}>
        <Link component={RouterLink} to={`/organisations/${organisation.id}`}>
          ← Back to {organisation.name}
        </Link>

        <Typography variant="h4" component="h1">
          {getPluralPosition(position)}
        </Typography>

        {filteredDoctors.length > 0 ? (
          <Stack spacing={2}>
            {filteredDoctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </Stack>
        ) : (
          <Stack spacing={2}>
            <Typography color="text.secondary">
              No doctors found for this position.
            </Typography>

            <Link
              component={RouterLink}
              to={`/organisations/${organisation.id}`}
            >
              Back to available positions
            </Link>
          </Stack>
        )}
      </Stack>
    </Container>
  );
}

export default DoctorsPage;
