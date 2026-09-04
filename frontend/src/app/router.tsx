import { createBrowserRouter, redirect } from "react-router-dom";

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
import ChangeEmailPage from "../pages/profile/ChangeEmailPage";
import ChangePhonePage from "../pages/profile/ChangePhonePage";
import ChangePasswordPage from "../pages/profile/ChangePasswordPage";

import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";

import NotFoundPage from "../pages/NotFoundPage";

import Layout from "../components/layout/Layout";

import { isMockAuthenticated } from "../mocks/auth";

type AuthReason = "appointment" | "account";

function requireMockAuthentication(reason: AuthReason) {
  return ({ request }: { request: Request }) => {
    if (isMockAuthenticated()) {
      return null;
    }

    const url = new URL(request.url);

    const returnTo = `${url.pathname}${url.search}`;

    const searchParams = new URLSearchParams({
      reason,
      returnTo,
    });

    return redirect(`/login?${searchParams.toString()}`);
  };
}

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: "/appointments",
        element: <MyAppointmentsPage />,
        loader: requireMockAuthentication("account"),
      },
      {
        path: "/profile",
        element: <ProfilePage />,
        loader: requireMockAuthentication("account"),
      },
      {
        path: "/profile/edit",
        element: <EditProfilePage />,
        loader: requireMockAuthentication("account"),
      },
      {
        path: "/profile/settings",
        element: <ProfileSettingsPage />,
        loader: requireMockAuthentication("account"),
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
        loader: requireMockAuthentication("appointment"),
      },
      {
        path: "/appointments/success/:talonId",
        element: <AppointmentSuccessPage />,
        loader: requireMockAuthentication("appointment"),
      },
      {
        path: "/profile/settings/email",
        element: <ChangeEmailPage />,
        loader: requireMockAuthentication("account"),
      },
      {
        path: "/profile/settings/phone",
        element: <ChangePhonePage />,
        loader: requireMockAuthentication("account"),
      },
      {
        path: "/profile/settings/password",
        element: <ChangePasswordPage />,
        loader: requireMockAuthentication("account"),
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);
