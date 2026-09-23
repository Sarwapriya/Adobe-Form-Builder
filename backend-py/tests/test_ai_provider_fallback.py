"""Three related AI-provider bugs surfaced together in production once FabriX
was deliberately disabled and Groq became the sole active provider:

1. `openaiCompatAIService.send_message` reported a bare, useless "response
   did not include any text" whenever a reasoning-capable Groq model (e.g.
   gpt-oss) burned its whole completion-token budget on hidden chain-of-
   thought before emitting any visible answer (`finish_reason == "length"`
   with empty `content`) -- a real, reproducible failure mode the code's own
   comments already anticipated but never surfaced distinctly in the log.

2. `aiProviderService.send_message` always returned FabriX's own (stale,
   "disabled") error as the final failure once every other provider had also
   been tried and failed -- hiding the real, and often actionable, reason
   the actually-active provider (Groq) just failed for.

3. Empty-content responses (both the `finish_reason == "length"` case above
   and the plain "finished with `stop` but content is still empty" case seen
   in production, where gpt-oss's hidden reasoning ran to completion without
   ever producing a visible answer) are a stochastic side effect of sampling,
   not a persistent condition -- an immediate retry with the identical
   request frequently succeeds. With Groq as the sole active provider (no
   other provider for `aiProviderService` to fall back to), that retry has
   to happen inside `openaiCompatAIService.send_message` itself.
"""

from __future__ import annotations

import asyncio
from types import SimpleNamespace

import httpx

from app.services import aiProviderService
from app.services.ai_providers_service import ProviderConfig
from app.services.openaiCompatAIService import send_message


def _groq() -> ProviderConfig:
    return ProviderConfig(id="1", name="Groq", baseUrl="https://api.groq.com/openai/v1", model="openai/gpt-oss-120b", apiKey="k")


class _FakeResponse:
    def __init__(self, status_code: int, json_data=None, text: str = ""):
        self.status_code = status_code
        self._json = json_data
        self.text = text

    def json(self):
        return self._json


def test_empty_content_with_length_finish_reason_gives_an_actionable_error(monkeypatch):
    calls = {"n": 0}

    async def fake_post(self, url, json=None, headers=None):
        calls["n"] += 1
        return _FakeResponse(200, {"choices": [{"finish_reason": "length", "message": {"content": ""}}], "model": "x"})

    monkeypatch.setattr(httpx.AsyncClient, "post", fake_post)

    result = asyncio.run(send_message({"messages": [{"role": "user", "content": "hi"}]}, _groq()))

    assert result["ok"] is False
    assert "response budget" in result["error"] or "reasoning" in result["error"]
    # Not the old generic, undiagnosable message.
    assert result["error"] != "Groq response did not include any text"
    # Retried once (the empty-content failure mode is retryable) before giving up.
    assert calls["n"] == 2
    # The internal retry marker never leaks out to the caller.
    assert "_retryableEmptyContent" not in result


def test_empty_content_recovers_on_retry(monkeypatch):
    """The exact scenario reported in production: the model returns no
    visible text on the first attempt but succeeds on an identical retry."""
    calls = {"n": 0}

    async def fake_post(self, url, json=None, headers=None):
        calls["n"] += 1
        if calls["n"] == 1:
            return _FakeResponse(200, {"choices": [{"finish_reason": "stop", "message": {"content": ""}}], "model": "x"})
        return _FakeResponse(
            200,
            {
                "choices": [{"finish_reason": "stop", "message": {"content": "Here are some campaign questions..."}}],
                "model": "openai/gpt-oss-120b",
                "usage": {"total_tokens": 42},
            },
        )

    monkeypatch.setattr(httpx.AsyncClient, "post", fake_post)

    result = asyncio.run(send_message({"messages": [{"role": "user", "content": "hi"}]}, _groq()))

    assert calls["n"] == 2
    assert result == {"ok": True, "replyText": "Here are some campaign questions...", "model": "openai/gpt-oss-120b", "tokenUsage": 42}


def test_empty_content_without_length_finish_reason_keeps_generic_message(monkeypatch):
    async def fake_post(self, url, json=None, headers=None):
        return _FakeResponse(200, {"choices": [{"finish_reason": "stop", "message": {"content": ""}}], "model": "x"})

    monkeypatch.setattr(httpx.AsyncClient, "post", fake_post)

    result = asyncio.run(send_message({"messages": [{"role": "user", "content": "hi"}]}, _groq()))

    assert result["ok"] is False
    assert result["error"] == "Groq response did not include any text"


def test_send_message_surfaces_the_real_last_failure_not_stale_fabrix_error(monkeypatch):
    async def fake_fabrix(request, db):
        return {"ok": False, "error": "FabriXAI is disabled"}

    async def fake_provider(request, provider):
        return {"ok": False, "error": "Groq ran out of its response budget before producing any visible text"}

    def fake_list_providers(db):
        return [SimpleNamespace(name="Groq")]

    monkeypatch.setattr("app.services.fabrixAIService.send_message", fake_fabrix)
    monkeypatch.setattr("app.services.openaiCompatAIService.send_message", fake_provider)
    monkeypatch.setattr("app.services.ai_providers_service.list_enabled_provider_configs", fake_list_providers)

    result = asyncio.run(aiProviderService.send_message({"messages": []}, db=None))

    assert result["ok"] is False
    assert result["error"] == "Groq ran out of its response budget before producing any visible text"
    assert result["error"] != "FabriXAI is disabled"


def test_send_message_falls_back_to_fabrix_error_when_no_other_provider_is_enabled(monkeypatch):
    async def fake_fabrix(request, db):
        return {"ok": False, "error": "FabriXAI is disabled"}

    monkeypatch.setattr("app.services.fabrixAIService.send_message", fake_fabrix)
    monkeypatch.setattr("app.services.ai_providers_service.list_enabled_provider_configs", lambda db: [])

    result = asyncio.run(aiProviderService.send_message({"messages": []}, db=None))

    assert result == {"ok": False, "error": "FabriXAI is disabled"}
