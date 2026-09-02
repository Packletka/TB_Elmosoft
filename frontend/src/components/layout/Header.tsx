import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";

import AppBar from "@mui/material/AppBar";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

import { clearMockAuthentication, isMockAuthenticated } from "../../mocks/auth";

function Header() {
  useLocation();
  const navigate = useNavigate();

  const isAuthenticated = isMockAuthenticated();

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
              to="/login"
              variant="outlined"
            >
              Sign in
            </Button>

            <Button
              color="inherit"
              component={RouterLink}
              to="/register"
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
