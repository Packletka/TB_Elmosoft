import { Link as RouterLink, useParams } from "react-router-dom";

import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import ResourceNotFound from "../../components/ui/ResourceNotFound";
import { talons } from "../../mocks/appointments";
import { doctors } from "../../mocks/doctors";
import { organisations } from "../../mocks/organisations";

function AppointmentSuccessPage() {
  const { talonId } = useParams();

  const talon = talons.find((talon) => talon.id === Number(talonId));

  if (!talon) {
    return (
      <ResourceNotFound
        title="Talon not found"
        message="The requested talon does not exist."
        backTo="/organisations"
        backLabel="Back to Health Organisations"
      />
    );
  }

  const doctor = doctors.find((doctor) => doctor.id === talon.doctor);

  if (!doctor) {
    return (
      <ResourceNotFound
        title="Doctor not found"
        message="The doctor associated with this talon does not exist."
        backTo="/organisations"
        backLabel="Back to Health Organisations"
      />
    );
  }

  const organisation = organisations.find(
    (organisation) => organisation.id === doctor.health_organisation,
  );

  if (!organisation) {
    return (
      <ResourceNotFound
        title="Organisation not found"
        message="The health organisation associated with this doctor does not exist."
        backTo="/organisations"
        backLabel="Back to Health Organisations"
      />
    );
  }

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

          <Typography variant="h6">{organisation.name}</Typography>
        </Stack>

        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            Doctor
          </Typography>

          <Typography>
            {doctor.last_name} {doctor.first_name} {doctor.patronymic}
          </Typography>
        </Stack>

        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            Position
          </Typography>

          <Typography>{doctor.position}</Typography>
        </Stack>

        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            Cabinet
          </Typography>

          <Typography>{doctor.cabinet}</Typography>
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

          <Typography>{talon.time}</Typography>
        </Stack>

        <Button
          variant="contained"
          component={RouterLink}
          to={`/organisations/${organisation.id}`}
        >
          Book another appointment
        </Button>
      </Stack>
    </Container>
  );
}

export default AppointmentSuccessPage;
