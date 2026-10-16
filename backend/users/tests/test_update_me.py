from rest_framework.test import APITestCase

from ..models import CustomUser
from .support import PASSWORD, make_customer, make_doctor, make_plain_user, make_representative

LOGIN_URL = "/api/v1/token/"
UPDATE_ME_URL = "/api/v1/user/update_me"

NEW_PASSWORD = "brand-New-pass-2"


class UpdateMeTests(APITestCase):
    def sign_in(self, user):
        """Log in through the real endpoint, the way the frontend does."""
        response = self.client.post(LOGIN_URL, {"email": user.email, "password": PASSWORD}, format="json")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.json()['access']}")
        return user

    def setUp(self):
        self.user = self.sign_in(make_plain_user("anna@example.com"))

    def test_the_password_cannot_be_set_here(self):
        response = self.client.patch(UPDATE_ME_URL, {"password": NEW_PASSWORD}, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertIn("password", response.json())
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(PASSWORD))

    def test_the_email_cannot_be_changed_here(self):
        response = self.client.patch(UPDATE_ME_URL, {"email": "mallory@example.com"}, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertIn("/email/change", response.json()["email"][0])  # the message says where to go
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, "anna@example.com")
        self.assertFalse(CustomUser.objects.filter(email="mallory@example.com").exists())

    def test_the_field_is_refused_whatever_it_holds(self):
        # Even sending back the address the account already has: the request is refused because of the field
        response = self.client.patch(UPDATE_ME_URL, {"email": "anna@example.com"}, format="json")

        self.assertEqual(response.status_code, 400)

    def test_a_refused_field_stops_the_whole_request(self):
        payload = {"first_name": "Mallory", "email": "mallory@example.com", "password": NEW_PASSWORD}

        response = self.client.patch(UPDATE_ME_URL, payload, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(set(response.json()), {"email", "password"})
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "Anna")

    def test_put_is_refused_too(self):
        response = self.client.put(UPDATE_ME_URL, {"first_name": "Anna", "password": NEW_PASSWORD}, format="json")

        self.assertEqual(response.status_code, 400)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(PASSWORD))

    def test_names_can_still_be_changed(self):
        response = self.client.patch(UPDATE_ME_URL, {"first_name": "Anya", "patronymic": "Petrovna"}, format="json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["first_name"], "Anya")
        self.user.refresh_from_db()
        self.assertEqual(self.user.patronymic, "Petrovna")

    def test_every_role_is_refused_and_can_still_edit_the_rest(self):
        roles = {"customer": make_customer, "doctor": make_doctor, "representative": make_representative}
        for role, make_user in roles.items():
            with self.subTest(role=role):
                user = self.sign_in(make_user(f"{role}@example.com"))

                # A separate address per role, so one role's result can never decide another's
                payload = {"password": NEW_PASSWORD, "email": f"mallory-{role}@example.com"}
                refused = self.client.patch(UPDATE_ME_URL, payload, format="json")
                allowed = self.client.patch(UPDATE_ME_URL, {"first_name": "Renamed"}, format="json")

                self.assertEqual(refused.status_code, 400)
                self.assertEqual(allowed.status_code, 200)
                user.refresh_from_db()
                self.assertEqual((user.email, user.first_name), (f"{role}@example.com", "Renamed"))
                self.assertTrue(user.check_password(PASSWORD))

    def test_customer_profile_fields_still_work(self):
        customer = self.sign_in(make_customer("customer@example.com"))

        response = self.client.patch(UPDATE_ME_URL, {"profile": {"address": "Minsk, Lenina 1"}}, format="json")

        self.assertEqual(response.status_code, 200)
        customer.customer.refresh_from_db()
        self.assertEqual(customer.customer.address, "Minsk, Lenina 1")

    def test_the_phone_number_cannot_be_changed_here(self):
        customer = self.sign_in(make_customer("customer@example.com"))

        response = self.client.patch(UPDATE_ME_URL, {"profile": {"phone": "+375441112233"}}, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertIn("phone", response.json()["profile"])
        customer.customer.refresh_from_db()
        self.assertEqual(str(customer.customer.phone), "+375291234567")

    def test_a_refused_phone_stops_the_rest_of_the_profile_too(self):
        customer = self.sign_in(make_customer("customer@example.com"))
        address_before = customer.customer.address
        payload = {"first_name": "Mallory", "profile": {"phone": "+375441112233", "address": "Elsewhere"}}

        response = self.client.patch(UPDATE_ME_URL, payload, format="json")

        self.assertEqual(response.status_code, 400)
        customer.refresh_from_db()
        customer.customer.refresh_from_db()
        self.assertEqual(customer.first_name, "Anna")
        self.assertEqual(customer.customer.address, address_before)
