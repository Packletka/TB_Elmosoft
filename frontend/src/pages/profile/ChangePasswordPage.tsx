import type { FormEvent } from "react";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import ResourceNotFound from "../../components/ui/ResourceNotFound";

import {
  sendMockPasswordChangeNotification,
  updateMockCurrentPassword,
  verifyMockCurrentPassword,
} from "../../mocks/account";

import { getMockCurrentCustomerId } from "../../mocks/auth";
import { customers } from "../../mocks/customers";

type PasswordChangeStep = "form" | "success";

function ChangePasswordPage() {
  const currentCustomerId = getMockCurrentCustomerId();

  const customer = customers.find(
    (customer) => customer.id === currentCustomerId,
  );

  const [step, setStep] = useState<PasswordChangeStep>("form");

  const [formError, setFormError] = useState<string | null>(null);

  if (!customer) {
    return (
      <ResourceNotFound
        title="Customer not found"
        message="The authenticated customer could not be found."
        backTo="/organisations"
        backLabel="Back to Health Organisations"
      />
    );
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setFormError(null);

    const formData = new FormData(event.currentTarget);

    const currentPassword = String(formData.get("currentPassword") ?? "");

    const newPassword = String(formData.get("newPassword") ?? "");

    const confirmNewPassword = String(formData.get("confirmNewPassword") ?? "");

    if (!verifyMockCurrentPassword(currentPassword)) {
      setFormError("Current password is incorrect.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setFormError("New passwords do not match.");
      return;
    }

    if (verifyMockCurrentPassword(newPassword)) {
      setFormError(
        "The new password must be different from your current password.",
      );
      return;
    }

    updateMockCurrentPassword(newPassword);

    sendMockPasswordChangeNotification(customer.email);

    setStep("success");
  };

  return (
    <Container maxWidth="sm">
      <Paper
        variant="outlined"
        sx={{
          p: 4,
          mt: 2,
        }}
      >
        <Stack spacing={3}>
          <Stack spacing={0.5}>
            <Typography variant="h4" component="h1">
              Change password
            </Typography>

            {step === "form" && (
              <Typography color="text.secondary">
                Enter your current password and choose a new one.
              </Typography>
            )}
          </Stack>

          {formError && <Alert severity="error">{formError}</Alert>}

          {step === "form" && (
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="Current password"
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  required
                  fullWidth
                />

                <TextField
                  label="New password"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  fullWidth
                />

                <TextField
                  label="Confirm new password"
                  name="confirmNewPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  fullWidth
                />

                <Stack
                  direction="row"
                  spacing={2}
                  sx={{ justifyContent: "flex-end" }}
                >
                  <Button
                    component={RouterLink}
                    to="/profile/settings"
                    variant="outlined"
                  >
                    Cancel
                  </Button>

                  <Button type="submit" variant="contained">
                    Change password
                  </Button>
                </Stack>
              </Stack>
            </Box>
          )}

          {step === "success" && (
            <Stack spacing={2}>
              <Alert severity="success">
                Your password has been changed successfully.
              </Alert>

              <Typography color="text.secondary">
                A security notification was sent to {customer.email}.
              </Typography>

              <Button
                component={RouterLink}
                to="/profile/settings"
                variant="contained"
              >
                Return to account settings
              </Button>
            </Stack>
          )}
        </Stack>
      </Paper>
    </Container>
  );
}

export default ChangePasswordPage;
