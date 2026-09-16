import type { FormEvent } from "react";
import { useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
// |
// |
// useNavigate,

import { getSafeReturnTo } from "../../auth/getSafeReturnTo";
import { useAuth } from "../../auth/useAuth";
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

function LoginPage() {
  const [searchParams] = useSearchParams();
  //   const navigate = useNavigate();
  const { login } = useAuth();

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reason = searchParams.get("reason");
  const rawReturnTo = searchParams.get("returnTo");
  const returnTo = getSafeReturnTo(rawReturnTo);

  const isAppointmentRedirect = reason === "appointment";
  const isAccountRedirect = reason === "account";

  const registerSearchParams = new URLSearchParams();
  if (reason === "appointment" || reason === "account") {
    registerSearchParams.set("reason", reason);
  }
  if (rawReturnTo) {
    registerSearchParams.set("returnTo", returnTo);
  }
  const registerQuery = registerSearchParams.toString();
  const registerUrl = registerQuery
    ? `/register?${registerQuery}`
    : "/register";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    setIsSubmitting(true);
    try {
      await login(email, password);
      // No explicit navigate: this page is wrapped in
      // RedirectIfAuthenticated, which reactively redirects to
      // returnTo once isAuthenticated becomes true.
    } catch (err) {
      setFormError(extractErrorMessages(err).join(" "));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Stack spacing={3}>
          {isAppointmentRedirect && (
            <Alert severity="info">
              To book an appointment with a doctor, please sign in or create an
              account.
            </Alert>
          )}

          {isAccountRedirect && (
            <Alert severity="info">
              Please sign in or create an account to access this page.
            </Alert>
          )}

          {formError && <Alert severity="error">{formError}</Alert>}

          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Sign in
            </Typography>
            <Typography color="text.secondary">
              Sign in to manage your appointments.
            </Typography>
          </Box>

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

              <TextField
                label="Password"
                name="password"
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
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </Stack>
          </Box>

          <Typography variant="body2" sx={{ textAlign: "center" }}>
            Don't have an account?{" "}
            <Link component={RouterLink} to={registerUrl} underline="hover">
              Sign up
            </Link>
          </Typography>
        </Stack>
      </Paper>
    </Container>
  );
}

export default LoginPage;
