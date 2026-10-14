from datetime import date

from django.core.cache import cache
from django.test import override_settings
from rest_framework.test import APITestCase
from talonby import celery_app

from ..models import Customer, CustomUser, Doctor, Representative

# Throttle counters and the reset cooldown live in the cache; tests use a private in-memory one instead of Redis
IN_MEMORY_CACHE = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}


@override_settings(CACHES=IN_MEMORY_CACHE)
class EagerCeleryTestCase(APITestCase):
    """Base for tests that send email: Celery tasks run inside the test and the cache starts empty."""

    def setUp(self):
        # Run Celery tasks right inside the test, as if .delay() were a plain call, instead of queueing them in Redis
        eager = (celery_app.conf.task_always_eager, celery_app.conf.task_eager_propagates)

        def restore_celery_settings():
            celery_app.conf.task_always_eager, celery_app.conf.task_eager_propagates = eager

        self.addCleanup(restore_celery_settings)
        celery_app.conf.task_always_eager = True
        celery_app.conf.task_eager_propagates = True
        cache.clear()


PASSWORD = "old-Secret-pass-1"


def make_plain_user(email):
    return CustomUser.objects.create_user(email=email, password=PASSWORD, first_name="Anna", last_name="Ivanova")


def make_customer(email):
    user = make_plain_user(email)
    Customer.objects.create(user=user, sex="F", birthday=date(1990, 1, 1), phone="+375291234567")
    return user


def make_doctor(email):
    user = make_plain_user(email)
    Doctor.objects.create(
        user=user, position="Therapist", cabinet=1, work_schedule={"monday": [["09:00", "17:00"]]}, slot_duration=15
    )
    return user


def make_representative(email):
    user = make_plain_user(email)
    Representative.objects.create(user=user)
    return user
