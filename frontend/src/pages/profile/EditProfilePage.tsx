import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import ResourceNotFound from "../../components/ui/ResourceNotFound";
import { getMockCurrentCustomerId } from "../../mocks/auth";
import { customers, updateMockCustomerProfile } from "../../mocks/customers";
import type { CustomerSex } from "../../types/customer";

function EditProfilePage() {
  const navigate = useNavigate();

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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const updatedCustomer = updateMockCustomerProfile(customer.id, {
      last_name: String(formData.get("last_name") ?? ""),
      first_name: String(formData.get("first_name") ?? ""),
      patronymic: String(formData.get("patronymic") ?? ""),
      sex: String(formData.get("sex") ?? "") as CustomerSex,
      birthday: String(formData.get("birthday") ?? ""),
      address: String(formData.get("address") ?? ""),
    });

    if (!updatedCustomer) {
      return;
    }

    navigate("/profile", {
      replace: true,
    });
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
              Edit profile
            </Typography>

            <Typography color="text.secondary">
              Update your personal information.
            </Typography>
          </Stack>

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Last name"
                name="last_name"
                defaultValue={customer.last_name}
                required
                fullWidth
              />

              <TextField
                label="First name"
                name="first_name"
                defaultValue={customer.first_name}
                required
                fullWidth
              />

              <TextField
                label="Patronymic"
                name="patronymic"
                defaultValue={customer.patronymic}
                fullWidth
              />

              <TextField
                select
                label="Sex"
                name="sex"
                defaultValue={customer.sex}
                required
                fullWidth
              >
                <MenuItem value="M">Male</MenuItem>

                <MenuItem value="F">Female</MenuItem>
              </TextField>

              <TextField
                label="Birthday"
                name="birthday"
                type="date"
                defaultValue={customer.birthday}
                required
                fullWidth
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />

              <TextField
                label="Address"
                name="address"
                defaultValue={customer.address}
                fullWidth
              />

              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => navigate("/profile")}
                >
                  Cancel
                </Button>

                <Button type="submit" variant="contained">
                  Save changes
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
