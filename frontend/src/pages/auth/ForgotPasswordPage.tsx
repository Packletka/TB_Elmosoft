import type { FormEvent } from "react";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import {
  sendMockPasswordRecoveryCode,
  sendMockPasswordResetNotification,
  updateMockCurrentPassword,
  verifyMockCurrentPassword,
  verifyMockPasswordRecoveryCode,
} from "../../mocks/account";

import { clearMockAuthentication } from "../../mocks/auth";
import { customers } from "../../mocks/customers";

type PasswordRecoveryStep = "request" | "verification" | "reset" | "success";

function ForgotPasswordPage() {
  const [step, setStep] = useState<PasswordRecoveryStep>("request");

  const [recoveryEmail, setRecoveryEmail] = useState("");

  const [recoveryCustomerId, setRecoveryCustomerId] = useState<number | null>(
    null,
  );

  const [formError, setFormError] = useState<string | null>(null);

  const handleRequestCode = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setFormError(null);

    const formData = new FormData(event.currentTarget);

    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();

    const customer = customers.find(
      (customer) => customer.email.toLowerCase() === email,
    );

    setRecoveryEmail(email);
    setRecoveryCustomerId(customer?.id ?? null);

    if (customer) {
      sendMockPasswordRecoveryCode(customer.email);
    }

    /*
     * Important:
     * We deliberately continue to the same
     * screen whether the account exists or not.
     */
    setStep("verification");
  };

  const handleVerifyCode = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setFormError(null);

    const formData = new FormData(event.currentTarget);

    const code = String(formData.get("verificationCode") ?? "").trim();

    if (!/^\d{6}$/.test(code)) {
      setFormError("Enter the 6-digit verification code.");
      return;
    }

    if (recoveryCustomerId === null || !verifyMockPasswordRecoveryCode(code)) {
      setFormError("The verification code is incorrect.");
      return;
    }

    setStep("reset");
  };

  const handleResetPassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setFormError(null);

    const formData = new FormData(event.currentTarget);

    const newPassword = String(formData.get("newPassword") ?? "");

    const confirmNewPassword = String(formData.get("confirmNewPassword") ?? "");

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

    const customer = customers.find(
      (customer) => customer.id === recoveryCustomerId,
    );

    if (!customer) {
      setFormError("Unable to reset password.");
      return;
    }

    updateMockCurrentPassword(newPassword);

    /*
     * Password recovery should not leave
     * an existing mock session authenticated.
     */
    clearMockAuthentication();

    sendMockPasswordResetNotification(customer.email);

    setStep("success");
  };

  const handleResendCode = () => {
    const customer = customers.find(
      (customer) => customer.id === recoveryCustomerId,
    );

    if (!customer) {
      return;
    }

    sendMockPasswordRecoveryCode(customer.email);
  };

  const handleChangeEmail = () => {
    setFormError(null);
    setRecoveryEmail("");
    setRecoveryCustomerId(null);
    setStep("request");
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
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Forgot password
            </Typography>

            {step === "request" && (
              <Typography color="text.secondary">
                Enter the email address associated with your account.
              </Typography>
            )}

            {step === "verification" && (
              <Typography color="text.secondary">
                Check your email for a verification code.
              </Typography>
            )}

            {step === "reset" && (
              <Typography color="text.secondary">
                Choose a new password for your account.
              </Typography>
            )}
          </Box>

          {formError && <Alert severity="error">{formError}</Alert>}

          {step === "request" && (
            <Box component="form" onSubmit={handleRequestCode}>
              <Stack spacing={2}>
                <TextField
                  label="Email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  fullWidth
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                >
                  Send recovery code
                </Button>

                <Typography variant="body2" sx={{ textAlign: "center" }}>
                  Remember your password?{" "}
                  <Link component={RouterLink} to="/login" underline="hover">
                    Return to sign in
                  </Link>
                </Typography>
              </Stack>
            </Box>
          )}

          {step === "verification" && (
            <Box component="form" onSubmit={handleVerifyCode}>
              <Stack spacing={2}>
                <Alert severity="info">
                  If an account exists for {recoveryEmail}, a 6-digit recovery
                  code has been sent.
                </Alert>

                <TextField
                  label="Verification code"
                  name="verificationCode"
                  inputMode="numeric"
                  autoComplete="one-time-code"
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
                    onClick={handleChangeEmail}
                  >
                    Change email
                  </Button>

                  <Button type="submit" variant="contained">
                    Verify code
                  </Button>
                </Stack>
              </Stack>
            </Box>
          )}

          {step === "reset" && (
            <Box component="form" onSubmit={handleResetPassword}>
              <Stack spacing={2}>
                <Alert severity="success">Email address verified.</Alert>

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

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                >
                  Reset password
                </Button>
              </Stack>
            </Box>
          )}

          {step === "success" && (
            <Stack spacing={2}>
              <Alert severity="success">
                Your password has been reset successfully.
              </Alert>

              <Typography color="text.secondary">
                You can now sign in using your new password.
              </Typography>

              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                size="large"
              >
                Return to sign in
              </Button>
            </Stack>
          )}
        </Stack>
      </Paper>
    </Container>
  );
}

export default ForgotPasswordPage;
