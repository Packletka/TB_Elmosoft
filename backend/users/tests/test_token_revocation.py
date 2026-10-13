from django.contrib.auth.hashers import make_password
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework_simplejwt.tokens import AccessToken

from ..models import CustomUser
from .support import EagerCeleryTestCase

LOGIN_URL = "/api/v1/token/"
REFRESH_URL = "/api/v1/token/refresh/"
ME_URL = "/api/v1/user/me"
CHANGE_URL = "/api/v1/password/change"
RESET_URL = "/api/v1/password/reset"

OLD_PASSWORD = "old-Secret-pass-1"
NEW_PASSWORD = "brand-New-pass-2"


class TokenRevocationTests(EagerCeleryTestCase):
    """A token pair is only as good as the password it was issued under."""

    def setUp(self):
        super().setUp()
        self.user = CustomUser.objects.create_user(
            email="anna@example.com", password=OLD_PASSWORD, first_name="Anna", last_name="Ivanova"
        )
        tokens = self.client.post(LOGIN_URL, {"email": "anna@example.com", "password": OLD_PASSWORD}, format="json")
        self.access = tokens.json()["access"]
        self.refresh = tokens.json()["refresh"]

    def me(self, access):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        return self.client.get(ME_URL)

    def test_an_access_token_works_while_the_password_is_unchanged(self):
        self.assertEqual(self.me(self.access).status_code, 200)

    def test_changing_the_password_ends_the_old_access_token_at_once(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access}")
        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post(
                CHANGE_URL, {"current_password": OLD_PASSWORD, "new_password": NEW_PASSWORD}, format="json"
            )
        self.assertEqual(response.status_code, 200)

        refused = self.me(self.access)

        self.assertEqual(refused.status_code, 401)
        self.assertEqual(refused.json()["code"], "password_changed")

    def test_the_reset_link_ends_the_old_access_token_at_once(self):
        payload = {
            "uid": urlsafe_base64_encode(force_bytes(self.user.pk)),
            "token": default_token_generator.make_token(self.user),
            "new_password": NEW_PASSWORD,
        }
        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post(RESET_URL, payload, format="json")
        self.assertEqual(response.status_code, 200)

        self.assertEqual(self.me(self.access).status_code, 401)

    def test_a_password_changed_behind_the_apps_back_does_the_same(self):
        # What an admin edit does: the hash changes, and no refresh token is blacklisted
        CustomUser.objects.filter(pk=self.user.pk).update(password=make_password(NEW_PASSWORD))

        self.assertEqual(self.me(self.access).status_code, 401)
        # The old refresh token still answers, but the access token it hands out carries the old fingerprint
        refreshed = self.client.post(REFRESH_URL, {"refresh": self.refresh}, format="json")
        self.assertEqual(refreshed.status_code, 200)
        self.assertEqual(self.me(refreshed.json()["access"]).status_code, 401)

    def test_a_token_without_the_fingerprint_is_refused(self):
        # The kind issued before the check existed
        token = AccessToken.for_user(self.user)
        del token["hash_password"]

        self.assertEqual(self.me(str(token)).status_code, 401)
