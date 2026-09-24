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
  sendMockEmailChangeNotification,
  sendMockEmailVerificationCode,
  verifyMockCurrentPassword,
  verifyMockEmailVerificationCode,
} from "../../mocks/account";
import { getMockCurrentCustomerId } from "../../mocks/auth";
import {
  customers,
  isMockEmailInUse,
  updateMockCustomerEmail,
} from "../../mocks/customers";

type EmailChangeStep = "details" | "verification" | "success";

function ChangeEmailPage() {
  const currentCustomerId = getMockCurrentCustomerId();

  const customer = customers.find(
    (customer) => customer.id === currentCustomerId,
  );

  const [step, setStep] = useState<EmailChangeStep>("details");

  const [pendingEmail, setPendingEmail] = useState("");

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

  const handleRequestCode = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setFormError(null);

    const formData = new FormData(event.currentTarget);

    const newEmail = String(formData.get("newEmail") ?? "")
      .trim()
      .toLowerCase();

    const currentPassword = String(formData.get("currentPassword") ?? "");

    if (newEmail === customer.email.toLowerCase()) {
      setFormError("The new email must be different from your current email.");
      return;
    }

    if (isMockEmailInUse(newEmail, customer.id)) {
      setFormError("This email address is already in use.");
      return;
    }

    if (!verifyMockCurrentPassword(currentPassword)) {
      setFormError("Current password is incorrect.");
      return;
    }

    setPendingEmail(newEmail);

    sendMockEmailVerificationCode(newEmail);

    setStep("verification");
  };

  const handleVerifyCode = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setFormError(null);

    const formData = new FormData(event.currentTarget);

    const code = String(formData.get("verificationCode") ?? "").trim();

    if (!verifyMockEmailVerificationCode(code)) {
      setFormError("The verification code is incorrect.");
      return;
    }

    const oldEmail = customer.email;

    const updatedCustomer = updateMockCustomerEmail(customer.id, pendingEmail);

    if (!updatedCustomer) {
      setFormError("Unable to change email address.");
      return;
    }

    sendMockEmailChangeNotification(oldEmail, pendingEmail);

    setStep("success");
  };

  const handleResendCode = () => {
    if (!pendingEmail) {
      return;
    }

    sendMockEmailVerificationCode(pendingEmail);
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
              Change email
            </Typography>

            {step !== "success" && (
              <Typography color="text.secondary">
                Current email: {customer.email}
              </Typography>
            )}
          </Stack>

          {formError && <Alert severity="error">{formError}</Alert>}

          {step === "details" && (
            <Box component="form" onSubmit={handleRequestCode}>
              <Stack spacing={2}>
                <TextField
                  label="New email"
                  name="newEmail"
                  type="email"
                  autoComplete="email"
                  required
                  fullWidth
                />

                <TextField
                  label="Current password"
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
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
                    Send verification code
                  </Button>
                </Stack>
              </Stack>
            </Box>
          )}

          {step === "verification" && (
            <Box component="form" onSubmit={handleVerifyCode}>
              <Stack spacing={2}>
                <Alert severity="info">
                  A 6-digit verification code was sent to {pendingEmail}.
                </Alert>

                <TextField
                  label="Verification code"
                  name="verificationCode"
                  inputMode="numeric"
                  required
                  fullWidth
                  slotProps={{
                    htmlInput: {
                      maxLength: 6,
                    },
                  }}
                />

                <Button type="button" onClick={handleResendCode}>
                  Resend code
                </Button>

                <Stack
                  direction="row"
                  spacing={2}
                  sx={{ justifyContent: "flex-end" }}
                >
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={() => {
                      setFormError(null);
                      setStep("details");
                    }}
                  >
                    Back
                  </Button>

                  <Button type="submit" variant="contained">
                    Verify email
                  </Button>
                </Stack>
              </Stack>
            </Box>
          )}

          {step === "success" && (
            <Stack spacing={2}>
              <Alert severity="success">
                Your email address has been changed successfully.
              </Alert>

              <Typography>New email: {customer.email}</Typography>

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

export default ChangeEmailPage;
