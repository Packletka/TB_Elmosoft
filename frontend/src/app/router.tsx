import { createBrowserRouter } from "react-router-dom";

import OrganisationPage from "../pages/organisations/OrganisationPage";
import OrganisationsPage from "../pages/organisations/OrganisationsPage";

export const router = createBrowserRouter([
  {
    path: "/organisations",
    element: <OrganisationsPage />,
  },
  {
    path: "/organisations/:organisationId",
    element: <OrganisationPage />,
  },
]);
