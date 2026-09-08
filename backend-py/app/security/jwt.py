"""Port of the JWT half of `backend/src/services/authService.ts` +
`backend/src/middleware/authJwt.ts` — HS256, 15-minute access tokens, exact
claim names (`sub`, `username`, `role`, `subsidiaryId`, `firstName`,
`lastName`) so the existing frontend (which decodes these client-side after
`POST /auth/refresh`, see `src/auth/authStore.ts`) can't tell the difference.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Optional, TypedDict

import jwt as pyjwt

from app.config import settings

ACCESS_TOKEN_EXPIRES_MINUTES = 15
ALGORITHM = "HS256"


class AccessTokenPayload(TypedDict):
    sub: str
    username: str
    role: str
    subsidiaryId: Optional[str]
    firstName: Optional[str]
    lastName: Optional[str]


def create_access_token(payload: AccessTokenPayload) -> str:
    """Signs a short-lived (15 min), stateless access token — verified by
    signature/expiry only, never checked against the database (mirrors
    `issueAccessToken`)."""
    to_encode: dict[str, Any] = dict(payload)
    now = datetime.now(timezone.utc)
    to_encode["iat"] = int(now.timestamp())
    to_encode["exp"] = int((now + timedelta(minutes=ACCESS_TOKEN_EXPIRES_MINUTES)).timestamp())
    return pyjwt.encode(to_encode, settings.require_jwt_secret(), algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    """Verifies signature + expiry (HS256) and returns the claims. Raises
    `jwt.PyJWTError` subclasses on any failure — callers (see
    `app/security/deps.py`) translate that into a 401, matching
    `express-jwt`'s `UnauthorizedError` handling in `errorHandler.ts`."""
    return pyjwt.decode(token, settings.require_jwt_secret(), algorithms=[ALGORITHM])
