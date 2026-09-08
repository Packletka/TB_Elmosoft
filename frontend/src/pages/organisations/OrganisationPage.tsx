import { Link as RouterLink, useParams } from "react-router-dom";

import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";

import PositionCard from "../../components/doctors/PositionCard";
import { doctors } from "../../mocks/doctors";
import { organisations } from "../../mocks/organisations";
import ResourceNotFound from "../../components/ui/ResourceNotFound";

function OrganisationPage() {
  const { organisationId } = useParams();

  const organisation = organisations.find(
    (organisation) => organisation.id === Number(organisationId),
  );

  if (!organisation) {
    return (
      <ResourceNotFound
        title="Organisation not found"
        message="The requested health organisation does not exist."
        backTo="/organisations"
        backLabel="Back to Health Organisations"
      />
    );
  }

  const organisationDoctors = doctors.filter(
    (doctor) => doctor.health_organisation === organisation.id,
  );

  const positions = [
    ...new Set(organisationDoctors.map((doctor) => doctor.position)),
  ];

  return (
    <Container maxWidth="md">
      <Stack spacing={3}>
        <Link component={RouterLink} to="/organisations">
          <KeyboardBackspaceIcon /> Back to Health Organisations
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

        <Divider />

        <div>
          <Typography variant="h6" component="h2">
            Available positions
          </Typography>

          <Stack spacing={2}>
            {positions.length > 0 ? (
              positions.map((position) => (
                <PositionCard
                  key={position}
                  organisationId={organisation.id}
                  position={position}
                />
              ))
            ) : (
              <Typography color="text.secondary">
                No doctors available in this organisation.
              </Typography>
            )}
          </Stack>
        </div>
      </Stack>
    </Container>
  );
}

export default OrganisationPage;
