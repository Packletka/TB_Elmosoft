import { useEffect, useState } from "react";

import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import AppointmentCard from "../../components/appointments/AppointmentCard";
import { appointmentApi } from "../../api/appointments";
import { extractErrorMessages } from "../../api/errorMessages";
import { useAuth } from "../../auth/useAuth";
import type { TalonResponse } from "../../types/api/appointment";

function MyAppointmentsPage() {
  const { user } = useAuth();

  const [talons, setTalons] = useState<TalonResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    appointmentApi
      .getAppointments()
      .then((res) => {
        if (cancelled) return;
        const myTalons = res.data
          .filter((talon) => talon.customer !== null)
          .sort((a, b) =>
            `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
          );
        setTalons(myTalons);
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
  }, []);

  const handleCancelAppointment = async (talonId: number) => {
    setCancelError(null);
    try {
      await appointmentApi.cancelTalon(talonId);
      setTalons((current) => current.filter((talon) => talon.id !== talonId));
    } catch (err) {
      setCancelError(extractErrorMessages(err).join(" "));
    }
  };

  if (!user) return null;

  const fullName = [user.last_name, user.first_name, user.patronymic]
    .filter(Boolean)
    .join(" ");

  return (
    <Container maxWidth="md">
      <Stack spacing={3}>
        <Stack spacing={0.5}>
          <Typography variant="h4" component="h1">
            My appointments
          </Typography>
          <Typography color="text.secondary">{fullName}</Typography>
        </Stack>

        {cancelError && <Alert severity="error">{cancelError}</Alert>}

        {isLoading ? (
          <Stack sx={{ alignItems: "center", py: 6 }}>
            <CircularProgress />
          </Stack>
        ) : loadError ? (
          <Alert severity="error">{loadError}</Alert>
        ) : talons.length === 0 ? (
          <Typography color="text.secondary">
            You have no appointments.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {talons.map((talon) => (
              <AppointmentCard
                key={talon.id}
                talon={talon}
                onCancel={handleCancelAppointment}
              />
            ))}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}

export default MyAppointmentsPage;
