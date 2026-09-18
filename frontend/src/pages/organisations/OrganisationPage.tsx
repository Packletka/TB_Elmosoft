import { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import axios from "axios";

import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";

import PositionCard from "../../components/doctors/PositionCard";
import ResourceNotFound from "../../components/ui/ResourceNotFound";
import { organisationApi } from "../../api/organisations";
import { doctorApi } from "../../api/doctors";
import { extractErrorMessages } from "../../api/errorMessages";
import type { HealthOrganisationResponse } from "../../types/api/healthOrganisation";
import type { DoctorResponse } from "../../types/api/doctor";

function OrganisationPage() {
  const { organisationId } = useParams();

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

  const positions = [...new Set(doctors.map((doctor) => doctor.position))];

  return (
    <Container maxWidth="md">
      <Stack spacing={3}>
        <Link component={RouterLink} to="/organisations">
          <KeyboardBackspaceIcon /> Back to Health Organisations
        </Link>

        <Typography variant="h4" component="h1">
          {organisation.name}
        </Typography>

        <Typography color="text.secondary">{organisation.address}</Typography>

        <Divider />

        <div>
          <Typography variant="h6" component="h2">
            General information
          </Typography>

          <Typography>{organisation.general_info}</Typography>
        </div>

        <Divider />

        <div>
          <Typography variant="h6" component="h2">
            Contacts
          </Typography>

          <Stack spacing={1}>
            <Typography>Phone: {organisation.phone}</Typography>

            <Typography>Email: {organisation.email}</Typography>

            <Typography>
              Website:{" "}
              <Link
                href={organisation.site}
                target="_blank"
                rel="noopener noreferrer"
              >
                {organisation.site}
              </Link>
            </Typography>
          </Stack>
        </div>

        <Divider />

        <div>
          <Typography variant="h6" component="h2">
            Available positions
          </Typography>

          <Stack spacing={2}>
            {positions.length > 0 ? (
              positions.map((position) => (
                <PositionCard
                  key={position}
                  organisationId={organisation.id}
                  position={position}
                />
              ))
            ) : (
              <Typography color="text.secondary">
                No doctors available in this organisation.
              </Typography>
            )}
          </Stack>
        </div>
      </Stack>
    </Container>
  );
}

export default OrganisationPage;
