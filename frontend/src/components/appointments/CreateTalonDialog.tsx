import { useEffect, useState } from "react";
import type { Dayjs } from "dayjs";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";

import { appointmentApi } from "../../api/appointments";
import { organisationApi } from "../../api/organisations";
import { extractErrorMessages } from "../../api/errorMessages";
import {
  getAvailableStartTimes,
  hasAvailability,
} from "../../utils/talonAvailability";
import type { DoctorProfile } from "../../types/api/user";
import type { HealthOrganisationResponse } from "../../types/api/healthOrganisation";
import type { TalonResponse } from "../../types/api/appointment";

interface CreateTalonDialogProps {
  onClose: () => void;
  onCreated: (talon: TalonResponse) => void;
  doctorProfile: DoctorProfile;
  existingTalons: TalonResponse[];
}

function CreateTalonDialog({
  onClose,
  onCreated,
  doctorProfile,
  existingTalons,
}: CreateTalonDialogProps) {
  const [organisation, setOrganisation] =
    useState<HealthOrganisationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (doctorProfile.health_organisation_id === null) {
      return;
    }

    let cancelled = false;

    organisationApi
      .getOrganisation(doctorProfile.health_organisation_id)
      .then((res) => {
        if (!cancelled) setOrganisation(res.data);
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
  }, [doctorProfile.health_organisation_id]);

  const handleSelectTime = async (time: string) => {
    if (!selectedDate) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await appointmentApi.createTalon({
        date: selectedDate.format("YYYY-MM-DD"),
        time,
      });
      onCreated(res.data);
    } catch (err) {
      setSubmitError(extractErrorMessages(err).join(" "));
      setIsSubmitting(false);
    }
  };

  if (doctorProfile.health_organisation_id === null) {
    return (
      <Dialog open onClose={onClose}>
        <DialogTitle>Create appointment</DialogTitle>
        <DialogContent>
          <Alert severity="info">
            You&apos;re not assigned to a health organisation, so you can&apos;t
            create appointments yet. Contact your organisation&apos;s
            representative or an admin to be assigned.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  if (isLoading) {
    return (
      <Dialog open onClose={onClose}>
        <DialogTitle>Create appointment</DialogTitle>
        <DialogContent>
          <Stack sx={{ alignItems: "center", py: 4 }}>
            <CircularProgress />
          </Stack>
        </DialogContent>
      </Dialog>
    );
  }

  if (loadError || !organisation) {
    return (
      <Dialog open onClose={onClose}>
        <DialogTitle>Create appointment</DialogTitle>
        <DialogContent>
          <Alert severity="error">
            {loadError ?? "Something went wrong. Please try again."}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  const context = {
    workSchedule: doctorProfile.work_schedule,
    slotDuration: doctorProfile.slot_duration,
    organisationSchedule: organisation.schedule,
    existingTalons,
  };

  const availableTimes = selectedDate
    ? getAvailableStartTimes(selectedDate, context)
    : [];

  return (
    <Dialog open onClose={onClose}>
      <DialogTitle>Create appointment</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          {submitError && <Alert severity="error">{submitError}</Alert>}

          <DateCalendar
            value={selectedDate}
            disablePast
            onChange={(newDate) => setSelectedDate(newDate)}
            shouldDisableDate={(day) => !hasAvailability(day, context)}
          />

          {selectedDate && (
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Available times
              </Typography>

              {availableTimes.length > 0 ? (
                <Stack
                  direction="row"
                  spacing={1}
                  useFlexGap
                  sx={{ flexWrap: "wrap" }}
                >
                  {availableTimes.map((time) => (
                    <Button
                      key={time}
                      variant="outlined"
                      disabled={isSubmitting}
                      onClick={() => handleSelectTime(time)}
                    >
                      {time}
                    </Button>
                  ))}
                </Stack>
              ) : (
                <Typography color="text.secondary">
                  No times available on this date.
                </Typography>
              )}
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CreateTalonDialog;
