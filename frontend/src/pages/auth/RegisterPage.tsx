import type { FormEvent } from "react";
import { useState } from "react";
import {
  Link as RouterLink,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { getSafeReturnTo, registerMockCustomer } from "../../mocks/auth";

import type { Customer, CustomerSex } from "../../types/customer";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

function RegisterPage() {
  const [formError, setFormError] = useState<string | null>(null);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const reason = searchParams.get("reason");

  const rawReturnTo = searchParams.get("returnTo");

  const returnTo = getSafeReturnTo(rawReturnTo);

  const isAppointmentRedirect = reason === "appointment";

  const isAccountRedirect = reason === "account";

  const loginSearchParams = new URLSearchParams();

  if (reason === "appointment" || reason === "account") {
    loginSearchParams.set("reason", reason);
  }

  if (rawReturnTo) {
    loginSearchParams.set("returnTo", returnTo);
  }

  const loginQuery = loginSearchParams.toString();

  const loginUrl = loginQuery ? `/login?${loginQuery}` : "/login";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    const customerData: Omit<Customer, "id"> = {
      last_name: String(formData.get("last_name") ?? ""),
      first_name: String(formData.get("first_name") ?? ""),
      patronymic: String(formData.get("patronymic") ?? ""),
      email: String(formData.get("email") ?? ""),
      sex: String(formData.get("sex") ?? "") as CustomerSex,
      birthday: String(formData.get("birthday") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      address: String(formData.get("address") ?? ""),
    };

    const registrationSucceeded = registerMockCustomer(customerData, password);

    if (!registrationSucceeded) {
      setFormError("Unable to create the account.");
      return;
    }

    setFormError(null);

    navigate(returnTo, {
      replace: true,
    });
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
              To book an appointment with a doctor, please create an account or
              sign in.
            </Alert>
          )}

          {isAccountRedirect && (
            <Alert severity="info">
              Please create an account or sign in to access this page.
            </Alert>
          )}

          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Sign up
            </Typography>

            <Typography color="text.secondary">
              Create an account to book and manage your appointments.
            </Typography>
          </Box>

          {formError && <Alert severity="error">{formError}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Last name"
                name="last_name"
                autoComplete="family-name"
                required
                fullWidth
              />

              <TextField
                label="First name"
                name="first_name"
                autoComplete="given-name"
                required
                fullWidth
              />

              <TextField label="Patronymic" name="patronymic" fullWidth />

              <TextField
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                required
                fullWidth
              />

              <TextField
                select
                label="Sex"
                name="sex"
                required
                fullWidth
                defaultValue=""
              >
                <MenuItem value="M">Male</MenuItem>

                <MenuItem value="F">Female</MenuItem>
              </TextField>

              <TextField
                label="Birthday"
                name="birthday"
                type="date"
                required
                fullWidth
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />

              <TextField
                label="Phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+375 29 123-45-67"
                required
                fullWidth
              />

              <TextField
                label="Address"
                name="address"
                autoComplete="street-address"
                fullWidth
              />

              <TextField
                label="Password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                fullWidth
              />

              <TextField
                label="Confirm password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                fullWidth
              />

              <Button type="submit" variant="contained" size="large" fullWidth>
                Sign up
              </Button>
            </Stack>
          </Box>

          <Typography variant="body2" sx={{ textAlign: "center" }}>
            Already have an account?{" "}
            <Link component={RouterLink} to={loginUrl} underline="hover">
              Sign in
            </Link>
          </Typography>
        </Stack>
      </Paper>
    </Container>
  );
}

export default RegisterPage;
