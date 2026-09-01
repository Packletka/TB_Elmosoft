import {
  Link as RouterLink,
  useParams,
  useSearchParams,
} from "react-router-dom";

import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import DoctorCard from "../../components/doctors/DoctorCard";
import { doctors } from "../../mocks/doctors";
import { organisations } from "../../mocks/organisations";
import { getPluralPosition } from "../../utils/position";

function DoctorsPage() {
  const { organisationId } = useParams();
  const [searchParams] = useSearchParams();

  const position = searchParams.get("position");

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

  const filteredDoctors = doctors.filter(
    (doctor) =>
      doctor.health_organisation === organisation.id &&
      doctor.position === position,
  );

  return (
    <Container maxWidth="md">
      <Stack spacing={3}>
        <Link component={RouterLink} to={`/organisations/${organisation.id}`}>
          ← Back to {organisation.name}
        </Link>

        {position && (
          <Typography variant="h4" component="h1">
            {getPluralPosition(position)}
          </Typography>
        )}

        {filteredDoctors.length > 0 ? (
          <Stack spacing={2}>
            {filteredDoctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </Stack>
        ) : (
          <Stack spacing={2}>
            <Typography color="text.secondary">
              No doctors found for this position.
            </Typography>

            <Link
              component={RouterLink}
              to={`/organisations/${organisation.id}`}
            >
              Back to available positions
            </Link>
          </Stack>
        )}
      </Stack>
    </Container>
  );
}

export default DoctorsPage;
