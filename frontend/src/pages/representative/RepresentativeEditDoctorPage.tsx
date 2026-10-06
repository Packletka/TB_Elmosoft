import { useState } from "react";
import type { FormEvent } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import DigitsField from "../../components/representative/DigitsField";
import NoOrganisationNotice from "../../components/representative/NoOrganisationNotice";
import PositionField from "../../components/representative/PositionField";
import WorkScheduleEditor from "../../components/representative/WorkScheduleEditor";
import ResourceNotFound from "../../components/ui/ResourceNotFound";
import { doctorApi } from "../../api/doctors";
import { extractErrorMessages } from "../../api/errorMessages";
import { useAuth } from "../../auth/useAuth";
import { useOrganisationDoctor } from "../../hooks/useOrganisationDoctor";
import { useOrganisationPositions } from "../../hooks/useOrganisationPositions";
import {
  MAX_CABINET,
  validateCabinet,
  validatePosition,
  validateSchedule,
} from "../../utils/doctorForm";
import { normalizeSchedule } from "../../utils/schedule";
import type {
  DoctorResponse,
  DoctorWorkSchedule,
} from "../../types/api/doctor";

interface EditDoctorFormProps {
  doctor: DoctorResponse;
  organisationId: number;
}

function EditDoctorForm({ doctor, organisationId }: EditDoctorFormProps) {
  const navigate = useNavigate();
  const positionSuggestions = useOrganisationPositions(organisationId);

  const [position, setPosition] = useState(doctor.position);
  const [cabinet, setCabinet] = useState(String(doctor.cabinet));
  const [workSchedule, setWorkSchedule] = useState<DoctorWorkSchedule>(() =>
    normalizeSchedule(doctor.work_schedule),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fullName = [doctor.last_name, doctor.first_name, doctor.patronymic]
    .filter(Boolean)
    .join(" ");
  const talonsPath = `/representative/doctors/${doctor.id}/talons`;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const validationError =
      validatePosition(position) ??
      validateCabinet(cabinet) ??
      validateSchedule(workSchedule);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      await doctorApi.updateDoctor(doctor.id, {
        position: position.trim(),
        cabinet: Number(cabinet),
        work_schedule: workSchedule,
      });

      navigate(talonsPath, { replace: true });
    } catch (err) {
      setFormError(extractErrorMessages(err).join(" "));
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Stack spacing={3}>
        <Link component={RouterLink} to={talonsPath}>
          ← Back to appointments
        </Link>

        <Stack spacing={0.5}>
          <Typography variant="h4" component="h1">
            Edit doctor
          </Typography>
          <Typography color="text.secondary">
            {fullName}. A name is changed on the doctor&apos;s own profile or by
            an admin.
          </Typography>
        </Stack>

        {formError && <Alert severity="error">{formError}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <PositionField
              value={position}
              onChange={setPosition}
              options={positionSuggestions}
              disabled={isSubmitting}
            />
            <DigitsField
              label="Cabinet"
              value={cabinet}
              onChange={setCabinet}
              maxLength={String(MAX_CABINET).length}
              disabled={isSubmitting}
            />
            <TextField
              label="Appointment length (minutes)"
              value={doctor.slot_duration}
              fullWidth
              disabled
              helperText="Fixed after creation."
            />

            <Typography variant="subtitle1">Working hours</Typography>
            <WorkScheduleEditor
              value={workSchedule}
              onChange={setWorkSchedule}
              disabled={isSubmitting}
            />

            <Stack
              direction="row"
              spacing={2}
              sx={{ justifyContent: "flex-end" }}
            >
              <Button
                component={RouterLink}
                to={talonsPath}
                variant="outlined"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save changes"}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
}

interface DoctorEditLoaderProps {
  doctorIdParam: string | undefined;
  organisationId: number;
}

function DoctorEditLoader({
  doctorIdParam,
  organisationId,
}: DoctorEditLoaderProps) {
  const { doctor, isLoading, notFound, loadError } = useOrganisationDoctor(
    doctorIdParam,
    organisationId,
  );

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
        title="Doctor not found"
        message="This doctor doesn't exist in your organisation."
        backTo="/representative/positions"
        backLabel="Back to positions"
      />
    );
  }

  if (loadError || !doctor) {
    return (
      <Container maxWidth="md">
        <Alert severity="error">
          {loadError ?? "Something went wrong. Please try again."}
        </Alert>
      </Container>
    );
  }

  return <EditDoctorForm doctor={doctor} organisationId={organisationId} />;
}

function RepresentativeEditDoctorPage() {
  const { doctorId } = useParams();
  const { user } = useAuth();

  if (!user || user.role !== "representative") {
    return null;
  }

  const organisationId = user.profile.health_organisation_id;

  if (organisationId === null) {
    return <NoOrganisationNotice />;
  }

  return (
    <DoctorEditLoader
      key={doctorId}
      doctorIdParam={doctorId}
      organisationId={organisationId}
    />
  );
}

export default RepresentativeEditDoctorPage;
