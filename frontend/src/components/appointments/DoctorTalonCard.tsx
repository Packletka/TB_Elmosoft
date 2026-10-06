import { useState } from "react";

import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";

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

import type { TalonResponse } from "../../types/api/appointment";

interface DoctorTalonCardProps {
  talon: TalonResponse;
  onCancel: (talonId: number) => void;
  onDelete: (talonId: number) => void;
}

function DoctorTalonCard({ talon, onCancel, onDelete }: DoctorTalonCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const displayTime = talon.time.slice(0, 5);

  const handleConfirm = () => {
    if (talon.is_free) {
      onDelete(talon.id);
    } else {
      onCancel(talon.id);
    }
    setIsDialogOpen(false);
  };

  return (
    <>
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Stack
              direction="row"
              spacing={2}
              sx={{ justifyContent: "space-between", alignItems: "flex-start" }}
            >
              <Stack spacing={0.5}>
                <Typography variant="h6" component="h2">
                  {talon.date} at {displayTime}
                </Typography>
                <Typography color="text.secondary">
                  Cabinet {talon.doctor.cabinet}
                </Typography>
              </Stack>

              <Tooltip
                title={talon.is_free ? "Delete slot" : "Cancel appointment"}
              >
                <IconButton
                  aria-label={
                    talon.is_free ? "Delete slot" : "Cancel appointment"
                  }
                  onClick={() => setIsDialogOpen(true)}
                  size="small"
                >
                  {talon.is_free ? <DeleteIcon /> : <CloseIcon />}
                </IconButton>
              </Tooltip>
            </Stack>

            {!talon.is_free && talon.customer && (
              <>
                <Divider />
                <Stack spacing={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    Patient
                  </Typography>
                  <Typography>
                    {talon.customer.last_name} {talon.customer.first_name}{" "}
                    {talon.customer.patronymic}
                  </Typography>
                  <Typography color="text.secondary">
                    {talon.customer.phone}
                  </Typography>
                </Stack>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogTitle>
          {talon.is_free ? "Delete this slot?" : "Cancel this appointment?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {talon.is_free
              ? `This will permanently remove the ${talon.date} ${displayTime} slot.`
              : `This will cancel the appointment with ${talon.customer?.last_name} ${talon.customer?.first_name} on ${talon.date} at ${displayTime}, freeing the slot.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Keep it</Button>
          <Button color="error" variant="contained" onClick={handleConfirm}>
            {talon.is_free ? "Delete" : "Cancel appointment"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default DoctorTalonCard;
