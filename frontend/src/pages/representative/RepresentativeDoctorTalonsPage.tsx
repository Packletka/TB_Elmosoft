import { useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";

import TalonManager from "../../components/appointments/TalonManager";
import NoOrganisationNotice from "../../components/representative/NoOrganisationNotice";
import ResourceNotFound from "../../components/ui/ResourceNotFound";
import { doctorApi } from "../../api/doctors";
import { extractErrorMessages } from "../../api/errorMessages";
import { useAuth } from "../../auth/useAuth";
import { useOrganisationDoctor } from "../../hooks/useOrganisationDoctor";
import { getPluralPosition } from "../../utils/position";

interface DoctorTalonsProps {
  doctorIdParam: string | undefined;
  organisationId: number;
}

function DoctorTalons({ doctorIdParam, organisationId }: DoctorTalonsProps) {
  const navigate = useNavigate();
  const { doctor, isLoading, notFound, loadError } = useOrganisationDoctor(
    doctorIdParam,
    organisationId,
  );

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const closeDeleteDialog = () => {
    if (isDeleting) return;
    setIsDeleteDialogOpen(false);
    setDeleteError(null);
  };

  const handleDelete = async () => {
    setDeleteError(null);
    setIsDeleting(true);

    try {
      await doctorApi.deleteDoctor(doctor.id);
      navigate("/representative/positions", { replace: true });
    } catch (err) {
      setDeleteError(extractErrorMessages(err).join(" "));
      setIsDeleting(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Stack spacing={3}>
        <Stack
          direction="row"
          spacing={2}
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            component={RouterLink}
            to={`/representative/doctors?position=${encodeURIComponent(doctor.position)}`}
          >
            ← Back to {getPluralPosition(doctor.position)}
          </Link>

          <Stack direction="row" spacing={1}>
            <Button
              component={RouterLink}
              to={`/representative/doctors/${doctor.id}/edit`}
              variant="outlined"
              startIcon={<EditIcon />}
            >
              Edit doctor
            </Button>
            <Button
              color="error"
              variant="outlined"
              startIcon={<DeleteIcon />}
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              Delete doctor
            </Button>
          </Stack>
        </Stack>

        <TalonManager
          title={fullName}
          doctorId={doctor.id}
          workSchedule={doctor.work_schedule}
          slotDuration={doctor.slot_duration}
          healthOrganisationId={organisationId}
        />
      </Stack>

      <Dialog open={isDeleteDialogOpen} onClose={closeDeleteDialog}>
        <DialogTitle>Delete this doctor?</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <DialogContentText>
              This permanently removes {fullName} and all of their appointment
              slots. The login account stays. A doctor with upcoming booked
              appointments can&apos;t be deleted until those are cancelled.
            </DialogContentText>
            {deleteError && <Alert severity="error">{deleteError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} disabled={isDeleting}>
            Keep doctor
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete doctor"}
          </Button>
        </DialogActions>
      </Dialog>
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

  // The key remounts the page when only the URL parameter changes, so one
  // doctor's data never lingers on screen while another doctor's loads.
  return (
    <DoctorTalons
      key={doctorId}
      doctorIdParam={doctorId}
      organisationId={organisationId}
    />
  );
}

export default RepresentativeDoctorTalonsPage;
