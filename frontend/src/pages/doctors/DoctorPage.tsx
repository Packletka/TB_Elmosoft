import { useEffect, useState } from "react";
import {
  Link as RouterLink,
  useParams,
  useSearchParams,
} from "react-router-dom";
import axios from "axios";

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";

import ResourceNotFound from "../../components/ui/ResourceNotFound";
import { doctorApi } from "../../api/doctors";
import { appointmentApi } from "../../api/appointments";
import { extractErrorMessages } from "../../api/errorMessages";
import { getPluralPosition } from "../../utils/position";
import type { DoctorResponse } from "../../types/api/doctor";
import type { TalonResponse } from "../../types/api/appointment";

dayjs.extend(customParseFormat);

function DoctorPage() {
  const { doctorId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [doctor, setDoctor] = useState<DoctorResponse | null>(null);
  const [talons, setTalons] = useState<TalonResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const numericId = Number(doctorId);

      if (!doctorId || !Number.isFinite(numericId)) {
        return { kind: "notFound" as const };
      }

      try {
        const [doctorRes, talonsRes] = await Promise.all([
          doctorApi.getDoctor(numericId),
          appointmentApi.getAvailableTalons(numericId),
        ]);
        return { kind: "success" as const, doctor: doctorRes.data, talons: talonsRes.data };
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          return { kind: "notFound" as const };
        }
        return { kind: "error" as const, message: extractErrorMessages(err).join(" ") };
      }
    }

    load().then((result) => {
      if (cancelled) return;

      if (result.kind === "success") {
        setDoctor(result.doctor);
        setTalons(result.talons);
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
  }, [doctorId]);

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
        message="The requested doctor does not exist."
        backTo="/organisations"
        backLabel="Back to Health Organisations"
      />
    );
  }

  if (loadError || !doctor) {
    return (
      <Container maxWidth="md">
        <Alert severity="error">{loadError ?? "Something went wrong. Please try again."}</Alert>
      </Container>
    );
  }

  const availableDates = [...new Set(talons.map((talon) => talon.date))];
  const availableDateSet = new Set(availableDates);

  const dateParam = searchParams.get("date");

  const parsedDateParam =
    dateParam !== null ? dayjs(dateParam, "YYYY-MM-DD", true) : null;

  const hasInvalidDateParam =
    dateParam !== null &&
    (!parsedDateParam?.isValid() || !availableDateSet.has(dateParam));

  const selectedDate =
    dateParam !== null && !hasInvalidDateParam ? parsedDateParam : null;

  const selectedDateString = selectedDate?.format("YYYY-MM-DD");

  const selectedDateTalons = selectedDateString
    ? talons.filter((talon) => talon.date === selectedDateString)
    : [];

  const initials =
    `${doctor.first_name.charAt(0)}${doctor.last_name.charAt(0)}`.toUpperCase();

  const backLink =
    doctor.health_organisation !== null
      ? `/organisations/${doctor.health_organisation.id}/doctors?position=${encodeURIComponent(
          doctor.position,
        )}`
      : "/organisations";

  return (
    <Container maxWidth="md">
      <Stack spacing={3}>
        <Link component={RouterLink} to={backLink}>
          ← Back to {getPluralPosition(doctor.position)}
        </Link>

        <Stack direction="row" spacing={3} sx={{ alignItems: "center" }}>
          <Avatar sx={{ width: 80, height: 80, fontSize: 28 }}>
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
          <Typography>Cabinet: {doctor.cabinet}</Typography>
        </Stack>
      </Stack>

      <Stack spacing={2}>
        <Typography variant="h6" component="h2">
          Available appointments
        </Typography>

        {hasInvalidDateParam && (
          <Alert severity="warning">
            The selected date is invalid or unavailable for this doctor.
          </Alert>
        )}

        {availableDates.length > 0 ? (
          <>
            <DateCalendar
              value={selectedDate}
              onChange={(newDate) => {
                if (!newDate) return;

                const newDateString = newDate.format("YYYY-MM-DD");
                if (!availableDateSet.has(newDateString)) return;

                setSearchParams((previousParams) => {
                  const nextParams = new URLSearchParams(previousParams);
                  nextParams.set("date", newDateString);
                  return nextParams;
                });
              }}
              shouldDisableDate={(day) =>
                !availableDateSet.has(day.format("YYYY-MM-DD"))
              }
            />

            {selectedDate && (
              <Stack spacing={2}>
                <Typography variant="h6" component="h3">
                  Available times
                </Typography>

                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                  {selectedDateTalons.map((talon) => (
                    <Button
                      key={talon.id}
                      variant="outlined"
                      component={RouterLink}
                      to={`/appointments/confirm/${talon.id}`}
                    >
                      {talon.time.slice(0, 5)}
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
