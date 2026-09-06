import { Link as RouterLink } from "react-router-dom";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { isMockAuthenticated } from "../mocks/auth";

const bookingSteps = [
  {
    number: 1,
    title: "Choose an organisation",
    description: "Select the health organisation you need.",
  },
  {
    number: 2,
    title: "Choose a doctor",
    description: "Find the doctor you need by position.",
  },
  {
    number: 3,
    title: "Select date and time",
    description: "Choose from the doctor's available appointments.",
  },
  {
    number: 4,
    title: "Confirm appointment",
    description: "Review the details and confirm your booking.",
  },
];

function HomePage() {
  const isAuthenticated = isMockAuthenticated();

  return (
    <Container maxWidth="lg">
      <Stack spacing={5}>
        <Paper
          variant="outlined"
          sx={{
            px: {
              xs: 3,
              sm: 6,
            },
            py: {
              xs: 4,
              sm: 6,
            },
          }}
        >
          <Stack
            spacing={2}
            sx={{
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <Typography variant="h3" component="h1">
              Find and book a doctor appointment
            </Typography>

            <Typography
              color="text.secondary"
              sx={{
                maxWidth: 650,
              }}
            >
              Choose a health organisation, find the doctor you need and select
              an available appointment.
            </Typography>

            <Button
              component={RouterLink}
              to="/organisations"
              variant="contained"
              size="large"
              sx={{
                mt: 1,
              }}
            >
              Find an appointment
            </Button>
          </Stack>
        </Paper>

        <Stack spacing={3}>
          <Typography
            variant="h4"
            component="h2"
            sx={{
              textAlign: "center",
            }}
          >
            How it works
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(4, 1fr)",
              },
              gap: 2,
            }}
          >
            {bookingSteps.map((step) => (
              <Paper
                key={step.number}
                variant="outlined"
                sx={{
                  p: 3,
                  height: "100%",
                }}
              >
                <Stack spacing={2}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 600,
                    }}
                  >
                    {step.number}
                  </Box>

                  <Typography variant="h6" component="h3">
                    {step.title}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>
                </Stack>
              </Paper>
            ))}
          </Box>
        </Stack>

        <Paper
          variant="outlined"
          sx={{
            p: 3,
          }}
        >
          {isAuthenticated ? (
            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={2}
              sx={{
                alignItems: {
                  xs: "stretch",
                  sm: "center",
                },
                justifyContent: "space-between",
              }}
            >
              <Stack spacing={0.5}>
                <Typography variant="h5" component="h2">
                  Manage your appointments
                </Typography>

                <Typography color="text.secondary">
                  View your booked appointments and manage appointments you no
                  longer need.
                </Typography>
              </Stack>

              <Button
                component={RouterLink}
                to="/appointments"
                variant="outlined"
                size="large"
              >
                My appointments
              </Button>
            </Stack>
          ) : (
            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={2}
              sx={{
                alignItems: {
                  xs: "stretch",
                  sm: "center",
                },
                justifyContent: "space-between",
              }}
            >
              <Stack spacing={0.5}>
                <Typography variant="h5" component="h2">
                  Already have an account?
                </Typography>

                <Typography color="text.secondary">
                  Sign in to view and manage your appointments.
                </Typography>
              </Stack>

              <Button
                component={RouterLink}
                to="/login"
                variant="outlined"
                size="large"
              >
                Sign in
              </Button>
            </Stack>
          )}
        </Paper>
      </Stack>
    </Container>
  );
}

export default HomePage;
