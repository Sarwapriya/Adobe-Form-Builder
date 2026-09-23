"""`ai_providers_service._env_fallback_provider_configs` -- used only when the
`fq.AiProviders` table has zero rows, so a deployment that was only ever
configured through env vars keeps working. Mirrors the legacy GROQ_* pattern
for OPENROUTER_*, preferring OpenRouter first when both are configured, since
it isn't a hidden-reasoning model the way Groq's default (openai/gpt-oss-120b)
is -- see tests/test_ai_provider_fallback.py for why that distinction matters.
"""

from __future__ import annotations

from app.services import ai_providers_service as svc


def _clear(monkeypatch):
    monkeypatch.setattr(svc.env_settings, "OPENROUTER_API_KEY", None)
    monkeypatch.setattr(svc.env_settings, "OPENROUTER_ENABLED", True)
    monkeypatch.setattr(svc.env_settings, "OPENROUTER_MODEL", "openai/gpt-4o")
    monkeypatch.setattr(svc.env_settings, "GROQ_API_KEY", None)
    monkeypatch.setattr(svc.env_settings, "GROQ_ENABLED", True)
    monkeypatch.setattr(svc.env_settings, "GROQ_MODEL", "openai/gpt-oss-120b")


def test_neither_configured_returns_nothing(monkeypatch):
    _clear(monkeypatch)
    assert svc._env_fallback_provider_configs() == []


def test_only_groq_configured(monkeypatch):
    _clear(monkeypatch)
    monkeypatch.setattr(svc.env_settings, "GROQ_API_KEY", "gk")
    configs = svc._env_fallback_provider_configs()
    assert [c.name for c in configs] == ["Groq"]
    assert configs[0].baseUrl == svc.DEFAULT_GROQ_BASE_URL
    assert configs[0].apiKey == "gk"


def test_only_openrouter_configured(monkeypatch):
    _clear(monkeypatch)
    monkeypatch.setattr(svc.env_settings, "OPENROUTER_API_KEY", "ork")
    configs = svc._env_fallback_provider_configs()
    assert [c.name for c in configs] == ["OpenRouter"]
    assert configs[0].baseUrl == svc.DEFAULT_OPENROUTER_BASE_URL
    assert configs[0].model == "openai/gpt-4o"
    assert configs[0].apiKey == "ork"


def test_both_configured_prefers_openrouter_first(monkeypatch):
    _clear(monkeypatch)
    monkeypatch.setattr(svc.env_settings, "OPENROUTER_API_KEY", "ork")
    monkeypatch.setattr(svc.env_settings, "GROQ_API_KEY", "gk")
    configs = svc._env_fallback_provider_configs()
    assert [c.name for c in configs] == ["OpenRouter", "Groq"]


def test_disabled_flag_excludes_a_configured_provider(monkeypatch):
    _clear(monkeypatch)
    monkeypatch.setattr(svc.env_settings, "OPENROUTER_API_KEY", "ork")
    monkeypatch.setattr(svc.env_settings, "OPENROUTER_ENABLED", False)
    monkeypatch.setattr(svc.env_settings, "GROQ_API_KEY", "gk")
    configs = svc._env_fallback_provider_configs()
    assert [c.name for c in configs] == ["Groq"]


def test_list_enabled_provider_configs_uses_env_fallback_only_when_db_has_no_rows(monkeypatch):
    _clear(monkeypatch)
    monkeypatch.setattr(svc.env_settings, "OPENROUTER_API_KEY", "ork")
    monkeypatch.setattr(svc, "list_ai_providers", lambda db: [])

    configs = svc.list_enabled_provider_configs(db=None)

    assert [c.name for c in configs] == ["OpenRouter"]
