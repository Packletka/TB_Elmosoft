import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import ResourceNotFound from "../../components/ui/ResourceNotFound";
import { appointmentApi } from "../../api/appointments";
import { extractErrorMessages } from "../../api/errorMessages";
import { useAuth } from "../../auth/useAuth";
import type { TalonResponse } from "../../types/api/appointment";

function AppointmentConfirmationPage() {
  const { talonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [talon, setTalon] = useState<TalonResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

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
        title="Talon not found"
        message="The requested talon does not exist."
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

  if (!user) {
    // Shouldn't be reachable - this route is wrapped in RequireAuth - but
    // fail safely rather than crash on user.email below if it somehow is.
    return (
      <Container maxWidth="md">
        <Alert severity="error">You must be signed in to view this page.</Alert>
      </Container>
    );
  }

  const handleConfirmAppointment = async () => {
    setBookingError(null);
    setIsBooking(true);

    try {
      const res = await appointmentApi.bookTalon(talon.id);
      navigate(`/appointments/success/${res.data.id}`, { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setBookingError("This talon is no longer available.");
        setTalon((current) =>
          current ? { ...current, is_free: false } : current,
        );
      } else if (axios.isAxiosError(err) && err.response?.status === 400) {
        setBookingError(
          err.response.data?.detail ??
            "This appointment can no longer be booked.",
        );
      } else {
        setBookingError(extractErrorMessages(err).join(" "));
      }
    } finally {
      setIsBooking(false);
    }
  };

  const patientFullName = [user.last_name, user.first_name, user.patronymic]
    .filter(Boolean)
    .join(" ");

  const patientInitials =
    `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();

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
          Appointment confirmation
        </Typography>

        {!talon.is_free && (
          <Alert severity="warning">This talon is no longer available.</Alert>
        )}

        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Patient
          </Typography>

          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Avatar>{patientInitials}</Avatar>

            <Stack spacing={0.5}>
              <Typography variant="h6">{patientFullName}</Typography>
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
            </Stack>
          </Stack>
        </Stack>

        <Divider />

        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            Organisation
          </Typography>
          <Typography variant="h6">
            {talon.doctor.health_organisation?.name ?? "—"}
          </Typography>
        </Stack>

        <Divider />

        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            Doctor
          </Typography>
          <Typography variant="h6">{doctorFullName}</Typography>
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

        {bookingError && <Alert severity="error">{bookingError}</Alert>}

        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            component={RouterLink}
            to={`/doctors/${talon.doctor.id}?date=${talon.date}`}
            disabled={isBooking}
          >
            Previous step
          </Button>

          <Button
            variant="contained"
            onClick={handleConfirmAppointment}
            disabled={!talon.is_free || isBooking}
          >
            {isBooking ? "Booking..." : "Confirm appointment"}
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}

export default AppointmentConfirmationPage;
