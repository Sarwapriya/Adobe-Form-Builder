"""Port of `backend/src/middleware/authJwt.ts` (`requireAuth`/`requireAdmin`/
`optionalAuth`) as FastAPI dependencies.

`express-jwt` reads the `Authorization: Bearer <token>` header, verifies it,
and populates `req.auth` with the payload — this module reproduces that
exactly with plain header parsing (no `fastapi.security.HTTPBearer`, since
that class's default `auto_error` response shape/status don't match
`express-jwt`'s "401 + {'error': 'invalid or missing token'}" body from
`errorHandler.ts`).
"""

from __future__ import annotations

from typing import Optional

import jwt as pyjwt
from fastapi import Depends, HTTPException, Request, status

from app.models.user import is_admin_role
from app.security.jwt import decode_access_token

AUTH_ERROR_BODY = {"error": "invalid or missing token"}


def _extract_bearer_token(request: Request) -> Optional[str]:
    header = request.headers.get("authorization")
    if not header:
        return None
    parts = header.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    return parts[1]


def require_auth(request: Request) -> dict:
    """Requires a valid JWT (any claims). Returns the decoded payload
    (equivalent of populating `req.auth`)."""
    token = _extract_bearer_token(request)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=AUTH_ERROR_BODY["error"])
    try:
        payload = decode_access_token(token)
    except pyjwt.PyJWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=AUTH_ERROR_BODY["error"]) from exc
    request.state.auth = payload
    return payload


def require_admin(payload: dict = Depends(require_auth)) -> dict:
    """Requires a valid JWT whose `role` claim is `"admin"` or
    `"superadmin"` — see `is_admin_role` (`app/models/user.py`)."""
    if not is_admin_role(payload.get("role", "")):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="admin role required")
    return payload


def optional_auth(request: Request) -> Optional[dict]:
    """Verifies a JWT if present, but proceeds unauthenticated (returns
    `None`) if absent. A *present but invalid* token still raises 401 —
    matching `express-jwt`'s `credentialsRequired: false` semantics, which
    only tolerates a missing token, not a malformed one."""
    token = _extract_bearer_token(request)
    if not token:
        return None
    try:
        payload = decode_access_token(token)
    except pyjwt.PyJWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=AUTH_ERROR_BODY["error"]) from exc
    request.state.auth = payload
    return payload
