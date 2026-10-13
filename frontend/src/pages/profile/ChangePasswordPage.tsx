import type { FormEvent } from "react";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import { authApi } from "../../api/auth";
import {
  extractErrorMessages,
  getThrottleMessage,
} from "../../api/errorMessages";
import { setTokens } from "../../auth/tokenStorage";
import PasswordRequirements from "../../components/auth/PasswordRequirements";
import ErrorAlert from "../../components/ui/ErrorAlert";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

function ChangePasswordPage() {
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors([]);

    const formData = new FormData(event.currentTarget);
    const currentPassword = String(formData.get("currentPassword") ?? "");
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (newPassword !== confirmPassword) {
      setErrors(["Passwords do not match."]);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      // The change ended every session, this one's included. The answer carries a new one, so the user stays
      // signed in here and only the other devices are signed out.
      setTokens(res.data.access, res.data.refresh);
      setIsDone(true);
    } catch (err) {
      const throttled = getThrottleMessage(err);
      setErrors(throttled ? [throttled] : extractErrorMessages(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDone) {
    return (
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
          <Stack spacing={3}>
            <Typography variant="h4" component="h1">
              Password changed
            </Typography>

            <Alert severity="success">
              Your password has been changed. You stay signed in here, and all
              your other devices were signed out.
            </Alert>

            <Button
              variant="contained"
              size="large"
              component={RouterLink}
              to="/profile/settings"
              fullWidth
            >
              Back to account settings
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Change password
            </Typography>
            <Typography color="text.secondary">
              You stay signed in on this device. Your other devices will be
              signed out.
            </Typography>
          </Box>

          <ErrorAlert messages={errors} />

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Current password"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                fullWidth
                disabled={isSubmitting}
              />

              <PasswordRequirements />

              <TextField
                label="New password"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                fullWidth
                disabled={isSubmitting}
              />

              <TextField
                label="Confirm new password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                fullWidth
                disabled={isSubmitting}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Change password"}
              </Button>

              <Button
                component={RouterLink}
                to="/profile/settings"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}

export default ChangePasswordPage;
