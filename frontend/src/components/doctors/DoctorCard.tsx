import { Link as RouterLink } from "react-router-dom";

import Avatar from "@mui/material/Avatar";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import type { Doctor } from "../../types/doctor";

interface DoctorCardProps {
  doctor: Doctor;
}

function DoctorCard({ doctor }: DoctorCardProps) {
  const initials =
    `${doctor.first_name.charAt(0)}${doctor.last_name.charAt(0)}`.toUpperCase();

  return (
    <Card>
      <CardActionArea component={RouterLink} to={`/doctors/${doctor.id}`}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar>{initials}</Avatar>

            <div>
              <Typography variant="h6" component="h2">
                {doctor.last_name} {doctor.first_name}
              </Typography>

              {doctor.patronymic && (
                <Typography variant="body1">{doctor.patronymic}</Typography>
              )}

              {doctor.cabinet && (
                <Typography variant="body2" color="text.secondary">
                  Cabinet {doctor.cabinet}
                </Typography>
              )}
            </div>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export default DoctorCard;
