"""Port of `backend/src/middleware/rateLimit.ts`'s three limiters, using
`slowapi` (a `flask-limiter`-style wrapper around `limits`, IP-keyed by
default — same default key as `express-rate-limit`).

- `general_limiter` — applied globally (see `app/main.py`), generous.
- `auth_limiter` — applied only to `/auth/login` and `/auth/refresh`.
- `ai_limiter` — applied only to `POST /ai/chat` (not wired to a router yet
  in this phase — TODO(phase N): AI assistant router).
"""

from __future__ import annotations

from slowapi import Limiter
from slowapi.util import get_remote_address

GENERAL_RATE_LIMIT = "300/15minutes"
AUTH_RATE_LIMIT = "10/15minutes"
AI_RATE_LIMIT = "20/15minutes"

AUTH_RATE_LIMIT_MESSAGE = {"error": "Too many attempts, please try again later."}
AI_RATE_LIMIT_MESSAGE = {"error": "Too many AI requests, please try again later."}

# One shared Limiter instance (slowapi's recommended pattern) — each route
# opts into a tighter limit via `@limiter.limit(...)`; the app-wide default
# below is the "general" limiter applied to everything else.
limiter = Limiter(key_func=get_remote_address, default_limits=[GENERAL_RATE_LIMIT])
