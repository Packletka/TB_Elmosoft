from unittest import mock

from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from rest_framework.throttling import ScopedRateThrottle

from ..models import CustomUser
from ..serializers import EmailChangeSerializer
from .support import (
    PASSWORD,
    EagerCeleryTestCase,
    make_customer,
    make_doctor,
    make_plain_user,
    make_representative,
)

CHANGE_URL = "/api/v1/email/change"
LOGIN_URL = "/api/v1/token/"
REFRESH_URL = "/api/v1/token/refresh/"
ME_URL = "/api/v1/user/me"
FORGOT_URL = "/api/v1/password/forgot"

OLD_EMAIL = "anna@example.com"
NEW_EMAIL = "anna.new@example.com"


class EmailChangeTests(EagerCeleryTestCase):
    def setUp(self):
        super().setUp()
        self.user = make_plain_user(OLD_EMAIL)
        self.tokens = self.sign_in(self.user)

    def sign_in(self, user):
        """Log in through the real endpoint and send the access token from now on, as the frontend does."""
        tokens = self.login(user.email).json()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
        return tokens

    def login(self, email, password=PASSWORD):
        return self.client.post(LOGIN_URL, {"email": email, "password": password}, format="json")

    def change(self, new_email=NEW_EMAIL, password=PASSWORD):
        return self.client.post(CHANGE_URL, {"new_email": new_email, "current_password": password}, format="json")

    def stored_email(self):
        return CustomUser.objects.get(pk=self.user.pk).email

    # ---- the change itself

    def test_the_email_changes_and_becomes_the_login(self):
        response = self.change()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"detail": "Email changed.", "email": NEW_EMAIL})
        self.assertEqual(self.stored_email(), NEW_EMAIL)
        self.assertEqual(self.login(NEW_EMAIL).status_code, 200)
        self.assertEqual(self.login(OLD_EMAIL).status_code, 401)

    def test_the_part_after_the_at_sign_is_lowercased_like_in_registration(self):
        self.change("Anna.New@EXAMPLE.com")

        self.assertEqual(self.stored_email(), "Anna.New@example.com")

    def test_every_role_can_change_it(self):
        makers = {"plain": make_plain_user, "customer": make_customer, "doctor": make_doctor}
        makers["representative"] = make_representative
        for role, make_user in makers.items():
            with self.subTest(role=role):
                user = make_user(f"{role}@example.com")
                self.sign_in(user)

                response = self.change(f"{role}.new@example.com")

                self.assertEqual(response.status_code, 200)
                self.assertEqual(CustomUser.objects.get(pk=user.pk).email, f"{role}.new@example.com")

    def test_signing_in_is_required(self):
        self.client.credentials()

        self.assertEqual(self.change().status_code, 401)
        self.assertEqual(self.stored_email(), OLD_EMAIL)

    # ---- the password is the safeguard

    def test_a_wrong_current_password_is_refused(self):
        response = self.change(password="not-my-password-1")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"current_password": ["The current password is incorrect."]})
        self.assertEqual(self.stored_email(), OLD_EMAIL)
        self.assertEqual(self.login(OLD_EMAIL).status_code, 200)

    def test_without_the_password_nothing_is_learned_about_other_accounts(self):
        make_plain_user("taken@example.com")

        response = self.change("taken@example.com", password="not-my-password-1")

        self.assertEqual(set(response.json()), {"current_password"})

    def test_attempts_are_limited_per_account(self):
        with mock.patch.dict(ScopedRateThrottle.THROTTLE_RATES, {"email_change": "2/hour"}):
            codes = [self.change(password="not-my-password-1").status_code for _ in range(3)]

        self.assertEqual(codes, [400, 400, 429])

    # ---- the address

    def test_an_address_that_is_taken_is_refused(self):
        make_plain_user("taken@example.com")

        response = self.change("taken@example.com")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"new_email": ["A user with this email already exists."]})
        self.assertEqual(self.stored_email(), OLD_EMAIL)

    def test_an_address_that_differs_only_in_letter_case_counts_as_taken(self):
        make_plain_user("taken@example.com")

        response = self.change("TAKEN@example.com")

        self.assertEqual(response.status_code, 400)
        self.assertIn("new_email", response.json())

    def test_an_address_taken_at_the_last_moment_is_refused_not_a_crash(self):
        make_plain_user("taken@example.com")

        # The checks pass here, as if the other account had been created a moment after them
        with mock.patch.object(EmailChangeSerializer, "validate", lambda self, attrs: attrs):
            response = self.change("taken@example.com")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"new_email": ["A user with this email already exists."]})
        self.assertEqual(self.stored_email(), OLD_EMAIL)

    def test_the_current_address_is_refused_in_any_letter_case(self):
        for same in (OLD_EMAIL, "ANNA@example.com"):
            with self.subTest(same=same):
                response = self.change(same)

                self.assertEqual(response.status_code, 400)
                self.assertEqual(response.json(), {"new_email": ["This is already your email address."]})

    def test_a_bad_address_is_refused(self):
        for bad in ("not-an-email", "anna@", ""):
            with self.subTest(bad=bad):
                response = self.change(bad)

                self.assertEqual(response.status_code, 400)
                self.assertIn("new_email", response.json())
        self.assertEqual(self.stored_email(), OLD_EMAIL)

    def test_both_fields_are_required(self):
        response = self.client.post(CHANGE_URL, {}, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(set(response.json()), {"new_email", "current_password"})

    # ---- what the change leaves alone and what follows it

    def test_every_session_stays_signed_in(self):
        self.change()

        me = self.client.get(ME_URL)
        refreshed = self.client.post(REFRESH_URL, {"refresh": self.tokens["refresh"]}, format="json")

        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.json()["email"], NEW_EMAIL)
        self.assertEqual(refreshed.status_code, 200)

    def test_reset_links_made_for_the_old_address_stop_working(self):
        token = default_token_generator.make_token(self.user)
        self.assertTrue(default_token_generator.check_token(self.user, token))

        self.change()

        self.user.refresh_from_db()
        self.assertFalse(default_token_generator.check_token(self.user, token))

    def test_reset_emails_go_to_the_new_address(self):
        self.change()

        with self.captureOnCommitCallbacks(execute=True):
            self.client.post(FORGOT_URL, {"email": OLD_EMAIL}, format="json")
        self.assertEqual(len(mail.outbox), 0)
        with self.captureOnCommitCallbacks(execute=True):
            self.client.post(FORGOT_URL, {"email": NEW_EMAIL}, format="json")

        self.assertEqual([message.to for message in mail.outbox], [[NEW_EMAIL]])
