"""Tests for the SMTP/FabriX/SFTP settings CRUD under `/api/v1/admin/*-settings`
and the "other" AI providers under `/api/v1/admin/ai-providers` — round-trips
each through the real DB and verifies secrets are actually stored encrypted
(not plaintext) and decrypt back correctly via `app.security.secret_cipher`.

The smtp/fabrix "test" endpoints are real implementations (SMTP via
`email_service.send_test_email`, FabriX via `fabrixAIService.send_message`) —
only each one's "not configured yet" precondition is exercised here, not a full
round-trip, since that would need real network access this test environment
doesn't guarantee. Likewise a provider's own "test" call is never made for real;
the fallback loop is covered with stubbed senders instead.
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

    def test_test_endpoint_sends_a_real_email(self, client: TestClient, admin_headers: dict, dkms_available: bool):
        """The real implementation (see `app.routers.admin.test_smtp_settings`)
        decrypts the calling admin's own DKMS-encrypted email, then sends to
        it via `email_service.send_test_email` — neither DKMS nor a reachable
        SMTP host is guaranteed in this test environment, so this only
        asserts a well-formed outcome rather than a full round-trip."""
        resp = client.post("/api/v1/admin/smtp-settings/test", headers=admin_headers)
        if not dkms_available:
            assert resp.status_code == 502
            assert resp.json()["error"] == "Could not resolve your email address"
            return
        assert resp.status_code in (200, 502)
        body = resp.json()
        if resp.status_code == 200:
            assert body["ok"] is True
            assert "sentTo" in body
        else:
            assert "error" in body


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
    def test_create_update_move_and_no_delete(self, client: TestClient, admin_headers: dict):
        a = client.post("/api/v1/admin/fabrix-models", json={"name": "Model A", "modelId": "a"}, headers=admin_headers).json()
        b = client.post("/api/v1/admin/fabrix-models", json={"name": "Model B", "modelId": "b"}, headers=admin_headers).json()
        assert b["sortOrder"] > a["sortOrder"]

        updated = client.patch(f"/api/v1/admin/fabrix-models/{a['id']}", json={"isEnabled": False}, headers=admin_headers)
        assert updated.status_code == 200
        assert updated.json()["isEnabled"] is False

        moved = client.post(f"/api/v1/admin/fabrix-models/{b['id']}/move", json={"direction": "up"}, headers=admin_headers)
        assert moved.status_code == 200
        assert moved.json()["sortOrder"] == a["sortOrder"]

        # An LLM is switched off (above), never deleted — there is no delete route.
        assert client.delete(f"/api/v1/admin/fabrix-models/{a['id']}", headers=admin_headers).status_code == 405
        listed = client.get("/api/v1/admin/fabrix-models", headers=admin_headers).json()
        assert next(m for m in listed if m["id"] == a["id"])["isEnabled"] is False


def _provider_body(**overrides) -> dict:
    return {
        "name": f"Provider {uuid.uuid4().hex[:6]}",
        "baseUrl": "https://api.groq.com/openai/v1",
        "model": "openai/gpt-oss-120b",
        "apiKey": "gsk_secret",
        **overrides,
    }


class TestAiProviders:
    def test_add_provider_key_is_write_only_and_stored_encrypted(
        self, client: TestClient, admin_headers: dict, db_session: Session
    ):
        from app.models.ai_provider import AiProvider

        body = _provider_body(name="Groq - team key")
        resp = client.post("/api/v1/admin/ai-providers", json=body, headers=admin_headers)
        assert resp.status_code == 201, resp.text
        created = resp.json()
        assert created["name"] == "Groq - team key"
        assert created["isEnabled"] is True
        assert created["hasApiKey"] is True
        assert "apiKey" not in created and "apiKeyEnc" not in created

        row = db_session.get(AiProvider, created["id"])
        assert row.apiKeyEnc != "gsk_secret"
        assert decrypt_secret(row.apiKeyEnc) == "gsk_secret"

        listed = client.get("/api/v1/admin/ai-providers", headers=admin_headers).json()
        assert created["id"] in {p["id"] for p in listed}

    def test_several_providers_keep_their_own_names_and_creation_order(self, client: TestClient, admin_headers: dict):
        first = client.post("/api/v1/admin/ai-providers", json=_provider_body(name="First"), headers=admin_headers).json()
        second = client.post(
            "/api/v1/admin/ai-providers",
            json=_provider_body(name="Second", baseUrl="https://api.openai.com/v1/", model="gpt-4o-mini", apiKey="sk-other"),
            headers=admin_headers,
        ).json()
        assert second["sortOrder"] > first["sortOrder"]
        assert second["baseUrl"] == "https://api.openai.com/v1"  # trailing slash trimmed

    def test_base_url_may_be_pasted_with_the_chat_completions_suffix(self, client: TestClient, admin_headers: dict):
        resp = client.post(
            "/api/v1/admin/ai-providers",
            json=_provider_body(baseUrl="https://gateway.example.com/v1/chat/completions"),
            headers=admin_headers,
        )
        assert resp.status_code == 201
        assert resp.json()["baseUrl"] == "https://gateway.example.com/v1"

    def test_rejects_a_base_url_that_is_not_http(self, client: TestClient, admin_headers: dict):
        resp = client.post("/api/v1/admin/ai-providers", json=_provider_body(baseUrl="ftp://example.com"), headers=admin_headers)
        assert resp.status_code == 400

    def test_requires_name_model_and_key(self, client: TestClient, admin_headers: dict):
        for field in ("name", "model", "apiKey", "baseUrl"):
            resp = client.post("/api/v1/admin/ai-providers", json=_provider_body(**{field: "  "}), headers=admin_headers)
            assert resp.status_code == 400, field

    def test_update_renames_disables_and_keeps_the_key_when_none_is_sent(
        self, client: TestClient, admin_headers: dict, db_session: Session
    ):
        from app.models.ai_provider import AiProvider

        created = client.post("/api/v1/admin/ai-providers", json=_provider_body(), headers=admin_headers).json()
        resp = client.patch(
            f"/api/v1/admin/ai-providers/{created['id']}",
            json={"name": "Renamed", "isEnabled": False, "apiKey": ""},
            headers=admin_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "Renamed"
        assert resp.json()["isEnabled"] is False
        assert decrypt_secret(db_session.get(AiProvider, created["id"]).apiKeyEnc) == "gsk_secret"

        rotated = client.patch(f"/api/v1/admin/ai-providers/{created['id']}", json={"apiKey": "gsk_new"}, headers=admin_headers)
        assert rotated.status_code == 200
        db_session.expire_all()
        assert decrypt_secret(db_session.get(AiProvider, created["id"]).apiKeyEnc) == "gsk_new"

    def test_providers_cannot_be_deleted(self, client: TestClient, admin_headers: dict):
        created = client.post("/api/v1/admin/ai-providers", json=_provider_body(), headers=admin_headers).json()
        assert client.delete(f"/api/v1/admin/ai-providers/{created['id']}", headers=admin_headers).status_code == 405

    def test_unknown_provider_is_404(self, client: TestClient, admin_headers: dict):
        missing = "00000000-0000-0000-0000-000000000000"
        assert client.patch(f"/api/v1/admin/ai-providers/{missing}", json={"name": "x"}, headers=admin_headers).status_code == 404
        assert client.post(f"/api/v1/admin/ai-providers/{missing}/test", headers=admin_headers).status_code == 404

    def test_non_admin_forbidden(self, client: TestClient, standard_headers: dict):
        assert client.get("/api/v1/admin/ai-providers", headers=standard_headers).status_code == 403
        assert client.post("/api/v1/admin/ai-providers", json=_provider_body(), headers=standard_headers).status_code == 403


class TestAiProviderFallback:
    """`aiProviderService.send_message`: FabriX first, then every enabled other provider in order."""

    def _configs(self):
        from app.services.ai_providers_service import ProviderConfig

        return [
            ProviderConfig(id="1", name="One", baseUrl="https://one.example/v1", model="m1", apiKey="k1"),
            ProviderConfig(id="2", name="Two", baseUrl="https://two.example/v1", model="m2", apiKey="k2"),
        ]

    def _run(self, monkeypatch, fabrix_result, provider_results, configs):
        import asyncio

        from app.services import ai_providers_service, aiProviderService, fabrixAIService, openaiCompatAIService

        called: list[str] = []

        async def fake_fabrix(request, db):
            called.append("fabrix")
            return fabrix_result

        async def fake_provider(request, provider):
            called.append(provider.name)
            return provider_results[provider.name]

        monkeypatch.setattr(fabrixAIService, "send_message", fake_fabrix)
        monkeypatch.setattr(openaiCompatAIService, "send_message", fake_provider)
        monkeypatch.setattr(ai_providers_service, "list_enabled_provider_configs", lambda db: configs)
        result = asyncio.run(aiProviderService.send_message({"messages": []}, None))
        return result, called

    def test_fabrix_answering_means_no_other_provider_is_called(self, monkeypatch):
        result, called = self._run(monkeypatch, {"ok": True, "replyText": "fabrix"}, {}, self._configs())
        assert result["replyText"] == "fabrix"
        assert called == ["fabrix"]

    def test_falls_through_the_providers_in_order_until_one_answers(self, monkeypatch):
        result, called = self._run(
            monkeypatch,
            {"ok": False, "error": "fabrix down"},
            {"One": {"ok": False, "error": "one down"}, "Two": {"ok": True, "replyText": "two"}},
            self._configs(),
        )
        assert result["replyText"] == "two"
        assert called == ["fabrix", "One", "Two"]

    def test_every_provider_failing_returns_fabrixs_error(self, monkeypatch):
        result, called = self._run(
            monkeypatch,
            {"ok": False, "error": "fabrix down"},
            {"One": {"ok": False, "error": "a"}, "Two": {"ok": False, "error": "b"}},
            self._configs(),
        )
        assert result == {"ok": False, "error": "fabrix down"}
        assert called == ["fabrix", "One", "Two"]

    def test_only_enabled_providers_with_a_key_are_considered(self, db_session: Session):
        from app.models.ai_provider import AiProvider
        from app.security.secret_cipher import encrypt_secret
        from app.services.ai_providers_service import list_enabled_provider_configs

        # Whatever providers already exist in this shared dev DB, ours must come out in order and only when enabled.
        base = max((p.sortOrder for p in db_session.execute(select(AiProvider)).scalars()), default=0) + 10
        for offset, (name, enabled) in enumerate([("t-off", False), ("t-a", True), ("t-b", True)]):
            db_session.add(
                AiProvider(name=name, baseUrl="https://x.example/v1", model="m", apiKeyEnc=encrypt_secret("k"), isEnabled=enabled, sortOrder=base + offset)
            )
        db_session.commit()

        names = [c.name for c in list_enabled_provider_configs(db_session) if c.name.startswith("t-")]
        assert names == ["t-a", "t-b"]


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

    def test_reports_whether_the_key_file_exists(self, client: TestClient, admin_headers: dict, tmp_path):
        key_file = tmp_path / "test_key"
        key_file.write_text("not a real key")
        payload = {"host": "sftp.example.com", "username": "deploy", "remotePath": "/incoming"}

        found = client.patch(
            "/api/v1/admin/deployment-settings/staging",
            json={**payload, "privateKeyPath": str(key_file)},
            headers=admin_headers,
        ).json()
        assert found["staging"]["privateKeyPath"] == str(key_file)
        assert found["staging"]["privateKeyFound"] is True

        missing = client.patch(
            "/api/v1/admin/deployment-settings/staging",
            json={**payload, "privateKeyPath": str(tmp_path / "nope")},
            headers=admin_headers,
        ).json()
        assert missing["staging"]["privateKeyFound"] is False

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


class TestDkmsSettings:
    """DKMS has no secret field (no API key/token — just baseUrl + taskId),
    so unlike SMTP/FabriX/Groq there's nothing encrypted to round-trip here;
    these tests just cover the CRUD shape and validation."""

    def test_round_trip(self, client: TestClient, admin_headers: dict, db_session: Session):
        resp = client.patch(
            "/api/v1/admin/dkms-settings",
            json={"baseUrl": "http://dkms.example.com:6161/dkms/v1", "taskId": "999:test_task"},
            headers=admin_headers,
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["baseUrl"] == "http://dkms.example.com:6161/dkms/v1"
        assert body["taskId"] == "999:test_task"
        assert body["configured"] is True

        row = db_session.execute(select(AdminSetting).where(AdminSetting.key == "dkmsBaseUrl")).scalar_one()
        assert row.value == "http://dkms.example.com:6161/dkms/v1"  # stored in plaintext, not encrypted

        get_resp = client.get("/api/v1/admin/dkms-settings", headers=admin_headers)
        assert get_resp.status_code == 200
        assert get_resp.json()["taskId"] == "999:test_task"

    def test_base_url_normalizes_trailing_dkms_v1_segment(self, db_session: Session):
        from app.security.dkms_client import _base_url
        from app.services.dkms_settings_service import save_dkms_settings, get_dkms_settings, DkmsSettingsInput

        save_dkms_settings(db_session, DkmsSettingsInput(baseUrl="http://dkms.example.com:6161/dkms/v1", taskId="t"))
        resolved = get_dkms_settings(db_session)
        assert _base_url(resolved) == "http://dkms.example.com:6161"

    def test_missing_fields_rejected(self, client: TestClient, admin_headers: dict):
        resp = client.patch("/api/v1/admin/dkms-settings", json={"baseUrl": "", "taskId": "x"}, headers=admin_headers)
        assert resp.status_code == 400

    def test_non_admin_forbidden(self, client: TestClient, standard_headers: dict):
        resp = client.get("/api/v1/admin/dkms-settings", headers=standard_headers)
        assert resp.status_code == 403
