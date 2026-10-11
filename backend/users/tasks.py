import time

from celery import shared_task
from celery.utils.log import get_task_logger

logger = get_task_logger(__name__)


@shared_task
def smoke_test(message, delay_seconds=0):
    """Throwaway task for the M2 experiments; it is removed once real tasks exist."""
    logger.info("smoke_test got %r", message)
    time.sleep(delay_seconds)
    return f"done: {message}"
