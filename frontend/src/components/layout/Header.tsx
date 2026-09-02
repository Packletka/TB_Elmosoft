import { Link as RouterLink } from "react-router-dom";

import AppBar from "@mui/material/AppBar";
import Button from "@mui/material/Button";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

function Header() {
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

        <Button
          color="inherit"
          component={RouterLink}
          to="/login"
          variant="outlined"
          sx={{ mr: 1 }}
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
      </Toolbar>
    </AppBar>
  );
}

export default Header;
