"""Port of `backend/src/services/authService.ts` — login/refresh/logout
(phase 1) plus the admin-facing user-CRUD half (phase 3, `admin.router.ts`'s
`/users` routes): `create_user`, `list_users`, `find_user_by_id`,
`set_user_active`, `update_user`, `delete_user`,
`set_user_notification_emails`, `list_admin_notification_emails`.
"""

from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Literal, Optional

from sqlalchemy import delete, func, or_, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.errors import ConflictError, ValidationError
from app.models.ai_action import AIAction
from app.models.ai_conversation import AIConversation
from app.models.form import Form
from app.models.form_contribution import FormContribution
from app.models.form_version import FormVersion
from app.models.qa_run import QaRun
from app.models.question_master_version import QuestionMasterVersion
from app.models.refresh_token import RefreshToken
from app.models.user import User, UserRole
from app.security import dkms_client
from app.security.jwt import AccessTokenPayload, create_access_token
from app.security.passwords import hash_password, verify_password


def _normalize_email(email: str) -> str:
    """Matches the pre-encryption behavior's case-insensitivity
    (`func.lower(User.email) == email.lower()`) — hashing (and looking up
    duplicates by) the trimmed+lowercased form keeps "Ada@Example.com" and
    "ada@example.com" resolving to the same account."""
    return email.strip().lower()

# 7 days, in milliseconds — kept as *milliseconds* (not e.g. seconds) to match
# `REFRESH_TOKEN_TTL_MS`'s own unit, since `app/routers/auth.py` uses it
# directly as a cookie `max_age`-equivalent computation.
REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000
REFRESH_TOKEN_TTL_SECONDS = REFRESH_TOKEN_TTL_MS // 1000


def hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def validate_credentials(db: Session, username: str, password: str) -> Optional[User]:
    """Looks up a user by username and verifies the given plaintext password
    against their stored bcrypt hash. Returns `None` on any failure (unknown
    username, inactive account, wrong password) — deliberately without
    distinguishing which, so a login failure never reveals whether a given
    username exists."""
    # `== True` rather than `.is_(True)` — MSSQL's `bit` column has no native
    # boolean literal, so SQLAlchemy's `IS`-based boolean shorthand (which
    # works on dialects with a real boolean type) renders invalid `IS 1`
    # syntax here; `== True` renders as the always-valid `= 1`.
    user = db.execute(
        select(User).where(User.username == username, User.isActive == True)  # noqa: E712
    ).scalar_one_or_none()
    if user is None:
        return None
    if not verify_password(password, user.passwordHash):
        return None
    return user


def issue_access_token(user: User) -> str:
    """Short-lived (15 min), stateless — verified by signature/expiry only,
    never checked against the database.

    `firstName`/`lastName` are decrypted here (not left as DKMS ciphertext)
    because the frontend reads this token's payload client-side for display
    after a page reload (`authStore.ts`'s `silentRefresh`/`decodeAccessToken`)
    — embedding ciphertext would show garbled text as the user's name. Uses
    `decrypt_or_none`, not `decrypt`: a DKMS outage decrypting a *display*
    name shouldn't block login/refresh itself, which already succeeded on
    the real check (the password/refresh-token validation above)."""
    payload: AccessTokenPayload = {
        "sub": user.id,
        "username": user.username,
        "role": user.role,
        "subsidiaryId": user.subsidiaryId,
        "firstName": dkms_client.decrypt_or_none(user.firstName),
        "lastName": dkms_client.decrypt_or_none(user.lastName),
    }
    return create_access_token(payload)


def issue_refresh_token(db: Session, user: User, ip: Optional[str] = None) -> str:
    """Issues a new refresh token for a user: a random 48-byte value,
    returned to the caller so it can be set as an httpOnly cookie, but
    persisted only as its SHA-256 hash — the raw value is never stored."""
    raw_token = secrets.token_hex(48)
    refresh_token = RefreshToken(
        userId=user.id,
        tokenHash=hash_token(raw_token),
        expiresAt=datetime.now(timezone.utc) + timedelta(milliseconds=REFRESH_TOKEN_TTL_MS),
        revokedAt=None,
        createdByIp=ip,
    )
    db.add(refresh_token)
    db.commit()
    return raw_token


def rotate_refresh_token(db: Session, raw_token: str, ip: Optional[str] = None) -> Optional[dict]:
    """Validates a presented refresh token and, if valid, rotates it: the old
    token is revoked (single-use) and a brand-new access/refresh pair is
    issued. Returns `None` if the token is missing, unknown, already
    revoked, expired, or its owning user has since been deactivated."""
    record = db.execute(
        select(RefreshToken).where(
            RefreshToken.tokenHash == hash_token(raw_token), RefreshToken.revokedAt.is_(None)
        )
    ).scalar_one_or_none()
    if record is None:
        return None

    expires_at = record.expiresAt
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None

    record.revokedAt = datetime.now(timezone.utc)
    db.add(record)
    db.commit()

    user = db.execute(
        select(User).where(User.id == record.userId, User.isActive == True)  # noqa: E712
    ).scalar_one_or_none()
    if user is None:
        return None

    return {
        "accessToken": issue_access_token(user),
        "refreshToken": issue_refresh_token(db, user, ip),
    }


def revoke_refresh_token(db: Session, raw_token: str) -> None:
    """Revokes a refresh token (logout). A no-op if the token is unknown or
    already revoked — logout should never fail visibly to the caller either
    way."""
    record = db.execute(
        select(RefreshToken).where(RefreshToken.tokenHash == hash_token(raw_token))
    ).scalar_one_or_none()
    if record is not None and record.revokedAt is None:
        record.revokedAt = datetime.now(timezone.utc)
        db.add(record)
        db.commit()


def create_user(
    db: Session,
    username: str,
    email: str,
    password: str,
    role: UserRole,
    subsidiary_id: Optional[str] = None,
) -> User:
    """Creates a new user account. There is no self-service signup in this
    system — accounts are provisioned by an admin via
    `POST /api/v1/admin/users`. The plaintext password is hashed here and
    never persisted or logged; the plaintext email is likewise never logged
    (see `dkms_client`'s own logging, which only ever logs metadata).

    Rejects a duplicate username or email (case-insensitive) with a
    `ConflictError` before ever hashing the password. The email side of that
    check compares `User.emailHash` — a deterministic hash of the normalized
    email — never a decrypted/plaintext comparison.

    Raises `DkmsUnavailableError` (unhandled here — propagates to the
    caller/route) if DKMS can't be reached, rather than falling back to
    storing the email in plaintext."""
    email_hash = dkms_client.hash_email(_normalize_email(email))
    existing = db.execute(
        select(User).where((func.lower(User.username) == username.lower()) | (User.emailHash == email_hash))
    ).scalar_one_or_none()
    if existing is not None:
        field = "username" if existing.username.lower() == username.lower() else "email"
        raise ConflictError(f"A user with this {field} already exists")

    password_hash = hash_password(password)
    encrypted_email = dkms_client.encrypt_email(email)
    user = User(
        username=username,
        email=encrypted_email,
        emailHash=email_hash,
        passwordHash=password_hash,
        role=role,
        subsidiaryId=subsidiary_id,
        isActive=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def list_users(db: Session) -> list[User]:
    """Every provisioned account, newest first, for the User Management
    page's list — never includes `passwordHash` (callers of this function
    are responsible for excluding it when serializing, same as the TS
    side's `Omit<User, "passwordHash">` return type)."""
    return list(db.execute(select(User).order_by(User.createdAt.desc())).scalars().all())


def find_user_by_id(db: Session, id: str) -> Optional[User]:
    """Looked up by `admin.router.ts`'s `PATCH /users/:id` before toggling
    `isActive`, to check the *target's* role against the caller's own
    permissions before `set_user_active` runs."""
    return db.get(User, id)


def set_user_active(db: Session, id: str, is_active: bool) -> Optional[User]:
    """Enables or disables an account — `validate_credentials` only ever
    matches an active user, so disabling one immediately blocks new logins.
    Returns `None` if the id doesn't exist — callers map that to a 404."""
    existing = db.get(User, id)
    if existing is None:
        return None
    existing.isActive = is_active
    db.add(existing)
    db.commit()
    db.refresh(existing)
    return existing


def _user_has_dependent_records(db: Session, id: str) -> bool:
    """True if this user has ever created/submitted/reviewed/triggered/
    generated anything the app still shows in its history. Real DB foreign
    keys enforce this regardless (a hard DELETE would fail on one of them),
    but checking first lets `delete_user` return a clean, specific outcome
    instead of a raw SQL error bubbling up.

    Covers every table with a live FK to `Users.id` *except* `RefreshTokens`
    (a login session, not a business record — `delete_user` deletes those
    itself rather than blocking on them) — `Forms`, `FormVersions`,
    `FormContributions` (both `submittedByUserId` and `reviewedByUserId`),
    `QuestionMasterVersions`, `QaRuns`, `AIConversations`, `AIActions`, and
    `Uploads` (the removed Excel-upload feature's table — no ORM model left
    in this port, but the table and its FK to Users still exist in the
    shared DB, so it's checked via raw SQL)."""
    if db.execute(select(Form.id).where(Form.createdByUserId == id).limit(1)).first():
        return True
    if db.execute(select(FormVersion.id).where(FormVersion.createdByUserId == id).limit(1)).first():
        return True
    if db.execute(
        select(FormContribution.id)
        .where(or_(FormContribution.submittedByUserId == id, FormContribution.reviewedByUserId == id))
        .limit(1)
    ).first():
        return True
    if db.execute(
        select(QuestionMasterVersion.id).where(QuestionMasterVersion.generatedByUserId == id).limit(1)
    ).first():
        return True
    if db.execute(select(QaRun.id).where(QaRun.triggeredByUserId == id).limit(1)).first():
        return True
    if db.execute(select(AIConversation.id).where(AIConversation.userId == id).limit(1)).first():
        return True
    if db.execute(select(AIAction.id).where(AIAction.userId == id).limit(1)).first():
        return True
    if db.execute(text("SELECT TOP 1 id FROM Uploads WHERE userId = :id"), {"id": id}).first():
        return True
    return False


DeleteUserOutcome = Literal["ok", "not_found", "has_records"]


def delete_user(db: Session, id: str) -> DeleteUserOutcome:
    """Hard-deletes a user account — only possible when they have no
    dependent records anywhere in the app's history (see
    `_user_has_dependent_records`); such a user can only be deactivated
    (`set_user_active`, always available regardless of this), never deleted.
    Deletes this user's refresh tokens first (a real FK too, but not itself
    a "record" worth blocking on) so the delete doesn't fail on stale
    sessions. The `IntegrityError` fallback is a last line of defense for a
    race (a record created between the check above and this commit) or an
    FK this function doesn't yet know about — translated to the same
    `"has_records"` outcome rather than a raw DB error reaching the caller."""
    existing = db.get(User, id)
    if existing is None:
        return "not_found"
    if _user_has_dependent_records(db, id):
        return "has_records"

    db.execute(delete(RefreshToken).where(RefreshToken.userId == id))
    db.delete(existing)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return "has_records"
    return "ok"


def update_user(db: Session, id: str, input: dict[str, Any]) -> Optional[User]:
    """Updates a user's own account fields (username/email/role/subsidiary)
    — distinct from `set_user_active` (isActive only) and
    `set_user_notification_emails` (contact address only). Permission
    checking (superadmin-only) happens in the route, not here.

    `input` mirrors the TS `UpdateUserInput` shape via key presence: an
    omitted key leaves that field as-is, an explicit `None` for
    `subsidiaryId`/`firstName`/`lastName` clears it. Returns `None` if the id
    doesn't exist.

    Rejects a duplicate username or email (case-insensitive, excluding this
    row itself) with a `ConflictError`. Rejects leaving a "standard" user
    without a subsidiary with a `ValidationError`, computed against the
    *resulting* role/subsidiaryId (not just what's in this partial update).

    The email side of the duplicate check — and of the "did email actually
    change" decision — compares `User.emailHash`, never decrypted/plaintext
    email: `existing.email` is DKMS ciphertext, not something `.lower()`-
    comparable the way the pre-encryption code compared it. Encryption/
    hashing is skipped entirely when no new email is provided, both to avoid
    an unnecessary DKMS round trip and so a `DkmsUnavailableError` is only
    ever possible here when the caller actually asked to change the email."""
    existing = db.get(User, id)
    if existing is None:
        return None

    next_username = (input.get("username") or "").strip() or existing.username
    requested_email = (input.get("email") or "").strip()
    username_changed = next_username.lower() != existing.username.lower()
    email_changing = bool(requested_email)

    next_email_hash: Optional[str] = existing.emailHash
    if email_changing:
        next_email_hash = dkms_client.hash_email(_normalize_email(requested_email))

    if username_changed or email_changing:
        conflict_conditions = [func.lower(User.username) == next_username.lower()]
        if email_changing:
            conflict_conditions.append(User.emailHash == next_email_hash)
        conflict = db.execute(
            select(User).where(User.id != id, or_(*conflict_conditions))
        ).scalar_one_or_none()
        if conflict is not None:
            field = "username" if conflict.username.lower() == next_username.lower() else "email"
            raise ConflictError(f"A user with this {field} already exists")

    next_role: UserRole = input.get("role", existing.role)
    if "subsidiaryId" in input:
        raw_subsidiary_id = input["subsidiaryId"]
        next_subsidiary_id = raw_subsidiary_id.strip() if raw_subsidiary_id else None
    else:
        next_subsidiary_id = existing.subsidiaryId
    if next_role == "standard" and not next_subsidiary_id:
        raise ValidationError("Subsidiary is required for a standard user")

    existing.username = next_username
    if email_changing:
        existing.email = dkms_client.encrypt_email(requested_email)
        existing.emailHash = next_email_hash
    existing.role = next_role
    existing.subsidiaryId = next_subsidiary_id
    if "firstName" in input:
        raw_first_name = input["firstName"]
        existing.firstName = dkms_client.encrypt_first_name(raw_first_name.strip()) if raw_first_name else None
    if "lastName" in input:
        raw_last_name = input["lastName"]
        existing.lastName = dkms_client.encrypt_last_name(raw_last_name.strip()) if raw_last_name else None
    db.add(existing)
    db.commit()
    db.refresh(existing)
    return existing


def set_user_notification_emails(db: Session, id: str, emails: dict[str, Any]) -> Optional[User]:
    """Updates a user's own up-to-two separate notification-email
    addresses. Returns `None` if the id doesn't exist. Permission checking
    (self, or superadmin acting on someone else) happens in the route."""
    existing = db.get(User, id)
    if existing is None:
        return None

    if "notificationEmail" in emails:
        value = emails["notificationEmail"]
        existing.notificationEmail = value.strip() if value else None
    if "notificationEmail2" in emails:
        value = emails["notificationEmail2"]
        existing.notificationEmail2 = value.strip() if value else None
    db.add(existing)
    db.commit()
    db.refresh(existing)
    return existing


def list_admin_notification_emails(db: Session) -> list[str]:
    """Every notification-email address set on an active admin/superadmin
    account, deduplicated — what upload/submission notification emails send
    to."""
    admins = db.execute(
        select(User).where(User.role.in_(["admin", "superadmin"]), User.isActive == True)  # noqa: E712
    ).scalars().all()
    emails: set[str] = set()
    for u in admins:
        if u.notificationEmail:
            emails.add(u.notificationEmail)
        if u.notificationEmail2:
            emails.add(u.notificationEmail2)
    return list(emails)
