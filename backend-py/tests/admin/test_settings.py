"""Tests for the SMTP/FabriX/Groq/SFTP settings CRUD under
`/api/v1/admin/*-settings` — round-trips each through the real DB and
verifies secrets are actually stored encrypted (not plaintext) and decrypt
back correctly via `app.security.secret_cipher`.

The smtp/fabrix "test" endpoints are asserted to return the not-yet-
implemented shape this phase intentionally ships (outbound send is a later
phase) rather than a 404 — the route must exist and be reachable. Groq's test
endpoint is a real implementation (see `app.routers.admin.test_groq_settings`),
so only its "no key configured" precondition is exercised here — a full
round-trip would need real network access to api.groq.com.
"""

from __future__ import annotations

import uuid

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.admin_setting import AdminSetting
from app.security.secret_cipher import decrypt_secret
from app.services.admin_settings_service import set_admin_setting


class TestSmtpSettings:
    def test_round_trip_and_password_is_write_only(self, client: TestClient, admin_headers: dict, db_session: Session):
        resp = client.patch(
            "/api/v1/admin/smtp-settings",
            json={"host": "smtp.example.com", "port": 2525, "secure": True, "user": "u", "password": "s3cret!", "from": "no-reply@example.com"},
            headers=admin_headers,
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["host"] == "smtp.example.com"
        assert body["port"] == 2525
        assert body["hasPassword"] is True
        assert "password" not in body

        get_resp = client.get("/api/v1/admin/smtp-settings", headers=admin_headers)
        assert get_resp.json()["hasPassword"] is True

        row = db_session.execute(select(AdminSetting).where(AdminSetting.key == "smtpPasswordEnc")).scalar_one()
        assert row.value != "s3cret!"
        assert decrypt_secret(row.value) == "s3cret!"

    def test_omitted_password_keeps_existing(self, client: TestClient, admin_headers: dict):
        client.patch(
            "/api/v1/admin/smtp-settings",
            json={"host": "smtp2.example.com", "port": 587, "secure": False, "user": None, "password": "keep-me", "from": None},
            headers=admin_headers,
        )
        resp = client.patch(
            "/api/v1/admin/smtp-settings",
            json={"host": "smtp2.example.com", "port": 587, "secure": False, "user": None, "from": None},
            headers=admin_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["hasPassword"] is True

    def test_non_admin_forbidden(self, client: TestClient, standard_headers: dict):
        resp = client.get("/api/v1/admin/smtp-settings", headers=standard_headers)
        assert resp.status_code == 403

    def test_test_endpoint_not_yet_implemented(self, client: TestClient, admin_headers: dict):
        resp = client.post("/api/v1/admin/smtp-settings/test", headers=admin_headers)
        assert resp.status_code == 200
        assert resp.json()["ok"] is False


class TestFabrixSettings:
    def test_round_trip_secrets_encrypted(self, client: TestClient, admin_headers: dict, db_session: Session):
        # A FabriX model must exist and be enabled for get_fabrix_settings to
        # resolve non-null (baseUrl alone isn't enough — see
        # fabrix_settings_service.get_fabrix_settings).
        client.post(
            "/api/v1/admin/fabrix-models", json={"name": "Test Model", "modelId": f"model-{uuid.uuid4().hex[:6]}"}, headers=admin_headers
        )

        resp = client.patch(
            "/api/v1/admin/fabrix-settings",
            json={"baseUrl": "https://fabrix.example.com", "clientHeader": "client-secret", "openApiToken": "token-secret", "userEmail": "u@example.com", "enabled": True},
            headers=admin_headers,
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["baseUrl"] == "https://fabrix.example.com"
        assert body["hasClientHeader"] is True
        assert body["hasOpenApiToken"] is True
        assert body["enabledModelCount"] >= 1

        row = db_session.execute(select(AdminSetting).where(AdminSetting.key == "fabrixClientHeaderEnc")).scalar_one()
        assert decrypt_secret(row.value) == "client-secret"

    def test_test_endpoint_requires_configuration(self, client: TestClient, admin_headers: dict, db_session: Session):
        # This dev DB is shared with the real (Node) app, which may already
        # have a FabriX baseUrl configured for real usage outside this
        # test's transaction — force-clear it within this test's own
        # rolled-back scope so the "not configured" precondition holds
        # regardless of ambient DB state.
        set_admin_setting(db_session, "fabrixApiBaseUrl", None)
        resp = client.post("/api/v1/admin/fabrix-settings/test", headers=admin_headers)
        assert resp.status_code == 400


class TestFabrixModels:
    def test_create_update_move_delete(self, client: TestClient, admin_headers: dict):
        a = client.post("/api/v1/admin/fabrix-models", json={"name": "Model A", "modelId": "a"}, headers=admin_headers).json()
        b = client.post("/api/v1/admin/fabrix-models", json={"name": "Model B", "modelId": "b"}, headers=admin_headers).json()
        assert b["sortOrder"] > a["sortOrder"]

        updated = client.patch(f"/api/v1/admin/fabrix-models/{a['id']}", json={"isEnabled": False}, headers=admin_headers)
        assert updated.status_code == 200
        assert updated.json()["isEnabled"] is False

        moved = client.post(f"/api/v1/admin/fabrix-models/{b['id']}/move", json={"direction": "up"}, headers=admin_headers)
        assert moved.status_code == 200
        assert moved.json()["sortOrder"] == a["sortOrder"]

        deleted = client.delete(f"/api/v1/admin/fabrix-models/{a['id']}", headers=admin_headers)
        assert deleted.status_code == 204
        deleted_again = client.delete(f"/api/v1/admin/fabrix-models/{a['id']}", headers=admin_headers)
        assert deleted_again.status_code == 404


class TestGroqSettings:
    def test_round_trip_and_key_write_only(self, client: TestClient, admin_headers: dict, db_session: Session):
        resp = client.patch(
            "/api/v1/admin/groq-settings",
            json={"model": "openai/gpt-oss-120b", "apiKey": "gsk_secret", "enabled": True},
            headers=admin_headers,
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["model"] == "openai/gpt-oss-120b"
        assert body["hasApiKey"] is True
        assert "apiKey" not in body

        row = db_session.execute(select(AdminSetting).where(AdminSetting.key == "groqApiKeyEnc")).scalar_one()
        assert decrypt_secret(row.value) == "gsk_secret"

    def test_test_endpoint_requires_key(self, client: TestClient, admin_headers: dict, db_session: Session):
        # Same ambient-state caveat as the FabriX test above — force-clear
        # any real API key within this test's own rolled-back scope.
        set_admin_setting(db_session, "groqApiKeyEnc", None)
        resp = client.post("/api/v1/admin/groq-settings/test", headers=admin_headers)
        assert resp.status_code == 400


class TestSftpDeploymentSettings:
    def test_round_trip_no_encryption(self, client: TestClient, admin_headers: dict, db_session: Session):
        resp = client.patch(
            "/api/v1/admin/deployment-settings/staging",
            json={"host": "sftp.example.com", "port": 2222, "username": "deploy", "privateKeyPath": "/keys/id_rsa", "remotePath": "/incoming"},
            headers=admin_headers,
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["staging"]["host"] == "sftp.example.com"
        assert body["staging"]["port"] == 2222

        row = db_session.execute(select(AdminSetting).where(AdminSetting.key == "sftpStagingHost")).scalar_one()
        assert row.value == "sftp.example.com"  # stored in plaintext, not encrypted

    def test_set_active_environment(self, client: TestClient, admin_headers: dict):
        resp = client.post("/api/v1/admin/deployment-settings/active", json={"environment": "production"}, headers=admin_headers)
        assert resp.status_code == 200
        assert resp.json()["activeEnvironment"] == "production"

    def test_invalid_environment_rejected(self, client: TestClient, admin_headers: dict):
        resp = client.patch(
            "/api/v1/admin/deployment-settings/not-a-real-env",
            json={"host": "h", "username": "u", "privateKeyPath": "p", "remotePath": "r"},
            headers=admin_headers,
        )
        assert resp.status_code == 400
