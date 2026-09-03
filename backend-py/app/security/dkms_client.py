"""Client for the DKMS PII-encryption service — three endpoints under
`DKMS_BASE_URL`: `/dkms/v1/encryption`, `/dkms/v1/decryption`,
`/dkms/v1/hash`. Used to keep `User.email`/`firstName`/`lastName` encrypted
at rest (see `app/services/auth_service.py`) with a separate deterministic
`User.emailHash` for lookup/dedup, so nothing ever needs to decrypt-and-
compare plaintext email to find or deduplicate an account.

Sync (`httpx.Client`, not `AsyncClient`) — every caller today
(`auth_service.py`'s create/update/token-issuance functions,
`admin.py`'s response serializers, `subsidiary_recipients.py`) is a plain
synchronous function; FastAPI already runs sync route handlers in a
threadpool, so there's no event-loop-blocking concern here the way there
would be for the AI provider services (`fabrixAIService.py`/`groqAIService.py`),
which are on the request's hot async path.

Every function here logs only metadata (operation, piiTag, duration, status)
via `_log` — never the plaintext or ciphertext value itself.
"""

from __future__ import annotations

import time
from typing import Optional

import httpx

from app.config import settings
from app.errors import DkmsUnavailableError

_ENCRYPT_PATH = "/dkms/v1/encryption"
_DECRYPT_PATH = "/dkms/v1/decryption"
_HASH_PATH = "/dkms/v1/hash"

# Candidate response field names to check, in order — DKMS's actual response
# shape wasn't specified up front; this list should be narrowed to the real
# field name once verified against a reachable DKMS instance (see
# backend-py/README's DKMS section / this feature's rollout notes).
_ENCRYPT_RESULT_KEYS = ("ciphertext", "encryptedText", "cipherText", "encrypted", "result", "data")
_DECRYPT_RESULT_KEYS = ("text", "plaintext", "decryptedText", "result", "data")
_HASH_RESULT_KEYS = ("hash", "hashedText", "hashValue", "result", "data")


def _log(operation: str, pii_tag: Optional[str], duration_ms: float, status: str) -> None:
    tag_part = f" piiTag={pii_tag}" if pii_tag else ""
    print(f"[dkmsClient] operation={operation}{tag_part} durationMs={duration_ms:.0f} status={status}")


def _base_url() -> str:
    base_url = settings.DKMS_BASE_URL
    if not base_url:
        raise DkmsUnavailableError("DKMS_BASE_URL is not configured")
    return base_url.rstrip("/")


def _post(path: str, body: dict, operation: str, pii_tag: Optional[str] = None) -> dict:
    url = f"{_base_url()}{path}"
    started_at = time.time()
    try:
        response = httpx.post(url, json=body, timeout=settings.DKMS_TIMEOUT_SECONDS)
    except httpx.TimeoutException as exc:
        _log(operation, pii_tag, (time.time() - started_at) * 1000, "timeout")
        raise DkmsUnavailableError(f"DKMS {operation} request timed out") from exc
    except httpx.HTTPError as exc:
        _log(operation, pii_tag, (time.time() - started_at) * 1000, "network_error")
        raise DkmsUnavailableError(f"DKMS {operation} request failed") from exc

    duration_ms = (time.time() - started_at) * 1000
    if response.status_code != 200:
        _log(operation, pii_tag, duration_ms, f"http_{response.status_code}")
        raise DkmsUnavailableError(f"DKMS {operation} failed ({response.status_code})")

    try:
        payload = response.json()
    except Exception as exc:
        _log(operation, pii_tag, duration_ms, "invalid_json")
        raise DkmsUnavailableError(f"DKMS {operation} returned a non-JSON response") from exc

    _log(operation, pii_tag, duration_ms, "ok")
    if not isinstance(payload, dict):
        raise DkmsUnavailableError(f"DKMS {operation} returned an unexpected response shape")
    return payload


def _extract(payload: dict, candidates: tuple, operation: str) -> str:
    for key in candidates:
        value = payload.get(key)
        if isinstance(value, str) and value:
            return value
    raise DkmsUnavailableError(
        f"DKMS {operation} response did not include a recognizable result field "
        f"(got keys: {list(payload.keys())})"
    )


def encrypt(pii_tag: str, text: str) -> str:
    """Encrypts `text`, tagged `pii_tag` for DKMS's own audit/classification
    purposes. Raises `DkmsUnavailableError` on any failure — callers on a
    write path (creating/updating a user) should let this propagate rather
    than falling back to storing plaintext."""
    body = {"piiTag": pii_tag, "taskId": settings.DKMS_TASK_ID, "text": text}
    payload = _post(_ENCRYPT_PATH, body, "encrypt", pii_tag)
    return _extract(payload, _ENCRYPT_RESULT_KEYS, "encrypt")


def decrypt(ciphertext: str) -> str:
    """Decrypts a value previously returned by `encrypt`. Raises
    `DkmsUnavailableError` on any failure — use `decrypt_or_none` on a
    display/read path where a failure shouldn't take down the whole
    response."""
    body = {"ciphertext": ciphertext}
    payload = _post(_DECRYPT_PATH, body, "decrypt")
    return _extract(payload, _DECRYPT_RESULT_KEYS, "decrypt")


def decrypt_or_none(ciphertext: Optional[str]) -> Optional[str]:
    """Best-effort decrypt for display purposes: `None` in, `None` out; a
    DKMS failure is logged and swallowed (returns `None`) rather than
    failing the whole request it's part of — e.g. one bad/unreachable call
    while rendering the admin user list shouldn't 502 the entire list."""
    if not ciphertext:
        return None
    try:
        return decrypt(ciphertext)
    except DkmsUnavailableError:
        return None


def hash_value(pii_tag: str, text: str) -> str:
    """Deterministic hash of `text`, for lookup/dedup — this is the only
    thing ever compared against `User.emailHash`; the plaintext/ciphertext
    email is never decrypted-and-compared for that purpose. Raises
    `DkmsUnavailableError` on any failure."""
    body = {"piiTag": pii_tag, "text": text}
    payload = _post(_HASH_PATH, body, "hash", pii_tag)
    return _extract(payload, _HASH_RESULT_KEYS, "hash")


# --- Field-specific convenience wrappers (the only three PII fields this
# app encrypts today — see auth_service.py) ---------------------------------


def encrypt_email(email: str) -> str:
    return encrypt(settings.DKMS_PII_TAG_EMAIL, email)


def hash_email(email: str) -> str:
    """Callers should normalize (trim + lowercase) `email` before calling
    this, so the hash — and therefore lookup/dedup — stays case-insensitive
    the same way the old plaintext `LOWER(email) = ...` comparison was."""
    return hash_value(settings.DKMS_PII_TAG_EMAIL, email)


def encrypt_first_name(value: str) -> str:
    return encrypt(settings.DKMS_PII_TAG_FIRST_NAME, value)


def encrypt_last_name(value: str) -> str:
    return encrypt(settings.DKMS_PII_TAG_LAST_NAME, value)
