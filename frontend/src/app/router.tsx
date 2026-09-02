import { createBrowserRouter } from "react-router-dom";

import OrganisationPage from "../pages/organisations/OrganisationPage";
import OrganisationsPage from "../pages/organisations/OrganisationsPage";
import NotFoundPage from "../pages/NotFoundPage";
import DoctorsPage from "../pages/doctors/DoctorsPage";
import DoctorPage from "../pages/doctors/DoctorPage";
import AppointmentConfirmationPage from "../pages/appointments/AppointmentConfirmationPage";
import AppointmentSuccessPage from "../pages/appointments/AppointmentSuccessPage";

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
    path: "/appointments/confirm/:talonId",
    element: <AppointmentConfirmationPage />,
  },
  {
    path: "/appointments/success/:talonId",
    element: <AppointmentSuccessPage />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
