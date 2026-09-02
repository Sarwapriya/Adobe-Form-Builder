"""Port of `backend/src/middleware/csrf.ts` — the hand-rolled double-submit
cookie CSRF check (not a third-party package on the Node side either).

`issue_csrf_cookie` sets a random token as a *readable* (non-httpOnly)
`Path=/` cookie; the frontend echoes it back via the `X-CSRF-Token` header on
every state-changing cookie-authenticated request (see
`src/api/apiClient.ts`), and `require_csrf_token` checks the two match.
"""

from __future__ import annotations

import secrets

from fastapi import HTTPException, Request, Response, status

from app.config import settings

CSRF_COOKIE_NAME = "csrfToken"


def issue_csrf_cookie(response: Response) -> None:
    """Equivalent of `issueCsrfCookie` — sets a fresh CSRF token cookie.
    Deliberately `Path=/` (unlike the refresh-token cookie's
    `Path=/api/v1/auth`) — it must be `document.cookie`-readable from the
    frontend's own pages, which live at different paths than the API."""
    token = secrets.token_hex(32)
    response.set_cookie(
        key=CSRF_COOKIE_NAME,
        value=token,
        httponly=False,
        secure=settings.is_production,
        samesite="strict",
        path="/",
    )


def require_csrf_token(request: Request) -> None:
    """FastAPI dependency: verifies the `X-CSRF-Token` header matches the
    `csrfToken` cookie. Raises 403 on mismatch/missing, same as
    `requireCsrfToken`. Requires `issue_csrf_cookie` to have run earlier in
    the session (login, and again on every refresh)."""
    cookie_token = request.cookies.get(CSRF_COOKIE_NAME)
    header_token = request.headers.get("x-csrf-token")
    if not cookie_token or not header_token or cookie_token != header_token:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="invalid or missing CSRF token")
