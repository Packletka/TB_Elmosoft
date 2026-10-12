import smtplib

from celery import shared_task
from celery.utils.log import get_task_logger
from django.conf import settings

from .emails import send_templated_email

logger = get_task_logger(__name__)

# Retry policy shared by every task that sends email.
# Temporary errors are retried: network trouble, timeouts and most SMTP replies are all OSError subclasses.
# Permanent errors are not: wrong credentials, a refused sender or recipient, a server without a needed SMTP
# feature, and any bug such as a missing template, which is not an OSError at all.
# Known gap: after rejecting a wrong password (535) Gmail hangs up, and smtplib then reports that hang-up as
# SMTPServerDisconnected instead of the 535. That case is retried like any dropped connection; max_retries
# keeps it bounded (six attempts in total), after which the task fails once with a traceback.
EMAIL_TASK_OPTIONS = {
    "autoretry_for": (OSError,),
    "dont_autoretry_for": (
        smtplib.SMTPAuthenticationError,
        smtplib.SMTPRecipientsRefused,
        smtplib.SMTPSenderRefused,
        smtplib.SMTPNotSupportedError,
    ),
    "retry_backoff": 10,  # delay limits of 10 s, 20 s, 40 s, ... doubling on every retry
    "retry_backoff_max": 300,  # but never more than 5 minutes
    "retry_jitter": True,  # wait a random time up to that limit, so failed tasks do not all retry at once
    "max_retries": 5,  # then give up; all retries together fit well inside the 15-minute token lifetime
}

PREVIEW_SUBJECTS = {
    "password_reset": "Reset your TalonBy password",
    "password_changed": "Your TalonBy password was changed",
}


@shared_task(**EMAIL_TASK_OPTIONS)
def send_test_email(to_email, kind="password_reset"):
    """Diagnostic task: sends a real template with dummy data through the current EMAIL_* settings."""
    context = {
        "first_name": "Pavel",
        "action_url": f"{settings.FRONTEND_URL}/reset-password?uid=preview&token=preview-token",
        "valid_minutes": 15,
    }
    sent = send_templated_email(to_email, PREVIEW_SUBJECTS[kind], kind, context)
    logger.info("%s preview: %s message(s) handed to the email backend", kind, sent)
