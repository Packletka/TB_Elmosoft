import axios from "axios";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import {
  Link as RouterLink,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { authApi } from "../../api/auth";
import { extractErrorMessages } from "../../api/errorMessages";
import { useAuth } from "../../auth/useAuth";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

// The backend answers a link it does not accept (wrong, expired or already
// used - it never says which) with a 400 about "token". A password that is
// too weak is also a 400, but about "new_password", and the link stays usable.
function isRejectedLink(err: unknown): boolean {
  if (!axios.isAxiosError(err) || err.response?.status !== 400) {
    return false;
  }
  const data: unknown = err.response.data;
  return (
    typeof data === "object" &&
    data !== null &&
    ("token" in data || "uid" in data)
  );
}

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Read the link once, on the first render, and keep it in state. The effect
  // below then removes it from the address bar, so the token does not stay in
  // the browser history or in a copied or shared address.
  const [link] = useState(() => ({
    uid: searchParams.get("uid") ?? "",
    token: searchParams.get("token") ?? "",
  }));

  const [isLinkRejected, setIsLinkRejected] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (searchParams.size > 0) {
      navigate("/reset-password", { replace: true });
    }
  }, [navigate, searchParams]);

  const hasLink = link.uid !== "" && link.token !== "";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const formData = new FormData(event.currentTarget);
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (newPassword !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.resetPassword({
        uid: link.uid,
        token: link.token,
        new_password: newPassword,
      });
    } catch (err) {
      if (isRejectedLink(err)) {
        setIsLinkRejected(true);
      } else if (axios.isAxiosError(err) && err.response?.status === 429) {
        setFormError("Too many attempts. Please try again later.");
      } else {
        setFormError(extractErrorMessages(err).join(" "));
      }
      setIsSubmitting(false);
      return;
    }

    // The server has just ended every session of this account. End the one in
    // this browser as well, so the page does not look signed in while its
    // tokens are already dead. logout() never throws.
    await logout();
    setIsDone(true);
    setIsSubmitting(false);
  };

  if (isDone) {
    return (
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
          <Stack spacing={3}>
            <Typography variant="h4" component="h1">
              Password changed
            </Typography>

            <Alert severity="success">
              Your password has been changed. For your safety, you were signed
              out on all devices.
            </Alert>

            <Button
              variant="contained"
              size="large"
              component={RouterLink}
              to="/login"
              fullWidth
            >
              Sign in with your new password
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  if (!hasLink || isLinkRejected) {
    return (
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
          <Stack spacing={3}>
            <Typography variant="h4" component="h1">
              This link does not work
            </Typography>

            <Alert severity="warning">
              This link is invalid or has expired. Request a new one.
            </Alert>

            <Typography color="text.secondary">
              A reset link works only once and only for a short time. If you
              asked for several, use the newest email.
            </Typography>

            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                component={RouterLink}
                to="/forgot-password"
                fullWidth
              >
                Request a new link
              </Button>
              <Button variant="outlined" component={RouterLink} to="/login">
                Sign in
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
              Choose a new password
            </Typography>
            <Typography color="text.secondary">
              After you save it, you will be signed out on all devices.
            </Typography>
          </Box>

          {formError && <Alert severity="error">{formError}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="New password"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                helperText="Not too short, not a common password, not only digits."
                required
                fullWidth
                disabled={isSubmitting}
              />

              <TextField
                label="Confirm new password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
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
                {isSubmitting ? "Saving..." : "Change password"}
              </Button>
            </Stack>
          </Box>

          <Typography variant="body2" sx={{ textAlign: "center" }}>
            <Link component={RouterLink} to="/login" underline="hover">
              Back to sign in
            </Link>
          </Typography>
        </Stack>
      </Paper>
    </Container>
  );
}

export default ResetPasswordPage;
