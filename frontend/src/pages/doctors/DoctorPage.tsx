import { Link as RouterLink, useParams } from "react-router-dom";
import { useState } from "react";

import type { Dayjs } from "dayjs";

import Avatar from "@mui/material/Avatar";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import Button from "@mui/material/Button";

import { doctors } from "../../mocks/doctors";
import { getPluralPosition } from "../../utils/position";
import ResourceNotFound from "../../components/ui/ResourceNotFound";
import { talons } from "../../mocks/appointments";

function DoctorPage() {
  const { doctorId } = useParams();
  /* starts as null, meaning:
  user has not selected a date yet */
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);

  const doctor = doctors.find((doctor) => doctor.id === Number(doctorId));

  if (!doctor) {
    return (
      <ResourceNotFound
        title="Doctor not found"
        message="The requested doctor does not exist."
        backTo="/organisations"
        backLabel="Back to Health Organisations"
      />
    );
  }

  const freeTalons = talons.filter(
    (talon) => talon.doctor === doctor.id && talon.customer === null,
  );

  const availableDates = [...new Set(freeTalons.map((talon) => talon.date))];

  const availableDateSet = new Set(availableDates);

  const selectedDateString = selectedDate?.format("YYYY-MM-DD");

  const selectedDateTalons = selectedDateString
    ? freeTalons.filter((talon) => talon.date === selectedDateString)
    : [];

  const initials =
    `${doctor.first_name.charAt(0)}${doctor.last_name.charAt(0)}`.toUpperCase();

  const backLink =
    doctor.health_organisation !== null
      ? `/organisations/${doctor.health_organisation}/doctors?position=${encodeURIComponent(
          doctor.position,
        )}`
      : "/organisations";

  return (
    <Container maxWidth="md">
      <Stack spacing={3}>
        <Link component={RouterLink} to={backLink}>
          ← Back to {getPluralPosition(doctor.position)}
        </Link>

        <Stack direction="row" spacing={3} alignItems="center">
          <Avatar
            sx={{
              width: 80,
              height: 80,
              fontSize: 28,
            }}
          >
            {initials}
          </Avatar>

          <div>
            <Typography variant="h4" component="h1">
              {doctor.last_name} {doctor.first_name}
            </Typography>

            {doctor.patronymic && (
              <Typography variant="h6">{doctor.patronymic}</Typography>
            )}
          </div>
        </Stack>

        <Stack spacing={1}>
          <Typography>Position: {doctor.position}</Typography>

          {doctor.cabinet && <Typography>Cabinet: {doctor.cabinet}</Typography>}
        </Stack>
      </Stack>

      <Stack spacing={2}>
        <Typography variant="h6" component="h2">
          Free talons — temporary test
        </Typography>

        {freeTalons.length > 0 ? (
          freeTalons.map((talon) => (
            <Typography key={talon.id}>
              {talon.date} — {talon.time}
            </Typography>
          ))
        ) : (
          <Typography color="text.secondary">No free talons.</Typography>
        )}
      </Stack>

      <Stack spacing={2}>
        <Typography variant="h6" component="h2">
          Available dates — temporary test
        </Typography>

        {availableDates.length > 0 ? (
          availableDates.map((date) => (
            <Typography key={date}>{date}</Typography>
          ))
        ) : (
          <Typography color="text.secondary">No available dates.</Typography>
        )}
      </Stack>

      <Stack spacing={2}>
        <Typography variant="h6" component="h2">
          Available appointments
        </Typography>

        {availableDates.length > 0 ? (
          <>
            <DateCalendar
              value={selectedDate}
              onChange={(newDate) => setSelectedDate(newDate)}
              shouldDisableDate={(day) =>
                !availableDateSet.has(day.format("YYYY-MM-DD"))
              }
            />

            {selectedDate && (
              <Stack spacing={2}>
                <Typography variant="h6" component="h3">
                  Available times
                </Typography>

                <Stack
                  direction="row"
                  spacing={1}
                  useFlexGap
                  sx={{ flexWrap: "wrap" }}
                >
                  {selectedDateTalons.map((talon) => (
                    <Button key={talon.id} variant="outlined">
                      {talon.time}
                    </Button>
                  ))}
                </Stack>
              </Stack>
            )}
          </>
        ) : (
          <Typography color="text.secondary">
            This doctor has no available talons at the moment.
          </Typography>
        )}
      </Stack>
    </Container>
  );
}

export default DoctorPage;
