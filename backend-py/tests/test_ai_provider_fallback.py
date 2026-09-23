"""`openaiCompatAIService.send_message` — now only behind the admin "Send test
message" button for provider rows (the chatbot uses llmChatService):

1. An empty reply with `finish_reason == "length"` (a reasoning model spending
   its whole budget on hidden reasoning) gets a distinct, actionable error.
2. Empty replies are retried once, since they're a stochastic side effect of
   sampling rather than a persistent condition.
"""

from __future__ import annotations

import asyncio

import httpx

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
