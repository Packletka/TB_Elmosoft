import { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import axios from "axios";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import ResourceNotFound from "../../components/ui/ResourceNotFound";
import { appointmentApi } from "../../api/appointments";
import { extractErrorMessages } from "../../api/errorMessages";
import type { TalonResponse } from "../../types/api/appointment";

function AppointmentSuccessPage() {
  const { talonId } = useParams();

  const [talon, setTalon] = useState<TalonResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const numericId = Number(talonId);

      if (!talonId || !Number.isFinite(numericId)) {
        return { kind: "notFound" as const };
      }

      try {
        const res = await appointmentApi.getTalon(numericId);
        return { kind: "success" as const, talon: res.data };
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
        setTalon(result.talon);
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
  }, [talonId]);

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
        title="Appointment not found"
        message="The requested appointment does not exist."
        backTo="/organisations"
        backLabel="Back to Health Organisations"
      />
    );
  }

  if (loadError || !talon) {
    return (
      <Container maxWidth="md">
        <Alert severity="error">
          {loadError ?? "Something went wrong. Please try again."}
        </Alert>
      </Container>
    );
  }

  const doctorFullName = [
    talon.doctor.last_name,
    talon.doctor.first_name,
    talon.doctor.patronymic,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Container maxWidth="md">
      <Stack spacing={3}>
        <Typography variant="h4" component="h1">
          Appointment confirmed
        </Typography>

        <Typography color="text.secondary">
          Your appointment has been successfully confirmed.
        </Typography>

        <Divider />

        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            Organisation
          </Typography>
          <Typography variant="h6">
            {talon.doctor.health_organisation?.name ?? "—"}
          </Typography>
        </Stack>

        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            Doctor
          </Typography>
          <Typography>{doctorFullName}</Typography>
        </Stack>

        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            Position
          </Typography>
          <Typography>{talon.doctor.position}</Typography>
        </Stack>

        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            Cabinet
          </Typography>
          <Typography>{talon.doctor.cabinet}</Typography>
        </Stack>

        <Divider />

        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            Date
          </Typography>
          <Typography>{talon.date}</Typography>
        </Stack>

        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            Time
          </Typography>
          <Typography>{talon.time.slice(0, 5)}</Typography>
        </Stack>

        <Button
          variant="contained"
          component={RouterLink}
          to={
            talon.doctor.health_organisation
              ? `/organisations/${talon.doctor.health_organisation.id}`
              : "/organisations"
          }
        >
          Book another appointment
        </Button>
      </Stack>
    </Container>
  );
}

export default AppointmentSuccessPage;
