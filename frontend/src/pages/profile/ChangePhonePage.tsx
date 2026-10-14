import type { FormEvent } from "react";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import { profileApi } from "../../api/profile";
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

type Step = "number" | "code" | "done";

function ChangePhonePage() {
  const { user, refreshUser } = useAuth();

  const [step, setStep] = useState<Step>("number");
  // The number as typed, shown back on the next step. The server keeps its own normalised copy
  const [phone, setPhone] = useState("");
  const [savedPhone, setSavedPhone] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) return null;

  const showError = (err: unknown) => {
    const throttled = getThrottleMessage(err);
    setErrors(throttled ? [throttled] : extractErrorMessages(err));
  };

  // Asks for a code. Used for the first one and for "Send a new code": a new code replaces the old one
  const requestCode = async (value: string) => {
    setErrors([]);
    setNotice(null);
    setIsSubmitting(true);
    try {
      await profileApi.requestPhoneChange({ phone: value });
      setPhone(value);
      setStep("code");
      return true;
    } catch (err) {
      showError(err);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNumberSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await requestCode(String(formData.get("phone") ?? "").trim());
  };

  const handleResend = async () => {
    if (await requestCode(phone)) {
      setNotice("A new code is on its way. The old one no longer works.");
    }
  };

  const handleCodeSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors([]);

    const formData = new FormData(event.currentTarget);
    const code = String(formData.get("code") ?? "").trim();

    setIsSubmitting(true);
    try {
      const res = await profileApi.confirmPhoneChange({ code });
      setSavedPhone(res.data.phone);
      setStep("done");
    } catch (err) {
      showError(err);
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(false);

    // The number is saved. This only brings the settings page up to date
    try {
      await refreshUser();
    } catch {
      // it shows the new number after the next reload
    }
  };

  if (step === "done") {
    return (
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
          <Stack spacing={3}>
            <Typography variant="h4" component="h1">
              Phone number changed
            </Typography>

            <Alert severity="success">
              Your phone number is now {savedPhone}.
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

  if (step === "code") {
    return (
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                Enter the code
              </Typography>
              <Typography color="text.secondary">
                We emailed a 6-digit code to {user.email}. Enter it to change
                your phone number to {phone}. The code works for 10 minutes.
              </Typography>
            </Box>

            {notice && <Alert severity="info">{notice}</Alert>}
            <ErrorAlert messages={errors} />

            <Box component="form" onSubmit={handleCodeSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="Confirmation code"
                  name="code"
                  autoComplete="one-time-code"
                  slotProps={{ htmlInput: { inputMode: "numeric" } }}
                  required
                  autoFocus
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
                  {isSubmitting ? "Checking..." : "Confirm"}
                </Button>

                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Button onClick={handleResend} disabled={isSubmitting}>
                    Send a new code
                  </Button>
                  <Button
                    onClick={() => {
                      setErrors([]);
                      setNotice(null);
                      setStep("number");
                    }}
                    disabled={isSubmitting}
                  >
                    Use a different number
                  </Button>
                </Stack>
              </Stack>
            </Box>
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
              Change phone number
            </Typography>
            <Typography color="text.secondary">
              We'll email a confirmation code to {user.email}. Your number
              changes only after you enter it.
            </Typography>
          </Box>

          <ErrorAlert messages={errors} />

          <Box component="form" onSubmit={handleNumberSubmit}>
            <Stack spacing={2}>
              <TextField
                label="New phone number"
                name="phone"
                type="tel"
                autoComplete="tel"
                defaultValue={phone}
                helperText="For example +375 29 123-45-67"
                required
                autoFocus
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
                {isSubmitting ? "Sending..." : "Send code"}
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

export default ChangePhonePage;
