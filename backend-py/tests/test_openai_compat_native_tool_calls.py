"""openaiCompatAIService must turn a native `tool_calls` reply (content empty)
into the app's fenced-JSON tool-call convention instead of failing."""

import asyncio
import json
from typing import Any

import httpx

from app.services import openaiCompatAIService
from app.services.ai_providers_service import ProviderConfig
from app.services.aiAssistantService import _extract_tool_call


def _provider() -> ProviderConfig:
    return ProviderConfig(id="p1", name="Groq", baseUrl="https://api.groq.com/openai/v1", model="openai/gpt-oss-120b", apiKey="k")


def _run_with_response(monkeypatch, payload: dict[str, Any]) -> dict[str, Any]:
    transport = httpx.MockTransport(lambda request: httpx.Response(200, json=payload))
    real_client = httpx.AsyncClient
    monkeypatch.setattr(openaiCompatAIService.httpx, "AsyncClient", lambda **kw: real_client(transport=transport, **kw))
    return asyncio.run(openaiCompatAIService.send_message({"messages": [{"role": "user", "content": "hi"}]}, _provider()))


def test_native_tool_call_becomes_fenced_json(monkeypatch):
    result = _run_with_response(monkeypatch, {"choices": [{
        "finish_reason": "tool_calls",
        "message": {"role": "assistant", "content": None, "tool_calls": [{
            "id": "c1", "type": "function",
            "function": {"name": "functions.SEARCH_QUESTIONS", "arguments": json.dumps({"searchText": "hand raiser"})},
        }]},
    }]})
    assert result["ok"] is True
    parsed = _extract_tool_call(result["replyText"])
    assert parsed["call"] == {"tool": "SEARCH_QUESTIONS", "args": {"searchText": "hand raiser"}}


def test_empty_content_without_tool_calls_still_fails(monkeypatch):
    result = _run_with_response(monkeypatch, {"choices": [{"finish_reason": "stop", "message": {"role": "assistant", "content": ""}}]})
    assert result["ok"] is False
    assert "_retryableEmptyContent" not in result
