import { Link as RouterLink, useParams } from "react-router-dom";

import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { organisations } from "../../mocks/organisations";

function OrganisationPage() {
  const { organisationId } = useParams();

  const organisation = organisations.find(
    (organisation) => organisation.id === Number(organisationId),
  );

  if (!organisation) {
    return (
      <Container maxWidth="md">
        <Stack spacing={2}>
          <Typography variant="h4" component="h1">
            Organisation not found
          </Typography>

          <Typography color="text.secondary">
            The requested health organisation does not exist.
          </Typography>

          <Link component={RouterLink} to="/organisations">
            Back to Health Organisations
          </Link>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Stack spacing={3}>
        <Link component={RouterLink} to="/organisations">
          ← Back to Health Organisations
        </Link>

        <Typography variant="h4" component="h1">
          {organisation.name}
        </Typography>

        <Typography color="text.secondary">{organisation.address}</Typography>

        <Divider />

        <div>
          <Typography variant="h6" component="h2">
            General information
          </Typography>

          <Typography>{organisation.general_info}</Typography>
        </div>

        <Divider />

        <div>
          <Typography variant="h6" component="h2">
            Contacts
          </Typography>

          <Stack spacing={1}>
            <Typography>Phone: {organisation.phone}</Typography>

            <Typography>Email: {organisation.email}</Typography>

            <Typography>
              Website:{" "}
              <Link
                href={organisation.site}
                target="_blank"
                rel="noopener noreferrer"
              >
                {organisation.site}
              </Link>
            </Typography>
          </Stack>
        </div>
      </Stack>
    </Container>
  );
}

export default OrganisationPage;
