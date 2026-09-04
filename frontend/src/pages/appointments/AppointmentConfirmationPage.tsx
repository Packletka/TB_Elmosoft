import { useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";

import ResourceNotFound from "../../components/ui/ResourceNotFound";
import { bookMockTalon, talons } from "../../mocks/appointments";
import { doctors } from "../../mocks/doctors";
import { organisations } from "../../mocks/organisations";
import { customers } from "../../mocks/customers";
import { getMockCurrentCustomerId } from "../../mocks/auth";

function AppointmentConfirmationPage() {
  const { talonId } = useParams();
  const navigate = useNavigate();

  const [bookingError, setBookingError] = useState<string | null>(null);

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

  const currentCustomerId = getMockCurrentCustomerId();

  const customer = customers.find(
    (customer) => customer.id === currentCustomerId,
  );

  if (!customer) {
    return (
      <ResourceNotFound
        title="Customer not found"
        message="The authenticated customer could not be found."
        backTo="/organisations"
        backLabel="Back to Health Organisations"
      />
    );
  }

  const handleConfirmAppointment = () => {
    setBookingError(null);

    const bookedTalon = bookMockTalon(talon.id, customer.id);

    if (!bookedTalon) {
      setBookingError("This talon is no longer available.");

      return;
    }

    navigate(`/appointments/success/${bookedTalon.id}`, {
      replace: true,
    });
  };

  const customerInitials =
    `${customer.first_name[0]}${customer.last_name[0]}`.toUpperCase();

  const customerFullName = [
    customer.last_name,
    customer.first_name,
    customer.patronymic,
  ]
    .filter(Boolean)
    .join(" ");

  const isAvailable = talon.customer === null;

  return (
    <Container maxWidth="md">
      <Stack spacing={3}>
        <Typography variant="h4" component="h1">
          Appointment confirmation
        </Typography>

        {!isAvailable && (
          <Alert severity="warning">This talon is no longer available.</Alert>
        )}

        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Patient
          </Typography>

          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Avatar>{customerInitials}</Avatar>

            <Stack spacing={0.5}>
              <Typography variant="h6">{customerFullName}</Typography>

              <Typography variant="body2" color="text.secondary">
                {customer.email}
              </Typography>
            </Stack>
          </Stack>
        </Stack>

        <Divider />

        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            Organisation
          </Typography>

          <Typography variant="h6">{organisation.name}</Typography>
        </Stack>

        <Divider />

        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            Doctor
          </Typography>

          <Typography variant="h6">
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

        {bookingError && <Alert severity="error">{bookingError}</Alert>}

        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            component={RouterLink}
            to={`/doctors/${doctor.id}?date=${talon.date}`}
          >
            Previous step
          </Button>

          <Button
            variant="contained"
            onClick={handleConfirmAppointment}
            disabled={!isAvailable}
          >
            Confirm appointment
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}

export default AppointmentConfirmationPage;
