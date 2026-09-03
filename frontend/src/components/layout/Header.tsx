import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";

import AppBar from "@mui/material/AppBar";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

import {
  clearMockAuthentication,
  getSafeReturnTo,
  isMockAuthenticated,
} from "../../mocks/auth";

function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  const isAuthenticated = isMockAuthenticated();

  const currentSearchParams = new URLSearchParams(location.search);

  const reason = currentSearchParams.get("reason");

  const rawReturnTo = currentSearchParams.get("returnTo");

  const isAuthenticationPage =
    location.pathname === "/login" || location.pathname === "/register";

  const hasAuthenticationContext =
    isAuthenticationPage &&
    (reason === "appointment" || reason === "account") &&
    rawReturnTo !== null;

  const authSearchParams = new URLSearchParams();

  if (hasAuthenticationContext) {
    authSearchParams.set("reason", reason);

    authSearchParams.set("returnTo", getSafeReturnTo(rawReturnTo));
  }

  const authQuery = authSearchParams.toString();

  const loginUrl = authQuery ? `/login?${authQuery}` : "/login";

  const registerUrl = authQuery ? `/register?${authQuery}` : "/register";

  const handleSignOut = () => {
    clearMockAuthentication();

    navigate("/organisations", {
      replace: true,
    });
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/organisations"
          sx={{
            flexGrow: 1,
            color: "inherit",
            textDecoration: "none",
          }}
        >
          Health App
        </Typography>

        {isAuthenticated ? (
          <Stack direction="row" spacing={1}>
            <Button color="inherit" component={RouterLink} to="/appointments">
              My appointments
            </Button>

            <Button color="inherit" component={RouterLink} to="/profile">
              Profile
            </Button>

            <Button color="inherit" variant="outlined" onClick={handleSignOut}>
              Sign out
            </Button>
          </Stack>
        ) : (
          <Stack direction="row" spacing={1}>
            <Button
              color="inherit"
              component={RouterLink}
              to={loginUrl}
              variant="outlined"
            >
              Sign in
            </Button>

            <Button
              color="inherit"
              component={RouterLink}
              to={registerUrl}
              variant="contained"
            >
              Sign up
            </Button>
          </Stack>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default Header;
