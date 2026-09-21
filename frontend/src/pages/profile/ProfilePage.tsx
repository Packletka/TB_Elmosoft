import { Link as RouterLink } from "react-router-dom";

import Avatar from "@mui/material/Avatar";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import EditIcon from "@mui/icons-material/Edit";
import SettingsIcon from "@mui/icons-material/Settings";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";

import { useAuth } from "../../auth/useAuth";

function ProfilePage() {
  const { user } = useAuth();

  // Guarded by RequireAuth at the route level - user is guaranteed
  // non-null in practice, but fail safely rather than assume.
  if (!user) {
    return null;
  }

  const fullName = [user.last_name, user.first_name, user.patronymic]
    .filter(Boolean)
    .join(" ");

  const initials =
    `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();

  return (
    <Container maxWidth="md">
      <Stack spacing={3}>
        <Typography variant="h4" component="h1">
          Profile
        </Typography>

        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Avatar sx={{ width: 64, height: 64, fontSize: 24 }}>
            {initials}
          </Avatar>

          <Stack spacing={0.5}>
            <Typography variant="h5" component="h2">
              {fullName}
            </Typography>
            <Typography color="text.secondary">{user.email}</Typography>
          </Stack>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
            <Stack spacing={1}>
              <Button
                component={RouterLink}
                to="/profile/edit"
                startIcon={<EditIcon />}
                variant="outlined"
              >
                Edit profile
              </Button>
              <Typography variant="body2" color="text.secondary">
                Change your personal information.
              </Typography>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
            <Stack spacing={1}>
              <Button
                component={RouterLink}
                to="/profile/settings"
                startIcon={<SettingsIcon />}
                variant="outlined"
              >
                Account settings
              </Button>
              <Typography variant="body2" color="text.secondary">
                Change your email, phone number or password.
              </Typography>
            </Stack>
          </Paper>
        </Stack>

        <Divider />

        <Typography variant="h6" component="h2">
          Personal information
        </Typography>

        <Stack spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="body2" color="text.secondary">
              Last name
            </Typography>
            <Typography>{user.last_name || "—"}</Typography>
          </Stack>

          <Stack spacing={0.5}>
            <Typography variant="body2" color="text.secondary">
              First name
            </Typography>
            <Typography>{user.first_name || "—"}</Typography>
          </Stack>

          <Stack spacing={0.5}>
            <Typography variant="body2" color="text.secondary">
              Patronymic
            </Typography>
            <Typography>{user.patronymic || "—"}</Typography>
          </Stack>

          {user.role === "customer" && (
            <>
              <Stack spacing={0.5}>
                <Typography variant="body2" color="text.secondary">
                  Sex
                </Typography>
                <Typography>
                  {user.profile.sex === "M" ? "Male" : "Female"}
                </Typography>
              </Stack>

              <Stack spacing={0.5}>
                <Typography variant="body2" color="text.secondary">
                  Birthday
                </Typography>
                <Typography>{user.profile.birthday}</Typography>
              </Stack>

              <Stack spacing={0.5}>
                <Typography variant="body2" color="text.secondary">
                  Address
                </Typography>
                <Typography>{user.profile.address || "—"}</Typography>
              </Stack>
            </>
          )}

          {user.role === "doctor" && (
            <>
              <Stack spacing={0.5}>
                <Typography variant="body2" color="text.secondary">
                  Position
                </Typography>
                <Typography>{user.profile.position}</Typography>
              </Stack>

              <Stack spacing={0.5}>
                <Typography variant="body2" color="text.secondary">
                  Cabinet
                </Typography>
                <Typography>{user.profile.cabinet}</Typography>
              </Stack>

              <Stack spacing={0.5}>
                <Typography variant="body2" color="text.secondary">
                  Slot duration
                </Typography>
                <Typography>{user.profile.slot_duration} minutes</Typography>
              </Stack>
            </>
          )}

          {(user.role === "doctor" || user.role === "representative") && (
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">
                Health organisation
              </Typography>
              <Typography>
                {user.profile.health_organisation_id ?? "Not assigned"}
              </Typography>
            </Stack>
          )}
        </Stack>
      </Stack>
    </Container>
  );
}

export default ProfilePage;
