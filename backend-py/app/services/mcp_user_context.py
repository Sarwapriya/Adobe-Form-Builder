"""Signs the authenticated caller's identity for the MCP server's FormIQ tools.

The chatbot never lets the LLM tell the MCP server who the user is: every
FormIQ tool call carries `X-FormIQ-User-Context`, minted here from the
verified JWT claims (`require_auth`'s `auth` dict) and HMAC-signed with
MCP_USER_CONTEXT_SECRET, a secret shared only with the MCP server
(`mcp_mssql/auth.py` there verifies it and derives the subsidiary scope from
it). Tokens are minted per call and live 60 seconds.

Format: `<base64url(canonical JSON)>.<base64url(HMAC-SHA256(first part))>` —
tests/test_mcp_user_context.py pins a test vector shared with the MCP repo.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time
from typing import Optional

HEADER_NAME = "X-FormIQ-User-Context"
TOKEN_LIFETIME_SECONDS = 60


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def mint_user_context(auth: dict, secret: str, now: Optional[float] = None) -> str:
    if not secret:
        raise ValueError("MCP_USER_CONTEXT_SECRET is not configured")
    issued = int(time.time() if now is None else now)
    payload = {
        "sub": auth["sub"],
        "role": auth["role"],
        "subsidiaryId": auth.get("subsidiaryId") or None,
        "iat": issued,
        "exp": issued + TOKEN_LIFETIME_SECONDS,
    }
    payload_b64 = _b64(json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8"))
    signature = _b64(hmac.new(secret.encode("utf-8"), payload_b64.encode("ascii"), hashlib.sha256).digest())
    return f"{payload_b64}.{signature}"
