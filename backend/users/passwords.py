from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import transaction
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken


def validate_new_password(user, raw_password):
    """Check a new password for `user`: Django's rules, and it must differ from the password the account has now.

    Used by the reset link and by the logged-in change, so both flows judge a password the same way. Raises Django's
    ValidationError holding every problem found, so the user can fix them all at once.
    """
    problems = []
    try:
        validate_password(raw_password, user)
    except ValidationError as exc:
        problems.extend(exc.messages)
    # Not an oracle: whoever gets this far has already proven who they are (the current password or a valid link)
    if user.check_password(raw_password):
        problems.append("This is your current password. Choose a different one.")
    if problems:
        raise ValidationError(problems)


def revoke_refresh_tokens(user):
    """Blacklist every refresh token the user has been given, so an old session cannot get new access tokens."""
    outstanding = OutstandingToken.objects.filter(user=user)
    # ignore_conflicts skips the tokens that are already blacklisted (a token can be blacklisted only once).
    BlacklistedToken.objects.bulk_create(
        [BlacklistedToken(token=token) for token in outstanding],
        ignore_conflicts=True,
    )


@transaction.atomic
def set_password_and_end_sessions(user, raw_password):
    """Save a new password and sign the user out everywhere.

    This is what "the password changed" means in one place, so the reset link and the logged-in password change
    behave the same. All or nothing: a new password with the old sessions still alive would be the worst outcome.
    Access tokens cannot be recalled and simply run out (they live for 10 minutes).
    """
    user.set_password(raw_password)
    # update() instead of save(): CustomUser.save() runs full_clean() on every field, so an old account with a
    # blank name would make a password change fail for a reason that has nothing to do with the password.
    type(user).objects.filter(pk=user.pk).update(password=user.password)
    revoke_refresh_tokens(user)
