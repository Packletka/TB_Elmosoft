import { Link as RouterLink } from "react-router-dom";

import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import PhoneIcon from "@mui/icons-material/Phone";

import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import ResourceNotFound from "../../components/ui/ResourceNotFound";
import { getMockCurrentCustomerId } from "../../mocks/auth";
import { customers } from "../../mocks/customers";

function ProfileSettingsPage() {
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

  return (
    <Container maxWidth="md">
      <Stack spacing={3}>
        <Stack spacing={0.5}>
          <Typography variant="h4" component="h1">
            Account settings
          </Typography>

          <Typography color="text.secondary">
            Manage your account and security information.
          </Typography>
        </Stack>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
              <EmailIcon />

              <Stack sx={{ flexGrow: 1 }}>
                <Typography variant="h6">Email</Typography>

                <Typography color="text.secondary">{customer.email}</Typography>
              </Stack>

              <Button
                variant="outlined"
                component={RouterLink}
                to="/profile/settings/email"
              >
                Change email
              </Button>
            </Stack>

            <Divider />

            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
              <PhoneIcon />

              <Stack sx={{ flexGrow: 1 }}>
                <Typography variant="h6">Phone number</Typography>

                <Typography color="text.secondary">{customer.phone}</Typography>
              </Stack>

              <Button
                variant="outlined"
                component={RouterLink}
                to="/profile/settings/phone"
              >
                Change phone
              </Button>
            </Stack>

            <Divider />

            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
              <LockIcon />

              <Stack sx={{ flexGrow: 1 }}>
                <Typography variant="h6">Password</Typography>

                <Typography color="text.secondary">••••••••</Typography>
              </Stack>

              <Button
                variant="outlined"
                component={RouterLink}
                to="/profile/settings/password"
              >
                Change password
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}

export default ProfileSettingsPage;
