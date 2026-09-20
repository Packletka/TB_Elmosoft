import { createBrowserRouter } from "react-router-dom";

import HomePage from "../pages/HomePage";

import OrganisationPage from "../pages/organisations/OrganisationPage";
import OrganisationsPage from "../pages/organisations/OrganisationsPage";

import DoctorPage from "../pages/doctors/DoctorPage";
import DoctorsPage from "../pages/doctors/DoctorsPage";

import AppointmentConfirmationPage from "../pages/appointments/AppointmentConfirmationPage";
import AppointmentSuccessPage from "../pages/appointments/AppointmentSuccessPage";
import MyAppointmentsPage from "../pages/appointments/MyAppointmentsPage";

import ProfilePage from "../pages/profile/ProfilePage";
import EditProfilePage from "../pages/profile/EditProfilePage";
import ProfileSettingsPage from "../pages/profile/ProfileSettingsPage";

import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";

import NotFoundPage from "../pages/NotFoundPage";

import Layout from "../components/layout/Layout";
import RequireAuth from "../components/auth/RequireAuth";
import RequireRole from "../components/auth/RequireRole";
import RedirectIfAuthenticated from "../components/auth/RedirectIfAuthenticated";

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <HomePage /> },

      {
        element: <RequireAuth reason="account" />,
        children: [
          { path: "/appointments", element: <MyAppointmentsPage /> },
          { path: "/profile", element: <ProfilePage /> },
          { path: "/profile/edit", element: <EditProfilePage /> },
          { path: "/profile/settings", element: <ProfileSettingsPage /> },
        ],
      },

      {
        element: <RequireAuth reason="appointment" />,
        children: [
          {
            element: <RequireRole allowedRoles={["customer"]} />,
            children: [
              { path: "/appointments/confirm/:talonId", element: <AppointmentConfirmationPage /> },
              { path: "/appointments/success/:talonId", element: <AppointmentSuccessPage /> },
            ],
          },
        ],
      },

      {
        element: <RedirectIfAuthenticated />,
        children: [
          { path: "/register", element: <RegisterPage /> },
          { path: "/login", element: <LoginPage /> },
        ],
      },

      { path: "/organisations", element: <OrganisationsPage /> },
      { path: "/organisations/:organisationId", element: <OrganisationPage /> },
      {
        path: "/organisations/:organisationId/doctors",
        element: <DoctorsPage />,
      },
      { path: "/doctors/:doctorId", element: <DoctorPage /> },

      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
