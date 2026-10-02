import Alert from "@mui/material/Alert";
import Container from "@mui/material/Container";

function NoOrganisationNotice() {
  return (
    <Container maxWidth="md">
      <Alert severity="info">
        You&apos;re not assigned to a health organisation yet, so there is
        nothing to manage. Ask an admin to assign you to one.
      </Alert>
    </Container>
  );
}

export default NoOrganisationNotice;
