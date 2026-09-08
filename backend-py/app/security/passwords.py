"""Bcrypt hashing/verification, wire-compatible with the Node side's
`bcryptjs` hashes (`backend/src/services/authService.ts` uses
`bcrypt.hash(password, 10)` / `bcrypt.compare`) — standard bcrypt is a single
well-defined algorithm/format ($2a$/$2b$ prefix, cost factor, salt, hash all
encoded in the one string), so a hash produced by either library verifies
correctly against the other with no conversion needed.

Calls the `bcrypt` package directly (not `passlib`) — recent `bcrypt`
releases (>=4.1) dropped the `__about__.__version__` attribute `passlib`
1.7.x probes for at import time, which breaks `passlib`'s bcrypt backend on
a fresh install; going straight to `bcrypt` avoids that footgun entirely.
"""

from __future__ import annotations

import bcrypt

BCRYPT_SALT_ROUNDS = 10


def hash_password(plain: str) -> str:
    """Equivalent of `bcrypt.hash(password, 10)`."""
    salt = bcrypt.gensalt(rounds=BCRYPT_SALT_ROUNDS)
    return bcrypt.hashpw(plain.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Equivalent of `bcrypt.compare(password, user.passwordHash)`. Returns
    `False` (never raises) for a malformed/foreign hash, same tolerant
    behavior a caller relying on `bcrypt.compare`'s promise resolution would
    see."""
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False
