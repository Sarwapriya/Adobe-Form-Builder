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


def test_tool_call_recovered_from_reasoning(monkeypatch):
    reasoning = 'User wants HR questions. Use SEARCH_QUESTIONS.\n{"tool": "SEARCH_QUESTIONS", "args": {"searchText": "HR"}}'
    result = _run_with_response(monkeypatch, {"choices": [{
        "finish_reason": "stop", "message": {"role": "assistant", "content": "", "reasoning": reasoning},
    }]})
    assert result["ok"] is True
    assert _extract_tool_call(result["replyText"])["call"] == {"tool": "SEARCH_QUESTIONS", "args": {"searchText": "HR"}}


def test_harmony_functions_prefix_recovered_from_reasoning(monkeypatch):
    reasoning = 'Need to search. to=functions.SEARCH_QUESTIONS json {"searchText": "hand raiser"}'
    result = _run_with_response(monkeypatch, {"choices": [{
        "finish_reason": "stop", "message": {"role": "assistant", "content": "", "reasoning": reasoning},
    }]})
    assert _extract_tool_call(result["replyText"])["call"] == {"tool": "SEARCH_QUESTIONS", "args": {"searchText": "hand raiser"}}


def test_empty_reply_retry_adds_nudge_turn(monkeypatch):
    seen: list[list[dict]] = []

    def handler(request: httpx.Request) -> httpx.Response:
        body = json.loads(request.content)
        seen.append(body["messages"])
        content = "" if len(seen) == 1 else "Here are some HR question ideas."
        return httpx.Response(200, json={"choices": [{"finish_reason": "stop", "message": {"role": "assistant", "content": content, "reasoning": "thinking"}}]})

    real_client = httpx.AsyncClient
    monkeypatch.setattr(openaiCompatAIService.httpx, "AsyncClient", lambda **kw: real_client(transport=httpx.MockTransport(handler), **kw))
    result = asyncio.run(openaiCompatAIService.send_message({"messages": [{"role": "user", "content": "hi"}]}, _provider()))
    assert result == {"ok": True, "replyText": "Here are some HR question ideas.", "model": "openai/gpt-oss-120b", "tokenUsage": 0}
    assert len(seen) == 2 and len(seen[1]) == len(seen[0]) + 1
    assert seen[1][-1]["content"] == openaiCompatAIService._EMPTY_REPLY_NUDGE
