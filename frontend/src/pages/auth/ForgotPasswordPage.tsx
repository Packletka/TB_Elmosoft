import axios from "axios";
import type { FormEvent } from "react";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import { authApi } from "../../api/auth";
import { extractErrorMessages } from "../../api/errorMessages";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

function ForgotPasswordPage() {
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // The address we asked the server about. Not null means the request went
  // through and the page switches from the form to the "check your email" view.
  const [requestedFor, setRequestedFor] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    setIsSubmitting(true);
    try {
      await authApi.requestPasswordReset(email);
      setRequestedFor(email);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 429) {
        // The server answers with a technical sentence ("Expected available
        // in 3412 seconds"); a plain one is friendlier.
        setFormError("Too many requests. Please try again later.");
      } else {
        setFormError(extractErrorMessages(err).join(" "));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (requestedFor !== null) {
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
              If an account with <strong>{requestedFor}</strong> exists, we have
              sent instructions to it.
            </Alert>

            <Typography color="text.secondary">
              The link in the email works only once and only for a short time.
              If nothing arrives, check your spam folder, wait a minute and try
              again.
            </Typography>

            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                component={RouterLink}
                to="/login"
                fullWidth
              >
                Back to sign in
              </Button>
              <Button variant="outlined" onClick={() => setRequestedFor(null)}>
                Try again
              </Button>
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
              Forgot your password?
            </Typography>
            <Typography color="text.secondary">
              Enter the email address of your account and we will send you a
              link to choose a new password.
            </Typography>
          </Box>

          {formError && <Alert severity="error">{formError}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
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

          <Typography variant="body2" sx={{ textAlign: "center" }}>
            Remembered it?{" "}
            <Link component={RouterLink} to="/login" underline="hover">
              Sign in
            </Link>
          </Typography>
        </Stack>
      </Paper>
    </Container>
  );
}

export default ForgotPasswordPage;
