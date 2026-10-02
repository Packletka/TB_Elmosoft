import { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import axios from "axios";

import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";

import TalonManager from "../../components/appointments/TalonManager";
import NoOrganisationNotice from "../../components/representative/NoOrganisationNotice";
import ResourceNotFound from "../../components/ui/ResourceNotFound";
import { doctorApi } from "../../api/doctors";
import { extractErrorMessages } from "../../api/errorMessages";
import { useAuth } from "../../auth/useAuth";
import { getPluralPosition } from "../../utils/position";
import type { DoctorResponse } from "../../types/api/doctor";

interface DoctorTalonsProps {
  doctorIdParam: string | undefined;
  organisationId: number;
}

function DoctorTalons({ doctorIdParam, organisationId }: DoctorTalonsProps) {
  const [doctor, setDoctor] = useState<DoctorResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const numericId = Number(doctorIdParam);

      if (!doctorIdParam || !Number.isFinite(numericId)) {
        return { kind: "notFound" as const };
      }

      try {
        const res = await doctorApi.getDoctor(numericId);

        // Doctors are public, so the backend returns any doctor. A doctor
        // from another organisation must look like it doesn't exist here.
        if (res.data.health_organisation?.id !== organisationId) {
          return { kind: "notFound" as const };
        }

        return { kind: "success" as const, doctor: res.data };
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          return { kind: "notFound" as const };
        }
        return {
          kind: "error" as const,
          message: extractErrorMessages(err).join(" "),
        };
      }
    }

    load().then((result) => {
      if (cancelled) return;

      if (result.kind === "success") {
        setDoctor(result.doctor);
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
  }, [doctorIdParam, organisationId]);

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

  const fullName = [doctor.last_name, doctor.first_name, doctor.patronymic]
    .filter(Boolean)
    .join(" ");

  return (
    <Container maxWidth="md">
      <Stack spacing={3}>
        <Link
          component={RouterLink}
          to={`/representative/doctors?position=${encodeURIComponent(doctor.position)}`}
        >
          ← Back to {getPluralPosition(doctor.position)}
        </Link>

        <TalonManager
          title={fullName}
          doctorId={doctor.id}
          workSchedule={doctor.work_schedule}
          slotDuration={doctor.slot_duration}
          healthOrganisationId={organisationId}
        />
      </Stack>
    </Container>
  );
}

function RepresentativeDoctorTalonsPage() {
  const { doctorId } = useParams();
  const { user } = useAuth();

  if (!user || user.role !== "representative") {
    return null;
  }

  const organisationId = user.profile.health_organisation_id;

  if (organisationId === null) {
    return <NoOrganisationNotice />;
  }

  // The key remounts the page when only the URL parameter changes (browser
  // back/forward between two doctors), so one doctor's talons never linger
  // on screen while another doctor's load.
  return (
    <DoctorTalons
      key={doctorId}
      doctorIdParam={doctorId}
      organisationId={organisationId}
    />
  );
}

export default RepresentativeDoctorTalonsPage;
