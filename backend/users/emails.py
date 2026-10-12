from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

SITE_NAME = "TalonBy"


def send_templated_email(to_email, subject, template, context):
    """Render emails/<template>.txt and emails/<template>.html and send them as one multipart message."""
    context = {
        "site_name": SITE_NAME,
        "frontend_url": settings.FRONTEND_URL,
        "forgot_password_url": f"{settings.FRONTEND_URL}/forgot-password",
        **context,
    }
    text_body = render_to_string(f"emails/{template}.txt", context).strip()
    html_body = render_to_string(f"emails/{template}.html", context)
    message = EmailMultiAlternatives(subject=subject, body=text_body, to=[to_email])
    message.attach_alternative(html_body, "text/html")
    return message.send()
