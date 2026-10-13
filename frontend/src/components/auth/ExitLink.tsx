import { Link as RouterLink } from "react-router-dom";

import { useAuth } from "../../auth/useAuth";

import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";

interface ExitLinkProps {
  // What a visitor who is not signed in sees: the link text and, optionally, a lead-in before it
  label: string;
  lead?: string;
}

// The way out of the password pages. They are public, so a signed-in user can land on them too, and "Sign in" means
// nothing to someone who already is: they get the home page instead
function ExitLink({ label, lead }: ExitLinkProps) {
  const { isAuthenticated, isInitialized } = useAuth();
  const to = isAuthenticated ? "/" : "/login";
  const text = isAuthenticated ? "Back to home" : label;

  return (
    <Typography
      variant="body2"
      // On a reload the saved session is restored a moment after the first render. Until then nobody knows which
      // wording is right, so the line keeps its place on the page but stays invisible, instead of flashing "Sign in"
      sx={{
        textAlign: "center",
        visibility: isInitialized ? "visible" : "hidden",
      }}
    >
      {!isAuthenticated && lead ? `${lead} ` : null}
      <Link component={RouterLink} to={to} underline="hover">
        {text}
      </Link>
    </Typography>
  );
}

export default ExitLink;
