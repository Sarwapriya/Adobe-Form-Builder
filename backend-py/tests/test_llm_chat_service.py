"""llmChatService: the AI chatbot's only LLM client (mocked Groq and OpenAI APIs)."""

from __future__ import annotations

import asyncio
import json

import httpx
import pytest

from app.services import llmChatService as groq
from app.services.ai_providers_service import ProviderConfig

TOOLS = [{"type": "function", "function": {"name": "search_previous_campaigns", "parameters": {"type": "object", "properties": {}}}}]


def _provider(model: str = "openai/gpt-oss-120b") -> ProviderConfig:
    return ProviderConfig(id="p", name="Groq", baseUrl="https://api.groq.com/openai/v1", model=model, apiKey="secret-key")


def _ok(message: dict, usage: int = 10) -> httpx.Response:
    return httpx.Response(200, json={"choices": [{"finish_reason": "stop", "message": message}], "model": "openai/gpt-oss-120b", "usage": {"total_tokens": usage}})


@pytest.fixture
def groq_api(monkeypatch):
    """Queue of responses the fake Groq endpoint returns, plus every request body it received."""
    responses: list[httpx.Response] = []
    requests: list[dict] = []
    sleeps: list[float] = []

    def handler(request: httpx.Request) -> httpx.Response:
        assert str(request.url) == "https://api.groq.com/openai/v1/chat/completions"
        requests.append({"body": json.loads(request.content), "auth": request.headers.get("authorization")})
        return responses.pop(0)

    real_client = httpx.AsyncClient
    monkeypatch.setattr(groq.httpx, "AsyncClient", lambda **kw: real_client(transport=httpx.MockTransport(handler), **kw))

    async def fake_sleep(seconds):
        sleeps.append(seconds)

    monkeypatch.setattr(groq, "_sleep", fake_sleep)
    return responses, requests, sleeps


def _chat(tools=TOOLS, model="openai/gpt-oss-120b"):
    return asyncio.run(groq.chat(_provider(model), [{"role": "user", "content": "hi"}], tools))


def test_plain_answer(groq_api):
    responses, requests, _ = groq_api
    responses.append(_ok({"role": "assistant", "content": "Hello!"}))
    result = _chat()
    assert result["ok"] and result["content"] == "Hello!" and result["toolCalls"] == []
    body = requests[0]["body"]
    assert body["model"] == "openai/gpt-oss-120b"  # from the provider configuration, not hard-coded
    assert body["include_reasoning"] is False  # raw reasoning never comes back
    assert body["tools"] == TOOLS and body["tool_choice"] == "auto"
    assert requests[0]["auth"] == "Bearer secret-key"


def test_model_is_read_from_configuration(groq_api):
    responses, requests, _ = groq_api
    responses.append(_ok({"role": "assistant", "content": "x"}))
    _chat(model="openai/gpt-oss-20b")
    assert requests[0]["body"]["model"] == "openai/gpt-oss-20b"


def test_tool_calls_are_returned_for_local_execution(groq_api):
    responses, _, _ = groq_api
    responses.append(_ok({"role": "assistant", "content": None, "tool_calls": [
        {"id": "call_1", "type": "function", "function": {"name": "search_previous_campaigns", "arguments": '{"query":"hr"}'}},
    ]}))
    result = _chat()
    assert result["toolCalls"] == [{"id": "call_1", "name": "search_previous_campaigns", "arguments": '{"query":"hr"}'}]


@pytest.mark.parametrize("bad_tool", [
    {"type": "mcp", "server_label": "x", "server_url": "https://mcp.example"},
    {"type": "browser_search"},
    {"type": "code_interpreter"},
    {"type": "function", "function": {"name": "x", "server_url": "https://mcp.example"}},
])
def test_remote_mcp_and_builtin_tools_are_never_sent(groq_api, bad_tool):
    _responses, requests, _ = groq_api
    with pytest.raises(groq.ToolConfigurationError):
        _chat(tools=[bad_tool])
    assert requests == []


def test_rate_limit_is_retried_with_backoff_then_succeeds(groq_api):
    responses, requests, sleeps = groq_api
    responses.append(httpx.Response(429, headers={"retry-after": "3"}, text="rate limited"))
    responses.append(httpx.Response(429, text="Please try again in 1.5s."))
    responses.append(_ok({"role": "assistant", "content": "done"}))
    result = _chat()
    assert result["ok"] and result["content"] == "done"
    assert sleeps == [3.0, 1.5] and len(requests) == 3


def test_persistent_rate_limit_fails_gracefully(groq_api):
    responses, requests, _ = groq_api
    responses.extend([httpx.Response(429, headers={"retry-after": "1"}, text="x") for _ in range(3)])
    result = _chat()
    assert result == {"ok": False, "kind": "rate_limit", "error": "Groq rate limit reached"}
    assert len(requests) == 3


def test_long_rate_limit_wait_fails_fast(groq_api):
    responses, requests, sleeps = groq_api
    responses.append(httpx.Response(429, headers={"retry-after": "45"}, text="x"))
    result = _chat()
    assert result["kind"] == "rate_limit" and sleeps == [] and len(requests) == 1


def test_server_error_retried(groq_api):
    responses, _, _ = groq_api
    responses.append(httpx.Response(503, text="unavailable"))
    responses.append(_ok({"role": "assistant", "content": "ok"}))
    assert _chat()["content"] == "ok"


def test_auth_error_not_retried_and_key_not_leaked(groq_api):
    responses, requests, _ = groq_api
    responses.append(httpx.Response(401, text="bad key"))
    result = _chat()
    assert result["kind"] == "auth" and len(requests) == 1
    assert "secret-key" not in json.dumps(result)


def test_invalid_tool_call_is_resampled(groq_api):
    responses, _, _ = groq_api
    responses.append(httpx.Response(400, text='{"error":{"code":"tool_use_failed"}}'))
    responses.append(_ok({"role": "assistant", "content": "ok"}))
    assert _chat()["content"] == "ok"


def test_empty_reply_is_retried(groq_api):
    responses, _, _ = groq_api
    responses.append(_ok({"role": "assistant", "content": ""}))
    responses.append(_ok({"role": "assistant", "content": "second try"}))
    assert _chat()["content"] == "second try"


def test_completion_budget_shrinks_with_the_prompt():
    small = groq.build_request_body(_provider(), [{"role": "user", "content": "hi"}])
    assert small["max_completion_tokens"] == groq.MAX_COMPLETION_TOKENS
    big = groq.build_request_body(_provider(), [{"role": "user", "content": "x" * (3 * 6500)}])
    assert groq.MIN_COMPLETION_TOKENS <= big["max_completion_tokens"] < groq.MAX_COMPLETION_TOKENS


def _openai_provider(model: str = "gpt-4.1-mini") -> ProviderConfig:
    return ProviderConfig(id="o", name="OpenAI", baseUrl="https://api.openai.com/v1", model=model, apiKey="secret-key")


def test_openai_body_omits_groq_only_parameters():
    body = groq.build_request_body(_openai_provider(), [{"role": "user", "content": "hi"}], TOOLS)
    assert body["model"] == "gpt-4.1-mini"
    assert "include_reasoning" not in body and "reasoning_effort" not in body
    assert body["tools"] == TOOLS and body["max_completion_tokens"] == groq.MAX_COMPLETION_TOKENS


def test_openai_reasoning_models_get_low_effort_only():
    body = groq.build_request_body(_openai_provider("gpt-5-mini"), [{"role": "user", "content": "hi"}])
    assert body["reasoning_effort"] == "low" and "include_reasoning" not in body
    chat_alias = groq.build_request_body(_openai_provider("gpt-5-chat-latest"), [{"role": "user", "content": "hi"}])
    assert "reasoning_effort" not in chat_alias


def test_openai_has_a_larger_token_budget_than_groq():
    assert groq.token_budget(_openai_provider()) > groq.token_budget(_provider())
    big = [{"role": "user", "content": "x" * (3 * 6500)}]
    assert groq.build_request_body(_openai_provider(), big)["max_completion_tokens"] == groq.MAX_COMPLETION_TOKENS


def test_openai_errors_are_labelled_openai(monkeypatch):
    def handler(request: httpx.Request) -> httpx.Response:
        assert str(request.url) == "https://api.openai.com/v1/chat/completions"
        return httpx.Response(401, text="bad key")

    real_client = httpx.AsyncClient
    monkeypatch.setattr(groq.httpx, "AsyncClient", lambda **kw: real_client(transport=httpx.MockTransport(handler), **kw))
    result = asyncio.run(groq.chat(_openai_provider(), [{"role": "user", "content": "hi"}]))
    assert result == {"ok": False, "kind": "auth", "error": "OpenAI rejected the configured API key"}
