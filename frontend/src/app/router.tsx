import { createBrowserRouter, redirect } from "react-router-dom";

import OrganisationPage from "../pages/organisations/OrganisationPage";
import OrganisationsPage from "../pages/organisations/OrganisationsPage";

import DoctorPage from "../pages/doctors/DoctorPage";
import DoctorsPage from "../pages/doctors/DoctorsPage";

import AppointmentConfirmationPage from "../pages/appointments/AppointmentConfirmationPage";
import AppointmentSuccessPage from "../pages/appointments/AppointmentSuccessPage";
import MyAppointmentsPage from "../pages/appointments/MyAppointmentsPage";

import ProfilePage from "../pages/profile/ProfilePage";

import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";

import NotFoundPage from "../pages/NotFoundPage";

import Layout from "../components/layout/Layout";

import { isMockAuthenticated } from "../mocks/auth";

function requireMockAuthentication({ request }: { request: Request }) {
  if (isMockAuthenticated()) {
    return null;
  }

  const url = new URL(request.url);

  const returnTo = `${url.pathname}${url.search}`;

  const searchParams = new URLSearchParams({
    reason: "appointment",
    returnTo,
  });

  return redirect(`/login?${searchParams.toString()}`);
}

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: "/appointments",
        element: <MyAppointmentsPage />,
      },
      {
        path: "/profile",
        element: <ProfilePage />,
      },
      {
        path: "/register",
        element: <RegisterPage />,
      },
      {
        path: "/login",
        element: <LoginPage />,
      },
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
        loader: requireMockAuthentication,
      },
      {
        path: "/appointments/success/:talonId",
        element: <AppointmentSuccessPage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);
