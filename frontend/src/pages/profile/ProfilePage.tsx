import { Link as RouterLink } from "react-router-dom";

import Avatar from "@mui/material/Avatar";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import EditIcon from "@mui/icons-material/Edit";
import SettingsIcon from "@mui/icons-material/Settings";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";

import ResourceNotFound from "../../components/ui/ResourceNotFound";
import { getMockCurrentCustomerId } from "../../mocks/auth";
import { customers } from "../../mocks/customers";

function ProfilePage() {
  const currentCustomerId = getMockCurrentCustomerId();

  const customer = customers.find(
    (customer) => customer.id === currentCustomerId,
  );

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

  const customerInitials =
    `${customer.first_name[0]}${customer.last_name[0]}`.toUpperCase();

  const customerFullName = [
    customer.last_name,
    customer.first_name,
    customer.patronymic,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Container maxWidth="md">
      <Stack spacing={3}>
        <Typography variant="h4" component="h1">
          Profile
        </Typography>

        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            sx={{
              width: 64,
              height: 64,
              fontSize: 24,
            }}
          >
            {customerInitials}
          </Avatar>

          <Stack spacing={0.5}>
            <Typography variant="h5" component="h2">
              {customerFullName}
            </Typography>

            <Typography color="text.secondary">{customer.email}</Typography>
          </Stack>
        </Stack>

        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          spacing={2}
        >
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              flex: 1,
            }}
          >
            <Stack spacing={1}>
              <Button
                component={RouterLink}
                to="/profile/edit"
                startIcon={<EditIcon />}
                variant="outlined"
              >
                Edit profile
              </Button>

              <Typography variant="body2" color="text.secondary">
                Change your personal information.
              </Typography>
            </Stack>
          </Paper>

          <Paper
            variant="outlined"
            sx={{
              p: 2,
              flex: 1,
            }}
          >
            <Stack spacing={1}>
              <Button
                component={RouterLink}
                to="/profile/settings"
                startIcon={<SettingsIcon />}
                variant="outlined"
              >
                Account settings
              </Button>

              <Typography variant="body2" color="text.secondary">
                Change your email, phone number or password.
              </Typography>
            </Stack>
          </Paper>
        </Stack>

        <Divider />

        <Typography variant="h6" component="h2">
          Personal information
        </Typography>

        <Stack spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="body2" color="text.secondary">
              Last name
            </Typography>

            <Typography>{customer.last_name}</Typography>
          </Stack>

          <Stack spacing={0.5}>
            <Typography variant="body2" color="text.secondary">
              First name
            </Typography>

            <Typography>{customer.first_name}</Typography>
          </Stack>

          <Stack spacing={0.5}>
            <Typography variant="body2" color="text.secondary">
              Patronymic
            </Typography>

            <Typography>{customer.patronymic || "—"}</Typography>
          </Stack>

          <Stack spacing={0.5}>
            <Typography variant="body2" color="text.secondary">
              Birthday
            </Typography>

            <Typography>{customer.birthday}</Typography>
          </Stack>

          <Stack spacing={0.5}>
            <Typography variant="body2" color="text.secondary">
              Phone
            </Typography>

            <Typography>{customer.phone}</Typography>
          </Stack>

          <Stack spacing={0.5}>
            <Typography variant="body2" color="text.secondary">
              Address
            </Typography>

            <Typography>{customer.address || "—"}</Typography>
          </Stack>
        </Stack>
      </Stack>
    </Container>
  );
}

export default ProfilePage;
