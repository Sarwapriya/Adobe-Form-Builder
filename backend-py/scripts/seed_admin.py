"""One-time script to create the first admin account from the ADMIN_USER/
ADMIN_EMAIL/ADMIN_PASSWORD_HASH env vars. Run manually once per environment
after the schema is in place — not run automatically on every server boot
(seeding is a deliberate, one-time action, not startup logic). Port of
`backend/scripts/seedAdmin.ts`, updated for DKMS-based PII encryption (the
Node original predates it — see `auth_service.create_user`, whose
encrypt-then-hash shape this mirrors directly rather than storing a
plaintext email).

Requires DKMS to actually be reachable (`DKMS_BASE_URL`/`DKMS_TASK_ID`
configured) — run from `backend-py/` with the venv active:

    python scripts/seed_admin.py
"""

from __future__ import annotations

import sys

sys.path.insert(0, ".")

from sqlalchemy import select

from app.config import settings
from app.db import get_sessionmaker
from app.models.user import User
from app.security import dkms_client


def _require_env(name: str) -> str:
    value = getattr(settings, name, None)
    if not value:
        print(f"Missing required environment variable: {name}", file=sys.stderr)
        sys.exit(1)
    return value


def main() -> None:
    username = _require_env("ADMIN_USER")
    email = _require_env("ADMIN_EMAIL")
    password_hash = _require_env("ADMIN_PASSWORD_HASH")

    db = get_sessionmaker()()
    try:
        existing_admin = db.execute(select(User).where(User.role == "admin")).scalars().first()
        if existing_admin is not None:
            print(f'An admin user already exists (username: "{existing_admin.username}") — nothing to do.')
            return

        existing_username = db.execute(select(User).where(User.username == username)).scalar_one_or_none()
        if existing_username is not None:
            print(
                f'A user with username "{username}" already exists but is not an admin. Refusing to overwrite it — '
                "either promote it manually or set ADMIN_USER to a different value.",
                file=sys.stderr,
            )
            sys.exit(1)

        normalized_email = email.strip().lower()
        email_hash = dkms_client.hash_email(normalized_email)
        encrypted_email = dkms_client.encrypt_email(email)

        admin = User(
            username=username,
            email=encrypted_email,
            emailHash=email_hash,
            passwordHash=password_hash,
            role="admin",
            isActive=True,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

        print(f'Created admin user "{username}" (id: {admin.id}).')
    finally:
        db.close()


if __name__ == "__main__":
    main()
