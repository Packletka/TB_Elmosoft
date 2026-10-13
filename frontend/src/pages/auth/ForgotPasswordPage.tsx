import type { FormEvent } from "react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";

import { authApi } from "../../api/auth";
import {
  extractErrorMessages,
  getThrottleMessage,
} from "../../api/errorMessages";
import ExitLink from "../../components/auth/ExitLink";
import ErrorAlert from "../../components/ui/ErrorAlert";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

// The "password was changed" email links here with ?from=password-changed (secure_account_url in
// backend/users/emails.py). Same form, same request, only the words differ: that visitor may have lost the account
const COPY = {
  forgot: {
    title: "Forgot your password?",
    intro:
      "Enter the email address of your account and we will send you a link to choose a new password.",
    footer: "Remembered it?",
  },
  secure: {
    title: "Secure your account",
    intro:
      "The password of your account was changed. If that was not you, enter the email address of your account. We will send you a link to choose a new password, and choosing one signs out every device, including any that is not yours.",
    footer: "Changed it yourself?",
  },
};

function ForgotPasswordPage() {
  const [searchParams] = useSearchParams();
  const copy =
    searchParams.get("from") === "password-changed" ? COPY.secure : COPY.forgot;
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // The address the request went out for. It stays after the "check your email" view is closed, so the form comes
  // back with it filled in
  const [email, setEmail] = useState("");
  // True means the request went through and the page shows "check your email" instead of the form
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors([]);

    const formData = new FormData(event.currentTarget);
    const submitted = String(formData.get("email") ?? "").trim();

    setIsSubmitting(true);
    try {
      await authApi.requestPasswordReset(submitted);
      setEmail(submitted);
      setIsSent(true);
    } catch (err) {
      const throttled = getThrottleMessage(err);
      setErrors(throttled ? [throttled] : extractErrorMessages(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSent) {
    return (
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
          <Stack spacing={3}>
            <Typography variant="h4" component="h1">
              Check your email
            </Typography>

            {/* Same wording as the server's answer: it says the same thing
                whether or not the address belongs to an account, and so
                must this page. */}
            <Alert severity="success">
              If an account with <strong>{email}</strong> exists, we have sent
              instructions to it.
            </Alert>

            <Typography color="text.secondary">
              The link in the email works only once and only for a short time.
              If nothing arrives, check your spam folder, wait a minute and try
              again.
            </Typography>

            <Stack spacing={2}>
              <Button
                variant="outlined"
                onClick={() => setIsSent(false)}
                fullWidth
              >
                Use a different email
              </Button>
              <ExitLink label="Back to sign in" />
            </Stack>
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
              {copy.title}
            </Typography>
            <Typography color="text.secondary">{copy.intro}</Typography>
          </Box>

          <ErrorAlert messages={errors} />

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={email}
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
                {isSubmitting ? "Sending..." : "Send reset link"}
              </Button>
            </Stack>
          </Box>

          <ExitLink lead={copy.footer} label="Sign in" />
        </Stack>
      </Paper>
    </Container>
  );
}

export default ForgotPasswordPage;
