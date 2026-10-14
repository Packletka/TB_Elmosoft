import smtplib
from urllib.parse import urlencode

from celery import shared_task
from celery.utils.log import get_task_logger
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from phonenumber_field.phonenumber import to_python

from . import phone_change
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

EMAIL_SUBJECTS = {
    "password_reset": "Reset your TalonBy password",
    "password_changed": "Your TalonBy password was changed",
    "phone_change_code": "Your TalonBy confirmation code",
}


def _get_active_user(user_id):
    """Look the user up again inside the task: the account may have been deleted or disabled since the request."""
    user = get_user_model().objects.filter(pk=user_id, is_active=True).first()
    if user is None:
        logger.warning("No active user %s, no email sent", user_id)
    return user


@shared_task(**EMAIL_TASK_OPTIONS)
def send_password_reset_email(user_id):
    """Email a one-time link for choosing a new password.

    Only the user id travels through Redis. The token is made here, so the secret never sits in the queue, and a
    retry makes a fresh one. The token is signed with SECRET_KEY, so the web and worker containers must share it.
    """
    user = _get_active_user(user_id)
    if user is None:
        return
    query = urlencode(
        {
            "uid": urlsafe_base64_encode(force_bytes(user.pk)),
            "token": default_token_generator.make_token(user),
        }
    )
    context = {
        "first_name": user.first_name,
        "action_url": f"{settings.FRONTEND_URL}/reset-password?{query}",
        "valid_minutes": settings.PASSWORD_RESET_TIMEOUT // 60,
    }
    send_templated_email(user.email, EMAIL_SUBJECTS["password_reset"], "password_reset", context)
    # Log the id only: the address is personal data and the link is a secret.
    logger.info("Password reset email for user %s handed to the email backend", user_id)


@shared_task(**EMAIL_TASK_OPTIONS)
def send_password_changed_email(user_id):
    """Tell the owner that the password was changed, so they notice if it was not them."""
    user = _get_active_user(user_id)
    if user is None:
        return
    send_templated_email(
        user.email,
        EMAIL_SUBJECTS["password_changed"],
        "password_changed",
        {"first_name": user.first_name},
    )
    logger.info("Password changed email for user %s handed to the email backend", user_id)


@shared_task(**EMAIL_TASK_OPTIONS)
def send_phone_change_code_email(user_id):
    """Email the code that confirms a new phone number.

    Only the user id travels through Redis. The code is worked out here from the pending change, so it never sits in
    the queue, and a retry sends the same code.
    """
    user = _get_active_user(user_id)
    if user is None:
        return
    pending = phone_change.get_pending(user_id)
    if pending is None:
        # Cancelled, used or expired since this task was queued
        logger.warning("No pending phone change for user %s, no email sent", user_id)
        return
    context = {
        "first_name": user.first_name,
        "code": phone_change.make_code(user_id, pending["phone"], pending["nonce"]),
        "phone": to_python(pending["phone"]).as_international,
        "valid_minutes": phone_change.CODE_LIFETIME // 60,
    }
    send_templated_email(user.email, EMAIL_SUBJECTS["phone_change_code"], "phone_change_code", context)
    # Log the id only: the code is a secret and the number is personal data
    logger.info("Phone change code email for user %s handed to the email backend", user_id)


@shared_task(**EMAIL_TASK_OPTIONS)
def send_test_email(to_email, kind="password_reset"):
    """Diagnostic task: sends a real template with dummy data through the current EMAIL_* settings."""
    context = {
        "first_name": "Pavel",
        "action_url": f"{settings.FRONTEND_URL}/reset-password?uid=preview&token=preview-token",
        "valid_minutes": 15,
        "code": "123456",
        "phone": "+375 44 111-22-33",
    }
    sent = send_templated_email(to_email, EMAIL_SUBJECTS[kind], kind, context)
    logger.info("%s preview: %s message(s) handed to the email backend", kind, sent)
