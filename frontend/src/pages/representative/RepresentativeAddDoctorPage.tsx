import { useState } from "react";
import type { FormEvent } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import NoOrganisationNotice from "../../components/representative/NoOrganisationNotice";
import PositionField from "../../components/representative/PositionField";
import WorkScheduleEditor from "../../components/representative/WorkScheduleEditor";
import { doctorApi } from "../../api/doctors";
import { userApi } from "../../api/users";
import { extractErrorMessages } from "../../api/errorMessages";
import { useAuth } from "../../auth/useAuth";
import { useOrganisationPositions } from "../../hooks/useOrganisationPositions";
import type { DoctorWorkSchedule } from "../../types/api/doctor";

import DigitsField from "../../components/representative/DigitsField";
import {
  MAX_CABINET,
  MAX_SLOT_MINUTES,
  validateCabinet,
  validatePosition,
  validateSchedule,
  validateSlotDuration,
} from "../../utils/doctorForm";

const DEFAULT_SCHEDULE: DoctorWorkSchedule = {
  monday: { start: "09:00", finish: "17:00" },
  tuesday: { start: "09:00", finish: "17:00" },
  wednesday: { start: "09:00", finish: "17:00" },
  thursday: { start: "09:00", finish: "17:00" },
  friday: { start: "09:00", finish: "17:00" },
};

function AddDoctorForm({ organisationId }: { organisationId: number }) {
  const navigate = useNavigate();
  const positionSuggestions = useOrganisationPositions(organisationId);

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [patronymic, setPatronymic] = useState("");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");

  const [position, setPosition] = useState("");
  const [cabinet, setCabinet] = useState("");
  const [slotDuration, setSlotDuration] = useState("30");
  const [workSchedule, setWorkSchedule] =
    useState<DoctorWorkSchedule>(DEFAULT_SCHEDULE);

  // Set once the account exists, so a retry skips straight to the profile step.
  const [createdUserId, setCreatedUserId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const accountLocked = createdUserId !== null;
  const passwordsMismatch =
    passwordRepeat !== "" && passwordRepeat !== password;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!accountLocked && password !== passwordRepeat) {
      setFormError("The passwords do not match.");
      return;
    }

    const validationError =
      validatePosition(position) ??
      validateCabinet(cabinet) ??
      validateSlotDuration(slotDuration) ??
      validateSchedule(workSchedule);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    const cabinetNumber = Number(cabinet);
    const slotDurationNumber = Number(slotDuration);

    setIsSubmitting(true);
    let accountCreated = createdUserId !== null;

    try {
      let userId = createdUserId;

      if (userId === null) {
        const userRes = await userApi.createUser({
          email: email.trim(),
          password,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          patronymic: patronymic.trim(),
        });
        userId = userRes.data.id;
        accountCreated = true;
        setCreatedUserId(userId);
      }

      // The backend places the doctor in the representative's own organisation.
      const doctorRes = await doctorApi.createDoctor({
        user: userId,
        position: position.trim(),
        cabinet: cabinetNumber,
        slot_duration: slotDurationNumber,
        work_schedule: workSchedule,
      });

      navigate(`/representative/doctors/${doctorRes.data.id}/talons`, {
        replace: true,
      });
    } catch (err) {
      const messages = extractErrorMessages(err).join(" ");
      setFormError(
        accountCreated
          ? `The account was created, but the doctor profile could not be saved. Fix the details and try again. ${messages}`
          : messages,
      );
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Stack spacing={3}>
        <Link component={RouterLink} to="/representative/positions">
          ← Back to positions
        </Link>

        <Typography variant="h4" component="h1">
          Add doctor
        </Typography>

        {accountLocked && (
          <Alert severity="info">
            The account for {email} was created. Only the doctor details can be
            changed now.
          </Alert>
        )}

        {formError && <Alert severity="error">{formError}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <Stack spacing={2}>
              <Typography variant="h6" component="h2">
                Account
              </Typography>

              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                fullWidth
                autoComplete="off"
                disabled={isSubmitting || accountLocked}
              />
              <TextField
                label="Last name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                required
                fullWidth
                disabled={isSubmitting || accountLocked}
              />
              <TextField
                label="First name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                required
                fullWidth
                disabled={isSubmitting || accountLocked}
              />
              <TextField
                label="Patronymic"
                value={patronymic}
                onChange={(event) => setPatronymic(event.target.value)}
                fullWidth
                disabled={isSubmitting || accountLocked}
              />
              <TextField
                label="Initial password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required={!accountLocked}
                fullWidth
                autoComplete="new-password"
                disabled={isSubmitting || accountLocked}
                helperText="You set this password and must pass it to the doctor. There is no password change yet."
              />
              <TextField
                label="Repeat password"
                type="password"
                value={passwordRepeat}
                onChange={(event) => setPasswordRepeat(event.target.value)}
                required={!accountLocked}
                fullWidth
                autoComplete="new-password"
                disabled={isSubmitting || accountLocked}
                error={passwordsMismatch}
                helperText={passwordsMismatch ? "Passwords do not match." : " "}
              />
            </Stack>

            <Stack spacing={2}>
              <Typography variant="h6" component="h2">
                Doctor
              </Typography>

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
              <DigitsField
                label="Appointment length (minutes)"
                value={slotDuration}
                onChange={setSlotDuration}
                maxLength={String(MAX_SLOT_MINUTES).length}
                disabled={isSubmitting}
                helperText="Fixed after creation."
              />

              <Typography variant="subtitle1">Working hours</Typography>
              <WorkScheduleEditor
                value={workSchedule}
                onChange={setWorkSchedule}
                disabled={isSubmitting}
              />
            </Stack>

            <Stack
              direction="row"
              spacing={2}
              sx={{ justifyContent: "flex-end" }}
            >
              <Button
                component={RouterLink}
                to="/representative/positions"
                variant="outlined"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Add doctor"}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
}

function RepresentativeAddDoctorPage() {
  const { user } = useAuth();

  if (!user || user.role !== "representative") {
    return null;
  }

  const organisationId = user.profile.health_organisation_id;

  if (organisationId === null) {
    return <NoOrganisationNotice />;
  }

  return <AddDoctorForm organisationId={organisationId} />;
}

export default RepresentativeAddDoctorPage;
