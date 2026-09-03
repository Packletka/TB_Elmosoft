import { useState } from "react";

import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import AppointmentCard from "../../components/appointments/AppointmentCard";
import ResourceNotFound from "../../components/ui/ResourceNotFound";

import { cancelMockTalon, talons } from "../../mocks/appointments";
import { doctors } from "../../mocks/doctors";
import { organisations } from "../../mocks/organisations";
import { customers } from "../../mocks/customers";
import { getMockCurrentCustomerId } from "../../mocks/auth";

function MyAppointmentsPage() {
  const currentCustomerId = getMockCurrentCustomerId();

  const [customerTalons, setCustomerTalons] = useState(() =>
    talons
      .filter((talon) => talon.customer === currentCustomerId)
      .sort((a, b) =>
        `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
      ),
  );

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

  const handleCancelAppointment = (talonId: number) => {
    if (currentCustomerId === null) {
      return;
    }

    const cancelledTalon = cancelMockTalon(talonId, currentCustomerId);

    if (!cancelledTalon) {
      return;
    }

    setCustomerTalons((currentTalons) =>
      currentTalons.filter((talon) => talon.id !== cancelledTalon.id),
    );
  };

  return (
    <Container maxWidth="md">
      <Stack spacing={3}>
        <Stack spacing={0.5}>
          <Typography variant="h4" component="h1">
            My appointments
          </Typography>

          <Typography color="text.secondary">
            {customer.last_name} {customer.first_name} {customer.patronymic}
          </Typography>
        </Stack>

        {customerTalons.length === 0 ? (
          <Typography color="text.secondary">
            You have no appointments.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {customerTalons.map((talon) => {
              const doctor = doctors.find(
                (doctor) => doctor.id === talon.doctor,
              );

              if (!doctor) {
                return null;
              }

              const organisation = organisations.find(
                (organisation) =>
                  organisation.id === doctor.health_organisation,
              );

              if (!organisation) {
                return null;
              }

              return (
                <AppointmentCard
                  key={talon.id}
                  talon={talon}
                  doctor={doctor}
                  organisation={organisation}
                  onCancel={handleCancelAppointment}
                />
              );
            })}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}

export default MyAppointmentsPage;
