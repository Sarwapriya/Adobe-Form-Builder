"""Starlette middleware reproducing helmet's default header set, port of
`app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }))`
in `backend/src/app.ts`.

`Cross-Origin-Resource-Policy: cross-origin` is the one deliberate override —
helmet v8's default (`same-origin`) would make browsers block the frontend
(a different origin) from reading *any* response, JSON included, regardless
of what the CORS middleware itself allows. Every other header below is
helmet's own out-of-the-box default set (helmet v8, `contentSecurityPolicy`
and `hsts` included), reproduced so a response from this backend is
header-for-header indistinguishable from the Node one.
"""

from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from starlette.types import ASGIApp

_HELMET_DEFAULT_CSP = (
    "default-src 'self';"
    "base-uri 'self';"
    "font-src 'self' https: data:;"
    "form-action 'self';"
    "frame-ancestors 'self';"
    "img-src 'self' data:;"
    "object-src 'none';"
    "script-src 'self';"
    "script-src-attr 'none';"
    "style-src 'self' https: 'unsafe-inline';"
    "upgrade-insecure-requests"
)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        headers = response.headers
        headers["Content-Security-Policy"] = _HELMET_DEFAULT_CSP
        headers["Cross-Origin-Opener-Policy"] = "same-origin"
        # The one deliberate deviation from helmet's own default — see module
        # doc comment above.
        headers["Cross-Origin-Resource-Policy"] = "cross-origin"
        headers["Origin-Agent-Cluster"] = "?1"
        headers["Referrer-Policy"] = "no-referrer"
        headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        headers["X-Content-Type-Options"] = "nosniff"
        headers["X-DNS-Prefetch-Control"] = "off"
        headers["X-Download-Options"] = "noopen"
        headers["X-Frame-Options"] = "SAMEORIGIN"
        headers["X-Permitted-Cross-Domain-Policies"] = "none"
        headers["X-XSS-Protection"] = "0"
        return response
