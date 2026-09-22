import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { profileApi } from "../../api/profile";
import { extractErrorMessages } from "../../api/errorMessages";
import { useAuth } from "../../auth/useAuth";
import type { CustomerSex } from "../../types/customer";
import type { UpdateMePayload } from "../../types/api/profile";

function EditProfilePage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const formData = new FormData(event.currentTarget);

    const base = {
      last_name: String(formData.get("last_name") ?? ""),
      first_name: String(formData.get("first_name") ?? ""),
      patronymic: String(formData.get("patronymic") ?? ""),
    };

    let payload: UpdateMePayload;

    if (user.role === "customer") {
      payload = {
        ...base,
        profile: {
          sex: String(formData.get("sex") ?? "") as CustomerSex,
          birthday: String(formData.get("birthday") ?? ""),
          address: String(formData.get("address") ?? ""),
        },
      };
    } else if (user.role === "doctor") {
      payload = {
        ...base,
        profile: {
          position: String(formData.get("position") ?? ""),
          cabinet: Number(formData.get("cabinet")),
          slot_duration: Number(formData.get("slot_duration")),
        },
      };
    } else {
      // representative & admin: nothing left to edit but their name,
      // now that health_organisation is admin-only.
      payload = base;
    }

    setIsSubmitting(true);

    try {
      await profileApi.updateMe(payload);
      await refreshUser();
      navigate("/profile", { replace: true });
    } catch (err) {
      setFormError(extractErrorMessages(err).join(" "));
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper variant="outlined" sx={{ p: 4, mt: 2 }}>
        <Stack spacing={3}>
          <Stack spacing={0.5}>
            <Typography variant="h4" component="h1">
              Edit profile
            </Typography>
            <Typography color="text.secondary">
              Update your personal information.
            </Typography>
          </Stack>

          {formError && <Alert severity="error">{formError}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Last name"
                name="last_name"
                defaultValue={user.last_name}
                required
                fullWidth
                disabled={isSubmitting}
              />
              <TextField
                label="First name"
                name="first_name"
                defaultValue={user.first_name}
                required
                fullWidth
                disabled={isSubmitting}
              />
              <TextField
                label="Patronymic"
                name="patronymic"
                defaultValue={user.patronymic}
                fullWidth
                disabled={isSubmitting}
              />

              {user.role === "customer" && (
                <>
                  <TextField
                    select
                    label="Sex"
                    name="sex"
                    defaultValue={user.profile.sex}
                    required
                    fullWidth
                    disabled={isSubmitting}
                  >
                    <MenuItem value="M">Male</MenuItem>
                    <MenuItem value="F">Female</MenuItem>
                  </TextField>

                  <TextField
                    label="Birthday"
                    name="birthday"
                    type="date"
                    defaultValue={user.profile.birthday}
                    required
                    fullWidth
                    disabled={isSubmitting}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />

                  <TextField
                    label="Address"
                    name="address"
                    defaultValue={user.profile.address}
                    fullWidth
                    disabled={isSubmitting}
                  />
                </>
              )}

              {user.role === "doctor" && (
                <>
                  <TextField
                    label="Position"
                    name="position"
                    defaultValue={user.profile.position}
                    required
                    fullWidth
                    disabled={isSubmitting}
                  />
                  <TextField
                    label="Cabinet"
                    name="cabinet"
                    type="number"
                    defaultValue={user.profile.cabinet}
                    required
                    fullWidth
                    disabled={isSubmitting}
                    slotProps={{ htmlInput: { min: 1 } }}
                  />
                  <TextField
                    label="Slot duration (minutes)"
                    name="slot_duration"
                    type="number"
                    defaultValue={user.profile.slot_duration}
                    required
                    fullWidth
                    disabled={isSubmitting}
                    slotProps={{ htmlInput: { min: 1 } }}
                  />
                </>
              )}

              <Stack
                direction="row"
                spacing={2}
                sx={{ justifyContent: "flex-end" }}
              >
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => navigate("/profile")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save changes"}
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}

export default EditProfilePage;
