import { Navigate, Outlet, useLocation } from "react-router-dom";

import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";

import { useAuth } from "../../auth/useAuth";

interface RequireAuthProps {
  reason?: "appointment" | "account";
}

function RequireAuth({ reason }: RequireAuthProps) {
  const { isAuthenticated, isInitialized } = useAuth();
  const location = useLocation();

  if (!isInitialized) {
    return (
      <Container sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!isAuthenticated) {
    const params = new URLSearchParams();
    params.set("returnTo", `${location.pathname}${location.search}`);
    if (reason) {
      params.set("reason", reason);
    }

    return <Navigate to={`/login?${params.toString()}`} replace />;
  }

  return <Outlet />;
}

export default RequireAuth;
