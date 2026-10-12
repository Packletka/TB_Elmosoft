from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken


def revoke_refresh_tokens(user):
    """Blacklist every refresh token the user has been given, so an old session cannot get new access tokens."""
    outstanding = OutstandingToken.objects.filter(user=user)
    # ignore_conflicts skips the tokens that are already blacklisted (a token can be blacklisted only once).
    BlacklistedToken.objects.bulk_create(
        [BlacklistedToken(token=token) for token in outstanding],
        ignore_conflicts=True,
    )


def set_password_and_end_sessions(user, raw_password):
    """Save a new password and sign the user out everywhere.

    This is what "the password changed" means in one place, so the reset link and the logged-in password change
    behave the same. Access tokens cannot be recalled and simply run out (they live for 10 minutes).
    """
    user.set_password(raw_password)
    # update() instead of save(): CustomUser.save() runs full_clean() on every field, so an old account with a
    # blank name would make a password change fail for a reason that has nothing to do with the password.
    type(user).objects.filter(pk=user.pk).update(password=user.password)
    revoke_refresh_tokens(user)
