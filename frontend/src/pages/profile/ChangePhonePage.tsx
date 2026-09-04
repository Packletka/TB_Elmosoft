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
  sendMockPhoneChangeNotification,
  sendMockPhoneVerificationCode,
  verifyMockCurrentPassword,
  verifyMockPhoneVerificationCode,
} from "../../mocks/account";

import { getMockCurrentCustomerId } from "../../mocks/auth";

import {
  customers,
  isMockPhoneInUse,
  updateMockCustomerPhone,
} from "../../mocks/customers";

type PhoneChangeStep = "details" | "verification" | "success";

function ChangePhonePage() {
  const currentCustomerId = getMockCurrentCustomerId();

  const customer = customers.find(
    (customer) => customer.id === currentCustomerId,
  );

  const [step, setStep] = useState<PhoneChangeStep>("details");

  const [pendingPhone, setPendingPhone] = useState("");

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

    const newPhone = String(formData.get("newPhone") ?? "").trim();

    const currentPassword = String(formData.get("currentPassword") ?? "");

    if (newPhone === customer.phone) {
      setFormError(
        "The new phone number must be different from your current phone number.",
      );
      return;
    }

    const phonePattern = /^\+375\d{9}$/;

    if (!phonePattern.test(newPhone)) {
      setFormError(
        "Enter a valid Belarus phone number in the format +375XXXXXXXXX.",
      );
      return;
    }

    if (isMockPhoneInUse(newPhone, customer.id)) {
      setFormError("This phone number is already in use.");
      return;
    }

    if (!verifyMockCurrentPassword(currentPassword)) {
      setFormError("Current password is incorrect.");
      return;
    }

    setPendingPhone(newPhone);

    sendMockPhoneVerificationCode(newPhone);

    setStep("verification");
  };

  const handleVerifyCode = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setFormError(null);

    const formData = new FormData(event.currentTarget);

    const code = String(formData.get("verificationCode") ?? "").trim();

    if (!verifyMockPhoneVerificationCode(code)) {
      setFormError("The verification code is incorrect.");
      return;
    }

    const oldPhone = customer.phone;

    const updatedCustomer = updateMockCustomerPhone(customer.id, pendingPhone);

    if (!updatedCustomer) {
      setFormError("Unable to change phone number.");
      return;
    }

    sendMockPhoneChangeNotification(customer.email, oldPhone, pendingPhone);

    setStep("success");
  };

  const handleResendCode = () => {
    if (!pendingPhone) {
      return;
    }

    sendMockPhoneVerificationCode(pendingPhone);
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
              Change phone number
            </Typography>

            {step !== "success" && (
              <Typography color="text.secondary">
                Current phone: {customer.phone}
              </Typography>
            )}
          </Stack>

          {formError && <Alert severity="error">{formError}</Alert>}

          {step === "details" && (
            <Box component="form" onSubmit={handleRequestCode}>
              <Stack spacing={2}>
                <TextField
                  label="New phone number"
                  name="newPhone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+375291234567"
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

                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    component={RouterLink}
                    to="/profile/settings"
                    variant="outlined"
                  >
                    Cancel
                  </Button>

                  <Button type="submit" variant="contained">
                    Send SMS code
                  </Button>
                </Stack>
              </Stack>
            </Box>
          )}

          {step === "verification" && (
            <Box component="form" onSubmit={handleVerifyCode}>
              <Stack spacing={2}>
                <Alert severity="info">
                  A 4-digit verification code was sent to {pendingPhone}.
                </Alert>

                <TextField
                  label="Verification code"
                  name="verificationCode"
                  inputMode="numeric"
                  required
                  fullWidth
                  slotProps={{
                    htmlInput: {
                      maxLength: 4,
                    },
                  }}
                />

                <Button type="button" onClick={handleResendCode}>
                  Resend code
                </Button>

                <Stack direction="row" spacing={2} justifyContent="flex-end">
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
                    Verify phone
                  </Button>
                </Stack>
              </Stack>
            </Box>
          )}

          {step === "success" && (
            <Stack spacing={2}>
              <Alert severity="success">
                Your phone number has been changed successfully.
              </Alert>

              <Typography>New phone: {customer.phone}</Typography>

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

export default ChangePhonePage;
