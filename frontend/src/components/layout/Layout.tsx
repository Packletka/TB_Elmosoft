import { Outlet } from "react-router-dom";

import Box from "@mui/material/Box";

import Header from "./Header";

function Layout() {
  return (
    <>
      <Header />

      <Box component="main" sx={{ py: 3 }}>
        <Outlet />
      </Box>
    </>
  );
}

export default Layout;
