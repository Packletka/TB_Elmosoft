from celery import shared_task
from celery.utils.log import get_task_logger
from django.conf import settings

from .emails import send_templated_email

logger = get_task_logger(__name__)

PREVIEW_SUBJECTS = {
    "password_reset": "Reset your TalonBy password",
    "password_changed": "Your TalonBy password was changed",
}


@shared_task
def send_test_email(to_email, kind="password_reset"):
    """Diagnostic task: sends a real template with dummy data through the current EMAIL_* settings."""
    context = {
        "first_name": "Pavel",
        "action_url": f"{settings.FRONTEND_URL}/reset-password?uid=preview&token=preview-token",
        "valid_minutes": 15,
    }
    sent = send_templated_email(to_email, PREVIEW_SUBJECTS[kind], kind, context)
    logger.info("%s preview: %s message(s) handed to the email backend", kind, sent)
