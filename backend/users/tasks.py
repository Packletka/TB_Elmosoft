from celery import shared_task
from celery.utils.log import get_task_logger
from django.core.mail import send_mail

logger = get_task_logger(__name__)


@shared_task
def send_test_email(to_email):
    """Diagnostic task: proves the worker can deliver mail with the current EMAIL_* settings."""
    sent = send_mail(
        subject="TalonBy test email",
        message="If you can read this, the Celery worker can send email.",
        from_email=None,  # None means DEFAULT_FROM_EMAIL
        recipient_list=[to_email],
    )
    logger.info("send_mail handed %s message(s) to the email backend", sent)
