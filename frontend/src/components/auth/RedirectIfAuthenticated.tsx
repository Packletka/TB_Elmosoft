import { Navigate, Outlet, useSearchParams } from "react-router-dom";

import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";

import { useAuth } from "../../auth/useAuth";
import { getSafeReturnTo } from "../../auth/getSafeReturnTo";

function RedirectIfAuthenticated() {
  const { isAuthenticated, isInitialized } = useAuth();
  const [searchParams] = useSearchParams();

  if (!isInitialized) {
    return (
      <Container sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (isAuthenticated) {
    return (
      <Navigate to={getSafeReturnTo(searchParams.get("returnTo"))} replace />
    );
  }

  return <Outlet />;
}

export default RedirectIfAuthenticated;
