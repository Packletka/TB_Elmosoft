import Container from "@mui/material/Container";

import TalonManager from "../../components/appointments/TalonManager";
import { useAuth } from "../../auth/useAuth";

function DoctorTalonsPage() {
  const { user } = useAuth();

  if (!user || user.role !== "doctor") {
    return null;
  }

  return (
    <Container maxWidth="md">
      <TalonManager
        title="My schedule"
        workSchedule={user.profile.work_schedule}
        slotDuration={user.profile.slot_duration}
        healthOrganisationId={user.profile.health_organisation_id}
      />
    </Container>
  );
}

export default DoctorTalonsPage;
