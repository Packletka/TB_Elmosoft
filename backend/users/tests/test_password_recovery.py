import re
from unittest import mock
from urllib.parse import parse_qs, urlparse

from django.core import mail
from django.core.cache import cache
from django.test import override_settings
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from rest_framework.test import APITestCase
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from talonby import celery_app

from ..models import CustomUser
from ..tasks import send_password_reset_email

FORGOT_URL = "/api/v1/password/forgot"
RESET_URL = "/api/v1/password/reset"
LOGIN_URL = "/api/v1/token/"
REFRESH_URL = "/api/v1/token/refresh/"

OLD_PASSWORD = "old-Secret-pass-1"
NEW_PASSWORD = "brand-New-pass-2"

# Throttle counters and the reset cooldown live in the cache; tests use a private in-memory one instead of Redis.
IN_MEMORY_CACHE = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}


@override_settings(CACHES=IN_MEMORY_CACHE)
class PasswordRecoveryTests(APITestCase):
    def setUp(self):
        # Run Celery tasks right inside the test, as if .delay() were a plain call, instead of queueing them in Redis.
        eager = (celery_app.conf.task_always_eager, celery_app.conf.task_eager_propagates)

        def restore_celery_settings():
            celery_app.conf.task_always_eager, celery_app.conf.task_eager_propagates = eager

        self.addCleanup(restore_celery_settings)
        celery_app.conf.task_always_eager = True
        celery_app.conf.task_eager_propagates = True
        cache.clear()

        self.user = CustomUser.objects.create_user(
            email="anna@example.com", password=OLD_PASSWORD, first_name="Anna", last_name="Ivanova"
        )

    @staticmethod
    def link_params(message):
        """Read the uid and token out of the link inside an email, as the frontend page would from the address bar."""
        link = re.search(r"\S+/reset-password\?\S+", message.body).group(0)
        query = parse_qs(urlparse(link).query)
        return {"uid": query["uid"][0], "token": query["token"][0]}

    def request_link(self, email="anna@example.com"):
        self.client.post(FORGOT_URL, {"email": email}, format="json")
        return self.link_params(mail.outbox[-1])

    def reset(self, params, password=NEW_PASSWORD):
        # A test runs inside one big transaction that is never committed, so on_commit callbacks (the "password
        # changed" email) would wait forever. Outside tests there is no such transaction and they run at once.
        with self.captureOnCommitCallbacks(execute=True):
            return self.client.post(RESET_URL, {**params, "new_password": password}, format="json")

    def login(self, password):
        return self.client.post(LOGIN_URL, {"email": "anna@example.com", "password": password}, format="json")

    # --- asking for the email ---

    def test_forgot_sends_one_email_with_a_link_for_this_account(self):
        response = self.client.post(FORGOT_URL, {"email": "anna@example.com"}, format="json")

        self.assertEqual(response.status_code, 202)
        self.assertEqual(len(mail.outbox), 1)
        message = mail.outbox[0]
        self.assertEqual(message.to, ["anna@example.com"])
        self.assertIn("Anna", message.body)
        self.assertIn("15 minutes", message.body)
        self.assertEqual(message.alternatives[0].mimetype, "text/html")
        uid = self.link_params(message)["uid"]
        self.assertEqual(force_str(urlsafe_base64_decode(uid)), str(self.user.pk))

    def test_forgot_gives_the_same_answer_for_an_unknown_address(self):
        known = self.client.post(FORGOT_URL, {"email": "anna@example.com"}, format="json")
        unknown = self.client.post(FORGOT_URL, {"email": "nobody@example.com"}, format="json")

        self.assertEqual((unknown.status_code, unknown.json()), (known.status_code, known.json()))
        self.assertEqual(len(mail.outbox), 1)  # only Anna got an email

    def test_forgot_ignores_the_letter_case_of_the_address(self):
        self.client.post(FORGOT_URL, {"email": "ANNA@Example.com"}, format="json")

        self.assertEqual([m.to for m in mail.outbox], [["anna@example.com"]])

    def test_forgot_sends_nothing_to_a_disabled_account(self):
        CustomUser.objects.filter(pk=self.user.pk).update(is_active=False)

        response = self.client.post(FORGOT_URL, {"email": "anna@example.com"}, format="json")

        self.assertEqual(response.status_code, 202)
        self.assertEqual(len(mail.outbox), 0)

    def test_forgot_sends_at_most_one_email_per_minute_per_account(self):
        for _ in range(3):
            self.client.post(FORGOT_URL, {"email": "anna@example.com"}, format="json")

        self.assertEqual(len(mail.outbox), 1)

    def test_forgot_is_limited_per_client_address(self):
        with mock.patch.dict(ScopedRateThrottle.THROTTLE_RATES, {"password_forgot": "2/hour"}):
            codes = [
                self.client.post(FORGOT_URL, {"email": f"user{number}@example.com"}, format="json").status_code
                for number in range(3)
            ]

        self.assertEqual(codes, [202, 202, 429])

    def test_the_limit_cannot_be_dodged_with_a_forged_forwarding_header(self):
        with mock.patch.dict(ScopedRateThrottle.THROTTLE_RATES, {"password_forgot": "2/hour"}):
            codes = [
                self.client.post(
                    FORGOT_URL,
                    {"email": f"user{number}@example.com"},
                    format="json",
                    headers={"X-Forwarded-For": f"10.0.0.{number}"},
                ).status_code
                for number in range(3)
            ]

        self.assertEqual(codes, [202, 202, 429])

    def test_forgot_rejects_a_missing_or_malformed_address(self):
        self.assertEqual(self.client.post(FORGOT_URL, {}, format="json").status_code, 400)
        self.assertEqual(self.client.post(FORGOT_URL, {"email": "not-an-email"}, format="json").status_code, 400)

    def test_forgot_works_even_if_the_browser_sends_a_stale_access_token(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer an-expired-or-garbage-token")

        response = self.client.post(FORGOT_URL, {"email": "anna@example.com"}, format="json")

        self.assertEqual(response.status_code, 202)

    def test_the_task_quietly_skips_an_account_that_no_longer_exists(self):
        send_password_reset_email.delay(999_999)

        self.assertEqual(len(mail.outbox), 0)

    # --- using the link ---

    def test_reset_changes_the_password_and_sends_a_notice(self):
        response = self.reset(self.request_link())

        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.login(NEW_PASSWORD).status_code, 200)
        self.assertEqual(self.login(OLD_PASSWORD).status_code, 401)
        subjects = [message.subject for message in mail.outbox]
        self.assertEqual(subjects, ["Reset your TalonBy password", "Your TalonBy password was changed"])

    def test_a_link_works_only_once(self):
        params = self.request_link()
        self.assertEqual(self.reset(params).status_code, 200)

        again = self.reset(params, password="Another-pass-3")

        self.assertEqual(again.status_code, 400)
        self.assertIn("token", again.json())
        self.assertEqual(self.login(NEW_PASSWORD).status_code, 200)

    def test_an_expired_link_is_refused(self):
        params = self.request_link()

        with override_settings(PASSWORD_RESET_TIMEOUT=-1):
            response = self.reset(params)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.login(OLD_PASSWORD).status_code, 200)

    def test_broken_links_get_the_same_answer_as_expired_ones(self):
        params = self.request_link()
        broken = [
            {"uid": params["uid"], "token": "not-a-token"},
            {"uid": "!!!", "token": params["token"]},
            {"uid": "OTk5OTk5", "token": params["token"]},  # a well-formed id of an account that does not exist
        ]

        answers = [self.reset(link) for link in broken]

        self.assertEqual([a.status_code for a in answers], [400, 400, 400])
        self.assertEqual(len({str(a.json()) for a in answers}), 1)

    def test_a_token_belongs_to_one_account(self):
        CustomUser.objects.create_user(
            email="boris@example.com", password=OLD_PASSWORD, first_name="Boris", last_name="Petrov"
        )
        anna = self.request_link("anna@example.com")
        boris = self.request_link("boris@example.com")

        crossed = self.reset({"uid": anna["uid"], "token": boris["token"]})

        self.assertEqual(crossed.status_code, 400)
        self.assertEqual(self.login(OLD_PASSWORD).status_code, 200)

    def test_a_weak_password_is_refused_and_the_link_stays_usable(self):
        params = self.request_link()

        weak = self.reset(params, password="12345678")

        self.assertEqual(weak.status_code, 400)
        self.assertIn("new_password", weak.json())
        self.assertEqual(self.login(OLD_PASSWORD).status_code, 200)
        self.assertEqual(self.reset(params).status_code, 200)

    def test_reset_signs_the_user_out_everywhere(self):
        refresh = str(RefreshToken.for_user(self.user))
        self.assertEqual(self.client.post(REFRESH_URL, {"refresh": refresh}, format="json").status_code, 200)

        self.reset(self.request_link())

        self.assertEqual(self.client.post(REFRESH_URL, {"refresh": refresh}, format="json").status_code, 401)

    def test_reset_works_for_an_old_account_with_a_blank_name(self):
        CustomUser.objects.filter(pk=self.user.pk).update(first_name="", last_name="")
        params = self.request_link()
        self.assertIn("Hello,\n", mail.outbox[0].body)

        response = self.reset(params)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.login(NEW_PASSWORD).status_code, 200)
