import { useState } from "react";

import CloseIcon from "@mui/icons-material/Close";

import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import type { Talon } from "../../types/appointment";
import type { Doctor } from "../../types/doctor";
import type { HealthOrganisation } from "../../types/healthOrganisation";

interface AppointmentCardProps {
  talon: Talon;
  doctor: Doctor;
  organisation: HealthOrganisation;
  onCancel: (talonId: number) => void;
}

function AppointmentCard({
  talon,
  doctor,
  organisation,
  onCancel,
}: AppointmentCardProps) {
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  const doctorFullName = [
    doctor.last_name,
    doctor.first_name,
    doctor.patronymic,
  ]
    .filter(Boolean)
    .join(" ");

  const handleOpenCancelDialog = () => {
    setIsCancelDialogOpen(true);
  };

  const handleCloseCancelDialog = () => {
    setIsCancelDialogOpen(false);
  };

  const handleConfirmCancellation = () => {
    onCancel(talon.id);
    setIsCancelDialogOpen(false);
  };

  return (
    <>
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Stack
              direction="row"
              spacing={2}
              sx={{
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <Stack spacing={0.5}>
                <Typography variant="h6" component="h2">
                  {doctorFullName}
                </Typography>

                <Typography color="text.secondary">
                  {doctor.position}
                </Typography>
              </Stack>

              <Tooltip title="Cancel appointment">
                <IconButton
                  aria-label="Cancel appointment"
                  onClick={handleOpenCancelDialog}
                  size="small"
                >
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </Stack>

            <Divider />

            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">
                Organisation
              </Typography>

              <Typography>{organisation.name}</Typography>
            </Stack>

            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">
                Cabinet
              </Typography>

              <Typography>{doctor.cabinet}</Typography>
            </Stack>

            <Divider />

            <Stack direction="row" spacing={4}>
              <Stack spacing={0.5}>
                <Typography variant="body2" color="text.secondary">
                  Date
                </Typography>

                <Typography sx={{ fontWeight: 600 }}>{talon.date}</Typography>
              </Stack>

              <Stack spacing={0.5}>
                <Typography variant="body2" color="text.secondary">
                  Time
                </Typography>

                <Typography sx={{ fontWeight: 600 }}>{talon.time}</Typography>
              </Stack>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Dialog open={isCancelDialogOpen} onClose={handleCloseCancelDialog}>
        <DialogTitle>Cancel appointment?</DialogTitle>

        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel your appointment with{" "}
            {doctorFullName} on {talon.date} at {talon.time}?
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseCancelDialog}>Keep appointment</Button>

          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmCancellation}
          >
            Cancel appointment
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default AppointmentCard;
