"""Tests for `app/routers/auth.py` — login / refresh / logout.

Requires a reachable SQL Server test database (see `tests/conftest.py`'s doc
comment for why there's no SQLite fallback). Every test here is a no-op skip
if `database_available` is False, so `pytest` still exits cleanly with no
config at all — just with everything reported as skipped.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import User
from app.models.refresh_token import RefreshToken
from app.services.auth_service import hash_token


def _csrf_headers(client: TestClient) -> dict:
    return {"X-CSRF-Token": client.cookies.get("csrfToken")}


class TestLogin:
    def test_login_success_returns_token_user_and_cookies(self, client: TestClient, active_user: User):
        resp = client.post("/api/v1/auth/login", json={"username": active_user.username, "password": "correct horse battery staple"})

        assert resp.status_code == 200
        body = resp.json()
        assert body["accessToken"]
        assert body["user"] == {
            "id": active_user.id,
            "username": active_user.username,
            "role": active_user.role,
            "subsidiaryId": active_user.subsidiaryId,
            "firstName": active_user.firstName,
            "lastName": active_user.lastName,
        }
        assert "refreshToken" in resp.cookies
        assert "csrfToken" in resp.cookies

    def test_login_wrong_password_returns_401(self, client: TestClient, active_user: User):
        resp = client.post("/api/v1/auth/login", json={"username": active_user.username, "password": "not the right password"})

        assert resp.status_code == 401
        assert resp.json() == {"error": "invalid credentials"}
        assert "refreshToken" not in resp.cookies

    def test_login_inactive_user_returns_401(self, client: TestClient, inactive_user: User):
        resp = client.post("/api/v1/auth/login", json={"username": inactive_user.username, "password": "correct horse battery staple"})

        assert resp.status_code == 401
        assert resp.json() == {"error": "invalid credentials"}

    def test_login_unknown_username_returns_401(self, client: TestClient):
        resp = client.post("/api/v1/auth/login", json={"username": "no-such-user", "password": "whatever"})

        assert resp.status_code == 401
        assert resp.json() == {"error": "invalid credentials"}

    def test_login_missing_fields_returns_400(self, client: TestClient):
        resp = client.post("/api/v1/auth/login", json={"username": ""})

        assert resp.status_code == 400
        assert resp.json()["error"] == "validation failed"


class TestRefresh:
    def test_refresh_without_cookie_returns_401(self, client: TestClient, active_user: User):
        # Prime a CSRF cookie via login first, then hit refresh with a fresh
        # client that never received the refreshToken cookie.
        client.post("/api/v1/auth/login", json={"username": active_user.username, "password": "correct horse battery staple"})
        bare_client = TestClient(client.app)
        bare_client.cookies.set("csrfToken", client.cookies.get("csrfToken"))

        resp = bare_client.post("/api/v1/auth/refresh", headers={"X-CSRF-Token": client.cookies.get("csrfToken")})

        assert resp.status_code == 401
        assert resp.json() == {"error": "no refresh token presented"}

    def test_refresh_missing_csrf_header_returns_403(self, client: TestClient, active_user: User):
        client.post("/api/v1/auth/login", json={"username": active_user.username, "password": "correct horse battery staple"})

        resp = client.post("/api/v1/auth/refresh")

        assert resp.status_code == 403

    def test_refresh_success_rotates_token(self, client: TestClient, active_user: User):
        login_resp = client.post(
            "/api/v1/auth/login", json={"username": active_user.username, "password": "correct horse battery staple"}
        )
        old_refresh_cookie = login_resp.cookies.get("refreshToken")

        refresh_resp = client.post("/api/v1/auth/refresh", headers=_csrf_headers(client))
        assert refresh_resp.status_code == 200
        assert refresh_resp.json()["accessToken"]

        new_refresh_cookie = refresh_resp.cookies.get("refreshToken")
        assert new_refresh_cookie is not None
        assert new_refresh_cookie != old_refresh_cookie

    def test_refresh_reusing_a_just_rotated_token_succeeds_within_grace_window(self, client: TestClient, active_user: User):
        """Two browser tabs of the same session racing to redeem the same
        refresh cookie (e.g. opening the Edit Files window — see
        auth_service.REFRESH_REUSE_GRACE_SECONDS) — the loser must still get
        a valid session instead of being logged out."""
        login_resp = client.post(
            "/api/v1/auth/login", json={"username": active_user.username, "password": "correct horse battery staple"}
        )
        old_refresh_token = login_resp.cookies.get("refreshToken")

        first = client.post("/api/v1/auth/refresh", headers=_csrf_headers(client))
        assert first.status_code == 200
        # The client's cookie jar now holds the newly-rotated token AND a
        # freshly re-issued csrfToken (refresh re-issues both) — put only the
        # old (already-rotated) refresh token back to simulate a second tab
        # that read the cookie before the first tab's rotation landed, while
        # using the *current* CSRF token so this second call only exercises
        # the behavior under test, not a stale-CSRF false negative.
        client.cookies.set("refreshToken", old_refresh_token)

        second = client.post("/api/v1/auth/refresh", headers=_csrf_headers(client))

        assert second.status_code == 200, second.text
        assert second.json()["accessToken"]
        assert second.cookies.get("refreshToken") is not None

    def test_refresh_reusing_a_rotated_token_fails_once_the_grace_window_has_passed(
        self, client: TestClient, db_session: Session, active_user: User
    ):
        login_resp = client.post(
            "/api/v1/auth/login", json={"username": active_user.username, "password": "correct horse battery staple"}
        )
        old_refresh_token = login_resp.cookies.get("refreshToken")

        first = client.post("/api/v1/auth/refresh", headers=_csrf_headers(client))
        assert first.status_code == 200

        # Simulate time passing well past the grace window, directly on the
        # now-rotated row (rather than sleeping the test).
        rotated_record = db_session.execute(
            select(RefreshToken).where(RefreshToken.tokenHash == hash_token(old_refresh_token))
        ).scalar_one()
        rotated_record.revokedAt = datetime.now(timezone.utc) - timedelta(minutes=5)
        db_session.commit()

        client.cookies.set("refreshToken", old_refresh_token)
        second = client.post("/api/v1/auth/refresh", headers=_csrf_headers(client))

        assert second.status_code == 401
        assert second.json() == {"error": "invalid or expired refresh token"}

    def test_refresh_never_revives_a_token_killed_by_logout(self, client: TestClient, active_user: User):
        """A token revoked by logout (as opposed to rotation) must never be
        redeemable again, even immediately — the grace window only applies
        to rotation (see RefreshToken.replacedByTokenHash)."""
        login_resp = client.post(
            "/api/v1/auth/login", json={"username": active_user.username, "password": "correct horse battery staple"}
        )
        access_token = login_resp.json()["accessToken"]
        refresh_token = login_resp.cookies.get("refreshToken")

        logout_resp = client.post(
            "/api/v1/auth/logout",
            headers={**_csrf_headers(client), "Authorization": f"Bearer {access_token}"},
        )
        assert logout_resp.status_code == 204

        client.cookies.set("refreshToken", refresh_token)
        resp = client.post("/api/v1/auth/refresh", headers=_csrf_headers(client))

        assert resp.status_code == 401
        assert resp.json() == {"error": "invalid or expired refresh token"}

    def test_refresh_bad_csrf_token_returns_403(self, client: TestClient, active_user: User):
        client.post("/api/v1/auth/login", json={"username": active_user.username, "password": "correct horse battery staple"})

        resp = client.post("/api/v1/auth/refresh", headers={"X-CSRF-Token": "not-the-real-token"})

        assert resp.status_code == 403
        assert resp.json() == {"error": "invalid or missing CSRF token"}


class TestLogout:
    def test_logout_success_clears_cookie(self, client: TestClient, active_user: User):
        login_resp = client.post(
            "/api/v1/auth/login", json={"username": active_user.username, "password": "correct horse battery staple"}
        )
        access_token = login_resp.json()["accessToken"]

        resp = client.post(
            "/api/v1/auth/logout",
            headers={**_csrf_headers(client), "Authorization": f"Bearer {access_token}"},
        )

        assert resp.status_code == 204

    def test_logout_without_auth_header_returns_401(self, client: TestClient, active_user: User):
        client.post("/api/v1/auth/login", json={"username": active_user.username, "password": "correct horse battery staple"})

        resp = client.post("/api/v1/auth/logout", headers=_csrf_headers(client))

        assert resp.status_code == 401

    def test_logout_bad_csrf_returns_403(self, client: TestClient, active_user: User):
        login_resp = client.post(
            "/api/v1/auth/login", json={"username": active_user.username, "password": "correct horse battery staple"}
        )
        access_token = login_resp.json()["accessToken"]

        resp = client.post(
            "/api/v1/auth/logout",
            headers={"X-CSRF-Token": "wrong", "Authorization": f"Bearer {access_token}"},
        )

        assert resp.status_code == 403
