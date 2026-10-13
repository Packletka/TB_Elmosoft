from unittest import mock

from django.conf import settings
from django.core import mail
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken

from ..models import CustomUser
from .support import EagerCeleryTestCase

CHANGE_URL = "/api/v1/password/change"
LOGIN_URL = "/api/v1/token/"
REFRESH_URL = "/api/v1/token/refresh/"
ME_URL = "/api/v1/user/me"

OLD_PASSWORD = "old-Secret-pass-1"
NEW_PASSWORD = "brand-New-pass-2"


class PasswordChangeTests(EagerCeleryTestCase):
    def setUp(self):
        super().setUp()
        self.user = CustomUser.objects.create_user(
            email="anna@example.com", password=OLD_PASSWORD, first_name="Anna", last_name="Ivanova"
        )
        # A session on another device, to see whether the change ends it
        self.other_device_refresh = str(RefreshToken.for_user(self.user))
        # The session the user changes the password from
        response = self.client.post(LOGIN_URL, {"email": "anna@example.com", "password": OLD_PASSWORD}, format="json")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.json()['access']}")

    def change(self, current=OLD_PASSWORD, new=NEW_PASSWORD):
        # A test never commits, so on_commit callbacks (the "password changed" email) need this to run
        with self.captureOnCommitCallbacks(execute=True):
            return self.client.post(CHANGE_URL, {"current_password": current, "new_password": new}, format="json")

    def login(self, password):
        return self.client.post(LOGIN_URL, {"email": "anna@example.com", "password": password}, format="json")

    def refresh(self, token):
        return self.client.post(REFRESH_URL, {"refresh": token}, format="json")

    def test_the_password_changes_and_a_notice_is_sent(self):
        response = self.change()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.login(NEW_PASSWORD).status_code, 200)
        self.assertEqual(self.login(OLD_PASSWORD).status_code, 401)
        self.assertEqual([m.subject for m in mail.outbox], ["Your TalonBy password was changed"])

    def test_this_device_gets_a_fresh_session(self):
        body = self.change().json()

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {body['access']}")
        self.assertEqual(self.client.get(ME_URL).status_code, 200)
        self.assertEqual(self.refresh(body["refresh"]).status_code, 200)

    def test_every_other_session_is_ended(self):
        self.assertEqual(self.refresh(self.other_device_refresh).status_code, 200)

        self.change()

        self.assertEqual(self.refresh(self.other_device_refresh).status_code, 401)

    def test_a_wrong_current_password_is_refused(self):
        response = self.change(current="not-my-password-1")

        self.assertEqual(response.status_code, 400)
        self.assertIn("current_password", response.json())
        self.assertEqual(self.login(OLD_PASSWORD).status_code, 200)
        self.assertEqual(self.refresh(self.other_device_refresh).status_code, 200)  # nothing was revoked
        self.assertEqual(len(mail.outbox), 0)

    def test_the_rules_for_the_new_password_are_shown_only_after_the_current_password_is_right(self):
        response = self.change(current="not-my-password-1", new="12345678")

        self.assertEqual(set(response.json()), {"current_password"})

    def test_a_weak_new_password_is_refused(self):
        response = self.change(new="12345678")

        self.assertEqual(response.status_code, 400)
        self.assertIn("new_password", response.json())
        self.assertEqual(self.login(OLD_PASSWORD).status_code, 200)

    def test_the_current_password_is_refused_as_the_new_one(self):
        response = self.change(new=OLD_PASSWORD)

        self.assertEqual(response.status_code, 400)
        self.assertIn("current password", " ".join(response.json()["new_password"]))
        self.assertEqual(self.refresh(self.other_device_refresh).status_code, 200)  # nothing was revoked
        self.assertEqual(len(mail.outbox), 0)  # nothing changed, so nobody is told it did

    def test_signing_in_is_required(self):
        self.client.credentials()

        response = self.change()

        self.assertEqual(response.status_code, 401)
        self.assertEqual(self.login(OLD_PASSWORD).status_code, 200)

    def test_attempts_are_limited_per_account(self):
        with mock.patch.dict(ScopedRateThrottle.THROTTLE_RATES, {"password_change": "2/hour"}):
            codes = [self.change(current="not-my-password-1").status_code for _ in range(3)]

        self.assertEqual(codes, [400, 400, 429])

    def test_the_notice_leads_to_the_secure_account_page(self):
        self.change()

        link = f"{settings.FRONTEND_URL}/forgot-password?from=password-changed"
        message = mail.outbox[0]
        self.assertIn(link, message.body)
        self.assertIn(link, message.alternatives[0].content)
