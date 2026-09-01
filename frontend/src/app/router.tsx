import { createBrowserRouter } from "react-router-dom";

import OrganisationPage from "../pages/organisations/OrganisationPage";
import OrganisationsPage from "../pages/organisations/OrganisationsPage";
import NotFoundPage from "../pages/NotFoundPage";
import DoctorsPage from "../pages/doctors/DoctorsPage";
import DoctorPage from "../pages/doctors/DoctorPage";

export const router = createBrowserRouter([
  {
    path: "/organisations",
    element: <OrganisationsPage />,
  },
  {
    path: "/organisations/:organisationId",
    element: <OrganisationPage />,
  },
  {
    path: "/organisations/:organisationId/doctors",
    element: <DoctorsPage />,
  },
  {
    path: "/doctors/:doctorId",
    element: <DoctorPage />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
