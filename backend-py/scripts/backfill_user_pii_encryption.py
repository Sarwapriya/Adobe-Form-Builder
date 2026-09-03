"""One-time data migration for the DKMS PII-encryption rollout — encrypts
every existing `Users` row's plaintext `email`/`firstName`/`lastName` and
populates the new `emailHash` column, for rows created before this feature
shipped (new rows created via `auth_service.create_user`/`update_user`
after this deploy are already encrypted going in).

Idempotent / safe to re-run: only touches rows where `emailHash IS NULL`,
which is only ever true for a not-yet-migrated row — once migrated, a row's
`emailHash` is always set, so a second run is a no-op over already-migrated
data. Run this once, after applying the `ALTER TABLE` in this feature's
rollout SQL and before (or immediately after) deploying the code that
expects `email`/`firstName`/`lastName` to already be ciphertext — a user
whose row hasn't been migrated yet will fail to log in with a display-name
decrypt error otherwise (see `auth_service.issue_access_token`), though the
core credential check itself is unaffected either way (`validate_credentials`
only ever compares `username`/`passwordHash`, never `email`).

Requires DKMS to actually be reachable (`DKMS_BASE_URL`/`DKMS_TASK_ID`
configured) — run from `backend-py/` with the venv active:

    python scripts/backfill_user_pii_encryption.py [--dry-run]
"""

from __future__ import annotations

import sys

sys.path.insert(0, ".")

import argparse

from sqlalchemy import select

from app.db import get_sessionmaker
from app.errors import DkmsUnavailableError
from app.models.user import User
from app.security import dkms_client


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dry-run", action="store_true", help="Report how many rows would be migrated without writing anything."
    )
    args = parser.parse_args()

    db = get_sessionmaker()()
    try:
        rows = list(db.execute(select(User).where(User.emailHash.is_(None))).scalars())
        print(f"Found {len(rows)} user row(s) not yet migrated.")
        if args.dry_run:
            for row in rows:
                print(f"  - would migrate user id={row.id} username={row.username!r}")
            return

        migrated = 0
        failed = 0
        for row in rows:
            try:
                # `row.email` is still plaintext for these not-yet-migrated
                # rows — this is the one place in the codebase that's
                # expected to be true, and only for the duration of this
                # one-time script.
                plaintext_email = row.email
                normalized = _normalize_email(plaintext_email)
                email_hash = dkms_client.hash_email(normalized)
                encrypted_email = dkms_client.encrypt_email(plaintext_email)
                encrypted_first_name = (
                    dkms_client.encrypt_first_name(row.firstName) if row.firstName else None
                )
                encrypted_last_name = (
                    dkms_client.encrypt_last_name(row.lastName) if row.lastName else None
                )
            except DkmsUnavailableError as exc:
                print(f"  ! FAILED user id={row.id}: {exc.message}")
                failed += 1
                continue

            row.email = encrypted_email
            row.emailHash = email_hash
            row.firstName = encrypted_first_name
            row.lastName = encrypted_last_name
            db.add(row)
            db.commit()
            migrated += 1
            print(f"  - migrated user id={row.id} username={row.username!r}")

        print(f"Done. migrated={migrated} failed={failed}")
        if failed:
            print("Re-run this script to retry the failed row(s) once DKMS is reachable.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
