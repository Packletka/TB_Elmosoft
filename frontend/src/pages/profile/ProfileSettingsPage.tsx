import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import PhoneIcon from "@mui/icons-material/Phone";

import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { useAuth } from "../../auth/useAuth";

function ProfileSettingsPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <Container maxWidth="md">
      <Stack spacing={3}>
        <Stack spacing={0.5}>
          <Typography variant="h4" component="h1">
            Account settings
          </Typography>
          <Typography color="text.secondary">
            Manage your account and security information.
          </Typography>
        </Stack>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
              <EmailIcon />
              <Stack sx={{ flexGrow: 1 }}>
                <Typography variant="h6">Email</Typography>
                <Typography color="text.secondary">{user.email}</Typography>
              </Stack>
            </Stack>

            {user.role === "customer" && (
              <>
                <Divider />
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{ alignItems: "center" }}
                >
                  <PhoneIcon />
                  <Stack sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">Phone number</Typography>
                    <Typography color="text.secondary">
                      {user.profile.phone}
                    </Typography>
                  </Stack>
                </Stack>
              </>
            )}

            <Divider />

            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
              <LockIcon />
              <Stack sx={{ flexGrow: 1 }}>
                <Typography variant="h6">Password</Typography>
                <Typography color="text.secondary">••••••••</Typography>
              </Stack>
            </Stack>
          </Stack>
        </Paper>

        <Typography variant="body2" color="text.secondary">
          Changing your email, phone number, or password isn't available yet.
        </Typography>
      </Stack>
    </Container>
  );
}

export default ProfileSettingsPage;
