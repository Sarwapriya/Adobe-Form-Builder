"""Client for the DKMS PII-encryption service — three endpoints under the
configured base URL: `/dkms/v1/encryption`, `/dkms/v1/decryption`,
`/dkms/v1/hash`. Used to keep `User.email`/`firstName`/`lastName` encrypted
at rest (see `app/services/auth_service.py`) with a separate deterministic
`User.emailHash` for lookup/dedup, so nothing ever needs to decrypt-and-
compare plaintext email to find or deduplicate an account.

Connection settings (base URL, task id, timeout, PII tags) are resolved
fresh on every call via `dkms_settings_service.get_dkms_settings` — DB-stored
`AdminSetting` rows win when present, the `DKMS_*` env vars in
`app/config.py` are the fallback for a not-yet-configured environment. This
module opens its own short-lived DB session per call to do that resolution
(see `_resolve_settings`) rather than requiring every one of its many
callers (`auth_service.py`, `admin.py`, `subsidiary_recipients.py`,
`cutoff_reminder_service.py`, `project_code_service.py`, the seed/backfill
scripts, ...) to thread a `Session` through — same "not a hot path, re-
resolve rather than cache" tradeoff `smtp_settings_service`/
`fabrix_settings_service` already make, just paid here inside the client
instead of by each caller.

Sync (`httpx.Client`, not `AsyncClient`) — every caller today is a plain
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

from app.errors import DkmsUnavailableError
from app.services.dkms_settings_service import DkmsSettings

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


def _resolve_settings() -> DkmsSettings:
    """Opens a short-lived DB session just to read the current DKMS
    settings, then closes it — see module docstring for why this happens
    here rather than via a `db` parameter on every public function below."""
    from app.db import get_sessionmaker
    from app.services.dkms_settings_service import get_dkms_settings

    db = get_sessionmaker()()
    try:
        resolved = get_dkms_settings(db)
    finally:
        db.close()
    if resolved is None or not resolved.baseUrl:
        raise DkmsUnavailableError("DKMS is not configured (set it in Configuration, or DKMS_BASE_URL/DKMS_TASK_ID)")
    return resolved


def _base_url(resolved: DkmsSettings) -> str:
    base_url = resolved.baseUrl.rstrip("/")
    # Tolerates the base URL being stored either with or without the
    # `/dkms/v1` segment already appended — `_ENCRYPT_PATH`/`_DECRYPT_PATH`/
    # `_HASH_PATH` above always include it, so strip it here if present to
    # avoid a doubled-up `/dkms/v1/dkms/v1/...` URL either way.
    if base_url.endswith("/dkms/v1"):
        base_url = base_url[: -len("/dkms/v1")]
    return base_url


def _post(resolved: DkmsSettings, path: str, body: dict, operation: str, pii_tag: Optional[str] = None) -> dict:
    url = f"{_base_url(resolved)}{path}"
    started_at = time.time()
    try:
        response = httpx.post(url, json=body, timeout=resolved.timeoutSeconds)
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
    resolved = _resolve_settings()
    body = {"piiTag": pii_tag, "taskId": resolved.taskId, "text": text}
    payload = _post(resolved, _ENCRYPT_PATH, body, "encrypt", pii_tag)
    return _extract(payload, _ENCRYPT_RESULT_KEYS, "encrypt")


def decrypt(ciphertext: str) -> str:
    """Decrypts a value previously returned by `encrypt`. Raises
    `DkmsUnavailableError` on any failure — use `decrypt_or_none` on a
    display/read path where a failure shouldn't take down the whole
    response."""
    resolved = _resolve_settings()
    body = {"ciphertext": ciphertext}
    payload = _post(resolved, _DECRYPT_PATH, body, "decrypt")
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
    resolved = _resolve_settings()
    body = {"piiTag": pii_tag, "text": text}
    payload = _post(resolved, _HASH_PATH, body, "hash", pii_tag)
    return _extract(payload, _HASH_RESULT_KEYS, "hash")


# --- Field-specific convenience wrappers (the only three PII fields this
# app encrypts today — see auth_service.py) ---------------------------------


def encrypt_email(email: str) -> str:
    return encrypt(_resolve_settings().piiTagEmail, email)


def hash_email(email: str) -> str:
    """Callers should normalize (trim + lowercase) `email` before calling
    this, so the hash — and therefore lookup/dedup — stays case-insensitive
    the same way the old plaintext `LOWER(email) = ...` comparison was."""
    return hash_value(_resolve_settings().piiTagEmail, email)


def encrypt_first_name(value: str) -> str:
    return encrypt(_resolve_settings().piiTagFirstName, value)


def encrypt_last_name(value: str) -> str:
    return encrypt(_resolve_settings().piiTagLastName, value)
