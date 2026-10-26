"""`ai_providers_service._env_fallback_provider_configs` -- used only when the
`fq.AiProviders` table has zero rows, so a deployment that was only ever
configured through env vars keeps working. Groq (GROQ_*) is the chat
assistant's provider; OpenRouter (OPENROUTER_*) is only an optional second
fallback, listed after Groq when both are configured.
"""

from __future__ import annotations

from app.services import ai_providers_service as svc


def _clear(monkeypatch):
    monkeypatch.setattr(svc.env_settings, "OPENAI_API_KEY", None)
    monkeypatch.setattr(svc.env_settings, "OPENAI_ENABLED", True)
    monkeypatch.setattr(svc.env_settings, "OPENAI_MODEL", "gpt-4.1-mini")
    monkeypatch.setattr(svc.env_settings, "GROQ_API_KEY", None)
    monkeypatch.setattr(svc.env_settings, "GROQ_ENABLED", True)
    monkeypatch.setattr(svc.env_settings, "GROQ_MODEL", "openai/gpt-oss-120b")
    monkeypatch.setattr(svc.env_settings, "OPENROUTER_API_KEY", None)
    monkeypatch.setattr(svc.env_settings, "OPENROUTER_ENABLED", True)
    monkeypatch.setattr(svc.env_settings, "OPENROUTER_MODEL", "google/gemma-4-26b-a4b-it:free")
    monkeypatch.setattr(svc.env_settings, "AI_PROVIDER", None)
    monkeypatch.setattr(svc.env_settings, "AXHUB_AI_URL", None)
    monkeypatch.setattr(svc.env_settings, "AXHUB_AI_TOKEN", None)
    monkeypatch.setattr(svc.env_settings, "AXHUB_MODEL", "gemma-4-E2B")
    monkeypatch.setattr(svc.env_settings, "AXHUB_ENABLED", True)


def test_neither_configured_returns_nothing(monkeypatch):
    _clear(monkeypatch)
    assert svc._env_fallback_provider_configs() == []


def test_only_groq_configured(monkeypatch):
    _clear(monkeypatch)
    monkeypatch.setattr(svc.env_settings, "GROQ_API_KEY", "gk")
    configs = svc._env_fallback_provider_configs()
    assert [c.name for c in configs] == ["Groq"]
    assert configs[0].baseUrl == svc.DEFAULT_GROQ_BASE_URL
    assert configs[0].model == "openai/gpt-oss-120b"
    assert configs[0].apiKey == "gk"
    assert svc.chat_completions_url(configs[0]) == "https://api.groq.com/openai/v1/chat/completions"


def test_only_openrouter_configured(monkeypatch):
    _clear(monkeypatch)
    monkeypatch.setattr(svc.env_settings, "OPENROUTER_API_KEY", "ork")
    configs = svc._env_fallback_provider_configs()
    assert [c.name for c in configs] == ["OpenRouter"]
    assert configs[0].model == "google/gemma-4-26b-a4b-it:free"
    assert configs[0].apiKey == "ork"
    assert svc.chat_completions_url(configs[0]) == "https://openrouter.ai/api/v1/chat/completions"


def test_both_configured_prefers_groq_first(monkeypatch):
    _clear(monkeypatch)
    monkeypatch.setattr(svc.env_settings, "OPENROUTER_API_KEY", "ork")
    monkeypatch.setattr(svc.env_settings, "GROQ_API_KEY", "gk")
    configs = svc._env_fallback_provider_configs()
    assert [c.name for c in configs] == ["Groq", "OpenRouter"]


def test_disabled_flag_excludes_a_configured_provider(monkeypatch):
    _clear(monkeypatch)
    monkeypatch.setattr(svc.env_settings, "GROQ_API_KEY", "gk")
    monkeypatch.setattr(svc.env_settings, "GROQ_ENABLED", False)
    monkeypatch.setattr(svc.env_settings, "OPENROUTER_API_KEY", "ork")
    configs = svc._env_fallback_provider_configs()
    assert [c.name for c in configs] == ["OpenRouter"]


def test_list_enabled_provider_configs_uses_env_fallback_only_when_db_has_no_rows(monkeypatch):
    _clear(monkeypatch)
    monkeypatch.setattr(svc.env_settings, "GROQ_API_KEY", "gk")
    monkeypatch.setattr(svc, "list_ai_providers", lambda db: [])

    configs = svc.list_enabled_provider_configs(db=None)

    assert [c.name for c in configs] == ["Groq"]


# --- get_chat_provider_config: the chatbot's single provider -----------------

class _Row:
    def __init__(self, base_url, key="enc", enabled=True, model="m"):
        self.id, self.name, self.baseUrl, self.model = "r", "row", base_url, model
        self.apiKeyEnc, self.isEnabled = key, enabled


def _rows(monkeypatch, rows):
    monkeypatch.setattr(svc, "list_ai_providers", lambda db: rows)
    monkeypatch.setattr(svc, "decrypt_secret", lambda enc: "k-" + enc)


def test_chat_provider_prefers_openai_row_over_groq_row(monkeypatch):
    _clear(monkeypatch)
    _rows(monkeypatch, [_Row("https://api.groq.com/openai/v1"), _Row("https://api.openai.com/v1", model="gpt-4.1")])
    config = svc.get_chat_provider_config(None)
    assert config.baseUrl == "https://api.openai.com/v1" and config.model == "gpt-4.1"


def test_chat_provider_openai_env_beats_groq_row(monkeypatch):
    _clear(monkeypatch)
    _rows(monkeypatch, [_Row("https://api.groq.com/openai/v1")])
    monkeypatch.setattr(svc.env_settings, "OPENAI_API_KEY", "ok")
    config = svc.get_chat_provider_config(None)
    assert config.name == "OpenAI" and config.baseUrl == svc.DEFAULT_OPENAI_BASE_URL
    assert config.model == "gpt-4.1-mini" and config.apiKey == "ok"


def test_chat_provider_skips_disabled_openai_and_falls_back_to_groq(monkeypatch):
    _clear(monkeypatch)
    _rows(monkeypatch, [_Row("https://api.openai.com/v1", enabled=False), _Row("https://api.groq.com/openai/v1")])
    assert svc.get_chat_provider_config(None).baseUrl == "https://api.groq.com/openai/v1"


def test_chat_provider_never_uses_other_vendors(monkeypatch):
    _clear(monkeypatch)
    _rows(monkeypatch, [_Row("https://openrouter.ai/api/v1")])
    assert svc.get_chat_provider_config(None) is None


# --- AI_PROVIDER override: pins to exactly one vendor, no cross-fallback ----

def test_ai_provider_openai_ignores_an_available_groq_row(monkeypatch):
    _clear(monkeypatch)
    monkeypatch.setattr(svc.env_settings, "AI_PROVIDER", "openai")
    _rows(monkeypatch, [_Row("https://api.groq.com/openai/v1")])
    assert svc.get_chat_provider_config(None) is None  # no OpenAI configured, and no fallback to the Groq row


def test_ai_provider_groq_ignores_an_available_openai_row(monkeypatch):
    _clear(monkeypatch)
    monkeypatch.setattr(svc.env_settings, "AI_PROVIDER", "groq")
    _rows(monkeypatch, [_Row("https://api.openai.com/v1")])
    assert svc.get_chat_provider_config(None) is None  # no Groq configured, and no fallback to the OpenAI row


def test_ai_provider_groq_still_honors_env_key_when_pinned(monkeypatch):
    _clear(monkeypatch)
    monkeypatch.setattr(svc.env_settings, "AI_PROVIDER", "groq")
    monkeypatch.setattr(svc.env_settings, "GROQ_API_KEY", "gk")
    _rows(monkeypatch, [_Row("https://api.openai.com/v1")])
    config = svc.get_chat_provider_config(None)
    assert config.name == "Groq" and config.apiKey == "gk"


def test_ai_provider_axhub_selected_and_configured(monkeypatch):
    _clear(monkeypatch)
    monkeypatch.setattr(svc.env_settings, "AI_PROVIDER", "axhub-gemma4")
    monkeypatch.setattr(svc.env_settings, "AXHUB_AI_URL", "http://172.20.0.1:18081")
    monkeypatch.setattr(svc.env_settings, "AXHUB_AI_TOKEN", "")
    _rows(monkeypatch, [_Row("https://api.openai.com/v1"), _Row("https://api.groq.com/openai/v1")])
    config = svc.get_chat_provider_config(None)
    assert config.name == "AX Hub Gemma 4"
    assert config.baseUrl == "http://172.20.0.1:18081"
    assert config.model == "gemma-4-E2B"
    assert config.apiKey == ""
    assert svc.chat_completions_url(config) == "http://172.20.0.1:18081/chat/completions"


def test_ai_provider_axhub_selected_but_unconfigured_returns_none(monkeypatch):
    _clear(monkeypatch)
    monkeypatch.setattr(svc.env_settings, "AI_PROVIDER", "axhub-gemma4")
    monkeypatch.setattr(svc.env_settings, "OPENAI_API_KEY", "ok")  # must NOT be used as a fallback
    assert svc.get_chat_provider_config(None) is None


def test_ai_provider_axhub_respects_disabled_flag(monkeypatch):
    _clear(monkeypatch)
    monkeypatch.setattr(svc.env_settings, "AI_PROVIDER", "axhub-gemma4")
    monkeypatch.setattr(svc.env_settings, "AXHUB_AI_URL", "http://172.20.0.1:18081")
    monkeypatch.setattr(svc.env_settings, "AXHUB_ENABLED", False)
    assert svc.get_chat_provider_config(None) is None


def test_ai_provider_unknown_value_fails_closed_rather_than_auto_selecting(monkeypatch):
    _clear(monkeypatch)
    monkeypatch.setattr(svc.env_settings, "AI_PROVIDER", "some-typo")
    monkeypatch.setattr(svc.env_settings, "OPENAI_API_KEY", "ok")
    assert svc.get_chat_provider_config(None) is None


def test_is_axhub_base_url_matches_only_the_configured_host(monkeypatch):
    _clear(monkeypatch)
    monkeypatch.setattr(svc.env_settings, "AXHUB_AI_URL", "http://172.20.0.1:18081")
    assert svc.is_axhub_base_url("http://172.20.0.1:18081") is True
    assert svc.is_axhub_base_url("https://api.openai.com/v1") is False
    # Unconfigured AXHUB_AI_URL never matches anything (avoids an empty-host false positive).
    monkeypatch.setattr(svc.env_settings, "AXHUB_AI_URL", None)
    assert svc.is_axhub_base_url("http://172.20.0.1:18081") is False