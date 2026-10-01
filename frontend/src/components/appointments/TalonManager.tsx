import { useEffect, useState } from "react";

import AddIcon from "@mui/icons-material/Add";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import DoctorTalonCard from "./DoctorTalonCard";
import CreateTalonDialog from "./CreateTalonDialog";
import { appointmentApi } from "../../api/appointments";
import { extractErrorMessages } from "../../api/errorMessages";
import type { TalonResponse } from "../../types/api/appointment";
import type { DoctorWorkSchedule } from "../../types/api/doctor";

function sortByDateTime(talons: TalonResponse[]) {
  return [...talons].sort((a, b) =>
    `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
  );
}

interface TalonManagerProps {
  title: string;
  /**
   * Set when a representative manages one specific doctor. Omit it when a
   * doctor manages their own schedule: the backend already scopes a doctor's
   * list and creations to themselves.
   */
  doctorId?: number;
  workSchedule: DoctorWorkSchedule;
  slotDuration: number;
  healthOrganisationId: number | null;
}

function TalonManager({
  title,
  doctorId,
  workSchedule,
  slotDuration,
  healthOrganisationId,
}: TalonManagerProps) {
  const [talons, setTalons] = useState<TalonResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    appointmentApi
      .getAppointments({ active: true, doctorId })
      .then((res) => {
        if (!cancelled) setTalons(sortByDateTime(res.data));
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
  }, [doctorId]);

  const handleCancelAppointment = async (talonId: number) => {
    setActionError(null);
    try {
      const res = await appointmentApi.cancelTalon(talonId);
      setTalons((current) =>
        current.map((talon) => (talon.id === talonId ? res.data : talon)),
      );
    } catch (err) {
      setActionError(extractErrorMessages(err).join(" "));
    }
  };

  const handleDeleteTalon = async (talonId: number) => {
    setActionError(null);
    try {
      await appointmentApi.deleteTalon(talonId);
      setTalons((current) => current.filter((talon) => talon.id !== talonId));
    } catch (err) {
      setActionError(extractErrorMessages(err).join(" "));
    }
  };

  const upcomingTalons = talons.filter((talon) => !talon.is_free);
  const openSlots = talons.filter((talon) => talon.is_free);

  return (
    <>
      <Stack spacing={3}>
        <Stack
          direction="row"
          sx={{ justifyContent: "space-between", alignItems: "center" }}
        >
          <Typography variant="h4" component="h1">
            {title}
          </Typography>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsCreateDialogOpen(true)}
          >
            Create appointment
          </Button>
        </Stack>

        {actionError && <Alert severity="error">{actionError}</Alert>}

        {isLoading ? (
          <Stack sx={{ alignItems: "center", py: 6 }}>
            <CircularProgress />
          </Stack>
        ) : loadError ? (
          <Alert severity="error">{loadError}</Alert>
        ) : (
          <>
            <Stack spacing={2}>
              <Typography variant="h6" component="h2">
                Upcoming appointments
              </Typography>

              {upcomingTalons.length > 0 ? (
                <Stack spacing={2}>
                  {upcomingTalons.map((talon) => (
                    <DoctorTalonCard
                      key={talon.id}
                      talon={talon}
                      onCancel={handleCancelAppointment}
                      onDelete={handleDeleteTalon}
                    />
                  ))}
                </Stack>
              ) : (
                <Typography color="text.secondary">
                  No upcoming appointments.
                </Typography>
              )}
            </Stack>

            <Stack spacing={2}>
              <Typography variant="h6" component="h2">
                Open slots
              </Typography>

              {openSlots.length > 0 ? (
                <Stack spacing={2}>
                  {openSlots.map((talon) => (
                    <DoctorTalonCard
                      key={talon.id}
                      talon={talon}
                      onCancel={handleCancelAppointment}
                      onDelete={handleDeleteTalon}
                    />
                  ))}
                </Stack>
              ) : (
                <Typography color="text.secondary">
                  No open slots. Create one to let patients book with you.
                </Typography>
              )}
            </Stack>
          </>
        )}
      </Stack>

      {isCreateDialogOpen && (
        <CreateTalonDialog
          doctorId={doctorId}
          workSchedule={workSchedule}
          slotDuration={slotDuration}
          healthOrganisationId={healthOrganisationId}
          existingTalons={talons}
          onClose={() => setIsCreateDialogOpen(false)}
          onCreated={(talon) => {
            setTalons((current) => sortByDateTime([...current, talon]));
            setIsCreateDialogOpen(false);
          }}
        />
      )}
    </>
  );
}

export default TalonManager;
