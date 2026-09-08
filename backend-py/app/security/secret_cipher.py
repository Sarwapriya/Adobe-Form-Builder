"""Port of `backend/src/utils/secretCipher.ts` — AES-256-GCM encrypt/decrypt
for short secrets (e.g. an SMTP password) stored in the `AdminSettings`
key/value table (TODO(phase N): the settings service that actually reads/
writes these). The key is derived from `JWT_SECRET` (SHA-256), the same
choice the Node side made to avoid a second required secret.

Output format: "<iv-b64>.<tag-b64>.<ciphertext-b64>" — identical to the TS
implementation, so a value encrypted by one backend decrypts correctly on
the other (both derive the same key from the same `JWT_SECRET`).
"""

from __future__ import annotations

import base64
import hashlib
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.config import settings

_IV_LENGTH_BYTES = 12


def _derive_key() -> bytes:
    return hashlib.sha256(settings.require_jwt_secret().encode("utf-8")).digest()


def encrypt_secret(plain: str) -> str:
    key = _derive_key()
    iv = os.urandom(_IV_LENGTH_BYTES)
    aesgcm = AESGCM(key)
    # `cryptography`'s AESGCM appends the 16-byte auth tag to the ciphertext;
    # split it back out so the on-the-wire format matches Node's
    # iv/tag/ciphertext triple exactly.
    ciphertext_and_tag = aesgcm.encrypt(iv, plain.encode("utf-8"), None)
    ciphertext, tag = ciphertext_and_tag[:-16], ciphertext_and_tag[-16:]
    return ".".join(
        base64.b64encode(part).decode("ascii") for part in (iv, tag, ciphertext)
    )


def decrypt_secret(payload: str) -> str:
    iv_b64, tag_b64, data_b64 = payload.split(".")
    key = _derive_key()
    iv = base64.b64decode(iv_b64)
    tag = base64.b64decode(tag_b64)
    ciphertext = base64.b64decode(data_b64)
    aesgcm = AESGCM(key)
    plain = aesgcm.decrypt(iv, ciphertext + tag, None)
    return plain.decode("utf-8")
