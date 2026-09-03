import type { FormEvent } from "react";
import {
  Link as RouterLink,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { getSafeReturnTo, mockAuthenticate } from "../../mocks/auth";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";

function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const reason = searchParams.get("reason");
  const rawReturnTo = searchParams.get("returnTo");

  const returnTo = getSafeReturnTo(rawReturnTo);

  const isAppointmentRedirect = reason === "appointment";

  const registerSearchParams = new URLSearchParams();

  const isAccountRedirect = reason === "account";

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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const email = formData.get("email");
    const password = formData.get("password");

    console.log({
      email,
      password,
    });

    // Temporary mock authentication.
    // Later this will become a real backend request.
    mockAuthenticate();

    navigate(returnTo, {
      replace: true,
    });

    // Later:
    // send email + password to backend
  };

  return (
    <Container maxWidth="sm">
      <Paper
        elevation={3}
        sx={{
          p: 4,
          mt: 4,
        }}
      >
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
              />

              <TextField
                label="Password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                fullWidth
              />

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <Link
                  component={RouterLink}
                  to="/forgot-password"
                  underline="hover"
                >
                  Forgot password?
                </Link>
              </Box>

              <Button type="submit" variant="contained" size="large" fullWidth>
                Sign in
              </Button>
            </Stack>
          </Box>

          <Typography variant="body2" textAlign="center">
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
