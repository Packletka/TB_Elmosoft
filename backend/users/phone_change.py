"""Changing a customer's phone number with a code sent to the account's email.

Nothing secret is stored. Redis holds only the pending number, a random nonce and a count of guesses. The six-digit
code is worked out from the nonce and SECRET_KEY, so the web process (checking a guess) and the worker (writing the
email) arrive at the same code without it ever passing through the queue or the cache.
"""

import secrets

from django.core.cache import cache
from django.utils.crypto import constant_time_compare, salted_hmac

CODE_LENGTH = 6
CODE_LIFETIME = 10 * 60  # seconds; the pending change and its guess counter expire together
MAX_ATTEMPTS = 5  # guesses per code, the right one included
REQUEST_COOLDOWN = 60  # seconds between two codes for one account

EXPIRED = "This code has expired or was already used. Request a new one."
TOO_MANY = "Too many wrong codes. Request a new one."
WRONG = "The code is incorrect."


class CodeRejected(Exception):
    """A guess was not accepted. The message is written for the user."""


def _pending_key(user_id):
    return f"phone-change:{user_id}"


def _attempts_key(user_id):
    return f"phone-change-attempts:{user_id}"


def _cooldown_key(user_id):
    return f"phone-change-cooldown:{user_id}"


def claim_request_slot(user_id):
    """True if a new code may be sent now. cache.add stores the key only if it is missing, in one atomic step."""
    return cache.add(_cooldown_key(user_id), 1, REQUEST_COOLDOWN)


def start(user_id, phone):
    """Remember that this user wants `phone`. A second call replaces the first, so only the newest code works."""
    # The counter first: confirm() reads the pending change first, so it never finds one without a counter
    cache.set(_attempts_key(user_id), 0, CODE_LIFETIME)
    cache.set(_pending_key(user_id), {"phone": phone, "nonce": secrets.token_hex(16)}, CODE_LIFETIME)


def get_pending(user_id):
    return cache.get(_pending_key(user_id))


def cancel(user_id):
    cache.delete_many([_pending_key(user_id), _attempts_key(user_id)])


def make_code(user_id, phone, nonce):
    digest = salted_hmac("phone-change-code", f"{user_id}:{phone}:{nonce}", algorithm="sha256").hexdigest()
    return str(int(digest[:12], 16) % 10**CODE_LENGTH).zfill(CODE_LENGTH)


def confirm(user_id, guess):
    """Check a guess. Returns the new phone number if it is right, raises CodeRejected otherwise."""
    pending = get_pending(user_id)
    if pending is None:
        raise CodeRejected(EXPIRED)

    # incr is atomic in Redis, so parallel guesses cannot all be counted as the same attempt
    try:
        attempts = cache.incr(_attempts_key(user_id))
    except ValueError:
        raise CodeRejected(EXPIRED) from None
    if attempts > MAX_ATTEMPTS:
        raise CodeRejected(TOO_MANY)

    if constant_time_compare(guess, make_code(user_id, pending["phone"], pending["nonce"])):
        cancel(user_id)
        return pending["phone"]

    if attempts == MAX_ATTEMPTS:
        cancel(user_id)
        raise CodeRejected(TOO_MANY)
    raise CodeRejected(WRONG)
