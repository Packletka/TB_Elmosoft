import { Link as RouterLink } from "react-router-dom";

import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

interface ResourceNotFoundProps {
  title: string;
  message: string;
  backTo: string;
  backLabel: string;
}

function ResourceNotFound({
  title,
  message,
  backTo,
  backLabel,
}: ResourceNotFoundProps) {
  return (
    <Container maxWidth="md">
      <Stack spacing={2}>
        <Typography variant="h4" component="h1">
          {title}
        </Typography>

        <Typography color="text.secondary">{message}</Typography>

        <Link component={RouterLink} to={backTo}>
          {backLabel}
        </Link>
      </Stack>
    </Container>
  );
}

export default ResourceNotFound;
