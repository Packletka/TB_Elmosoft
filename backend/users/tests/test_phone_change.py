import re
import time
from unittest import mock

from django.core import mail
from django.core.cache import cache
from rest_framework.throttling import ScopedRateThrottle

from .. import phone_change
from ..models import Customer
from ..tasks import send_phone_change_code_email
from .support import EagerCeleryTestCase, make_customer, make_doctor, make_plain_user, make_representative

REQUEST_URL = "/api/v1/phone/change/request"
CONFIRM_URL = "/api/v1/phone/change/confirm"

OLD_PHONE = "+375291234567"  # the one make_customer gives
NEW_PHONE = "+375441112233"


class PhoneChangeTests(EagerCeleryTestCase):
    def setUp(self):
        super().setUp()
        self.user = make_customer("anna@example.com")
        self.client.force_authenticate(self.user)

    def request_code(self, phone=NEW_PHONE):
        return self.client.post(REQUEST_URL, {"phone": phone}, format="json")

    def confirm(self, code):
        return self.client.post(CONFIRM_URL, {"code": code}, format="json")

    def emailed_code(self):
        """The code as the user reads it: from the body of the last email."""
        codes = re.findall(r"\b\d{6}\b", mail.outbox[-1].body)
        self.assertEqual(len(codes), 1)
        return codes[0]

    def wrong_code(self):
        real = self.emailed_code()
        return "000000" if real != "000000" else "111111"

    def stored_phone(self):
        return str(Customer.objects.get(user=self.user).phone)

    def allow_another_request(self):
        cache.delete(f"phone-change-cooldown:{self.user.pk}")

    # ---- asking for a code

    def test_a_code_is_emailed_to_the_account_address(self):
        response = self.request_code()

        self.assertEqual(response.status_code, 202)
        self.assertEqual(len(mail.outbox), 1)
        message = mail.outbox[0]
        self.assertEqual(message.to, ["anna@example.com"])
        self.assertEqual(message.subject, "Your TalonBy confirmation code")
        self.assertIn("+375 44 111-22-33", message.body)
        self.assertIn(self.emailed_code(), message.alternatives[0].content)
        self.assertEqual(self.stored_phone(), OLD_PHONE)  # asking changes nothing yet

    def test_the_number_may_be_typed_the_way_people_write_it_at_home(self):
        response = self.request_code("8 044 111-22-33")

        self.assertEqual(response.status_code, 202)
        self.assertEqual(self.confirm(self.emailed_code()).json()["phone"], NEW_PHONE)

    def test_the_number_the_account_already_has_is_refused(self):
        for typed in (OLD_PHONE, "8 029 123-45-67"):
            with self.subTest(typed=typed):
                response = self.request_code(typed)

                self.assertEqual(response.status_code, 400)
                self.assertIn("phone", response.json())
        self.assertEqual(len(mail.outbox), 0)

    def test_a_bad_number_is_refused_and_does_not_start_the_cooldown(self):
        for bad in ("12345", "not a number", ""):
            with self.subTest(bad=bad):
                response = self.request_code(bad)

                self.assertEqual(response.status_code, 400)
                self.assertIn("phone", response.json())
        self.assertEqual(len(mail.outbox), 0)
        self.assertEqual(self.request_code().status_code, 202)

    def test_codes_cannot_be_requested_in_a_row(self):
        self.assertEqual(self.request_code().status_code, 202)

        again = self.request_code()

        self.assertEqual(again.status_code, 429)
        self.assertGreater(int(again["Retry-After"]), 0)
        self.assertEqual(len(mail.outbox), 1)

    def test_requests_are_limited_per_account(self):
        with mock.patch.dict(ScopedRateThrottle.THROTTLE_RATES, {"phone_change_request": "2/hour"}):
            codes = [self.request_code("12345").status_code for _ in range(3)]

        self.assertEqual(codes, [400, 400, 429])

    def test_a_task_that_finds_no_pending_change_sends_nothing(self):
        self.request_code()
        phone_change.cancel(self.user.pk)
        mail.outbox.clear()

        send_phone_change_code_email.delay(self.user.pk)

        self.assertEqual(len(mail.outbox), 0)

    # ---- confirming

    def test_the_right_code_changes_the_number(self):
        self.request_code()

        response = self.confirm(self.emailed_code())

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["phone"], NEW_PHONE)
        self.assertEqual(self.stored_phone(), NEW_PHONE)

    def test_a_code_copied_with_a_space_in_it_still_works(self):
        self.request_code()
        code = self.emailed_code()

        response = self.confirm(f" {code[:3]} {code[3:]} ")

        self.assertEqual(response.status_code, 200)

    def test_a_code_works_only_once(self):
        self.request_code()
        code = self.emailed_code()
        self.assertEqual(self.confirm(code).status_code, 200)

        again = self.confirm(code)

        self.assertEqual(again.status_code, 400)
        self.assertIn("code", again.json())

    def test_a_wrong_code_is_refused_and_the_right_one_still_works_after_it(self):
        self.request_code()
        code = self.emailed_code()

        wrong = self.confirm(self.wrong_code())

        self.assertEqual(wrong.status_code, 400)
        self.assertEqual(wrong.json(), {"code": [phone_change.WRONG]})
        self.assertEqual(self.stored_phone(), OLD_PHONE)
        self.assertEqual(self.confirm(code).status_code, 200)

    def test_the_last_allowed_guess_can_still_be_right(self):
        self.request_code()
        code = self.emailed_code()
        for _ in range(phone_change.MAX_ATTEMPTS - 1):
            self.confirm(self.wrong_code())

        self.assertEqual(self.confirm(code).status_code, 200)

    def test_too_many_wrong_guesses_lock_even_the_right_code(self):
        self.request_code()
        code = self.emailed_code()
        answers = [self.confirm(self.wrong_code()) for _ in range(phone_change.MAX_ATTEMPTS)]

        self.assertEqual(answers[-1].json(), {"code": [phone_change.TOO_MANY]})
        late = self.confirm(code)
        self.assertEqual(late.status_code, 400)
        self.assertEqual(self.stored_phone(), OLD_PHONE)

    def test_a_guess_over_the_limit_is_refused_even_when_it_is_right(self):
        # What parallel requests can produce: the counter passes the limit before the first of them removes the code
        self.request_code()
        code = self.emailed_code()
        cache.set(f"phone-change-attempts:{self.user.pk}", phone_change.MAX_ATTEMPTS, phone_change.CODE_LIFETIME)

        response = self.confirm(code)

        self.assertEqual(response.json(), {"code": [phone_change.TOO_MANY]})
        self.assertEqual(self.stored_phone(), OLD_PHONE)

    def test_a_new_code_starts_the_count_again(self):
        self.request_code()
        for _ in range(phone_change.MAX_ATTEMPTS):
            self.confirm(self.wrong_code())
        self.allow_another_request()
        self.request_code()

        self.assertEqual(self.confirm(self.emailed_code()).status_code, 200)

    def test_the_code_expires(self):
        self.request_code()
        code = self.emailed_code()

        # The cache decides what has expired by reading the clock, so the test moves the clock
        with mock.patch("time.time", return_value=time.time() + phone_change.CODE_LIFETIME + 1):
            response = self.confirm(code)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"code": [phone_change.EXPIRED]})
        self.assertEqual(self.stored_phone(), OLD_PHONE)

    def test_a_new_request_replaces_the_old_code(self):
        self.request_code(NEW_PHONE)
        old_code = self.emailed_code()
        self.allow_another_request()
        self.request_code("+375331234567")
        new_code = self.emailed_code()

        self.assertNotEqual(old_code, new_code)
        self.assertEqual(self.confirm(old_code).status_code, 400)
        self.assertEqual(self.confirm(new_code).json()["phone"], "+375331234567")

    def test_nothing_to_confirm_without_a_request(self):
        response = self.confirm("123456")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"code": [phone_change.EXPIRED]})

    def test_the_code_is_required(self):
        for body in ({}, {"code": ""}, {"code": "   "}):
            with self.subTest(body=body):
                response = self.client.post(CONFIRM_URL, body, format="json")

                self.assertEqual(response.status_code, 400)
                self.assertIn("code", response.json())

    def test_guesses_are_limited_per_account(self):
        with mock.patch.dict(ScopedRateThrottle.THROTTLE_RATES, {"phone_change_confirm": "2/hour"}):
            codes = [self.confirm("123456").status_code for _ in range(3)]

        self.assertEqual(codes, [400, 400, 429])

    def test_someone_elses_code_does_not_work(self):
        self.request_code()
        code = self.emailed_code()
        mallory = make_customer("mallory@example.com")
        self.client.force_authenticate(mallory)

        response = self.confirm(code)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(str(Customer.objects.get(user=mallory).phone), OLD_PHONE)

    # ---- who may use it

    def test_only_customers_may_use_it(self):
        others = {
            "plain account": make_plain_user("plain@example.com"),
            "doctor": make_doctor("doctor@example.com"),
            "representative": make_representative("rep@example.com"),
        }
        for role, user in others.items():
            with self.subTest(role=role):
                self.client.force_authenticate(user)

                self.assertEqual(self.request_code().status_code, 403)
                self.assertEqual(self.confirm("123456").status_code, 403)
        self.assertEqual(len(mail.outbox), 0)

    def test_signing_in_is_required(self):
        self.client.force_authenticate(None)

        self.assertEqual(self.request_code().status_code, 401)
        self.assertEqual(self.confirm("123456").status_code, 401)


class CodeTests(EagerCeleryTestCase):
    def test_the_same_inputs_always_give_the_same_code(self):
        # The web process and the worker each work the code out, so they have to agree
        first = phone_change.make_code(1, "+375441112233", "abc")

        self.assertEqual(first, phone_change.make_code(1, "+375441112233", "abc"))
        self.assertRegex(first, r"^\d{6}$")

    def test_a_code_belongs_to_one_user_one_number_and_one_request(self):
        base = phone_change.make_code(1, "+375441112233", "abc")

        self.assertNotEqual(base, phone_change.make_code(2, "+375441112233", "abc"))
        self.assertNotEqual(base, phone_change.make_code(1, "+375291112233", "abc"))
        self.assertNotEqual(base, phone_change.make_code(1, "+375441112233", "abd"))
