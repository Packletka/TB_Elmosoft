import { Link as RouterLink } from "react-router-dom";

import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

function NotFoundPage() {
  return (
    <Container maxWidth="md">
      <Stack spacing={2}>
        <Typography variant="h2" component="h1">
          404
        </Typography>

        <Typography variant="h5" component="h2">
          Page not found
        </Typography>

        <Typography color="text.secondary">
          The page you are looking for does not exist.
        </Typography>

        <Link component={RouterLink} to="/organisations">
          Back to Health Organisations
        </Link>
      </Stack>
    </Container>
  );
}

export default NotFoundPage;
