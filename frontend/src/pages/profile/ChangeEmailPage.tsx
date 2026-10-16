import type { FormEvent } from "react";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import { authApi } from "../../api/auth";
import {
  extractErrorMessages,
  getThrottleMessage,
} from "../../api/errorMessages";
import { useAuth } from "../../auth/useAuth";
import ErrorAlert from "../../components/ui/ErrorAlert";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

function ChangeEmailPage() {
  const { refreshUser } = useAuth();

  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // The address as the server saved it, so the page shows what the user will really sign in with
  const [savedEmail, setSavedEmail] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors([]);

    const formData = new FormData(event.currentTarget);
    const newEmail = String(formData.get("newEmail") ?? "").trim();
    const currentPassword = String(formData.get("currentPassword") ?? "");

    setIsSubmitting(true);
    try {
      const res = await authApi.changeEmail({
        new_email: newEmail,
        current_password: currentPassword,
      });
      setSavedEmail(res.data.email);
    } catch (err) {
      const throttled = getThrottleMessage(err);
      setErrors(throttled ? [throttled] : extractErrorMessages(err));
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(false);

    // The address is saved. This only brings the settings page up to date
    try {
      await refreshUser();
    } catch {
      // it shows the new address after the next reload
    }
  };

  if (savedEmail !== null) {
    return (
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
          <Stack spacing={3}>
            <Typography variant="h4" component="h1">
              Email changed
            </Typography>

            <Alert severity="success">
              Your email is now {savedEmail}. Use it to sign in from now on.
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
              Change email
            </Typography>
            <Typography color="text.secondary">
              You will sign in with the new address from now on, and password
              reset emails will go to it. We ask for your password to make sure
              it's really you.
            </Typography>
          </Box>

          <ErrorAlert messages={errors} />

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="New email"
                name="newEmail"
                type="email"
                autoComplete="off"
                required
                autoFocus
                fullWidth
                disabled={isSubmitting}
              />

              <TextField
                label="Current password"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
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
                {isSubmitting ? "Saving..." : "Change email"}
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

export default ChangeEmailPage;
