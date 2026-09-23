"""The AI chatbot's only LLM client: an OpenAI-compatible chat completions API —
OpenAI (https://api.openai.com/v1) or Groq (https://api.groq.com/openai/v1) —
chosen by `ai_providers_service.get_chat_provider_config` (admin-managed
`fq.AiProviders` rows, else `OPENAI_*`/`GROQ_*` env). No SDK, one `httpx` POST.

Local tool calling only: `tools` may contain nothing but
`{"type": "function", ...}` definitions, which the backend executes itself
(`aiAssistantService`) — remote MCP (`type: "mcp"`) and vendor built-in tools
(web/browser search, code interpreter) are rejected before any request is
sent, since they would make the vendor's servers act without the backend's
user context and authorization.

Reasoning is never returned to the app (Groq: `include_reasoning: false`;
OpenAI's chat completions never return it), so hidden chain-of-thought can't
leak into a reply. 429s and transient 5xx responses are retried with backoff
(honouring `retry-after`); every failure comes back as `{ok: False, kind,
error}` and is never raised. Logs carry only status, timing and token counts —
never the API key or message contents.
"""

from __future__ import annotations

import asyncio
import json
import random
import re
import time
from typing import Any, Optional

import httpx

from app.services.ai_providers_service import ProviderConfig, chat_completions_url, is_groq_base_url

# Groq's on-demand tier caps combined prompt+completion tokens per minute.
GROQ_TOKENS_PER_MINUTE = 7600  # just under the 8000 TPM cap
# OpenAI's limits are far higher; this only bounds how much history a turn carries.
OPENAI_PROMPT_TOKEN_BUDGET = 24000
MIN_COMPLETION_TOKENS = 1024
MAX_COMPLETION_TOKENS = 3072
REQUEST_TIMEOUT_SECONDS = 45
MAX_ATTEMPTS = 3
# Waiting longer than this for a rate-limit window to reopen would leave the
# user staring at a spinner — fail fast with a friendly message instead.
MAX_RETRY_WAIT_SECONDS = 20.0
RETRYABLE_STATUSES = frozenset({429, 500, 502, 503, 504})

FORBIDDEN_TOOL_TYPES = frozenset({"mcp", "browser_search", "code_interpreter", "web_search"})


class ToolConfigurationError(ValueError):
    """A non-local tool definition was about to be sent to the LLM."""


def assert_local_function_tools(tools: Optional[list[dict[str, Any]]]) -> None:
    for tool in tools or []:
        tool_type = tool.get("type")
        if tool_type != "function" or tool_type in FORBIDDEN_TOOL_TYPES:
            raise ToolConfigurationError(f"only local function tools may be sent to the LLM, got {tool_type!r}")
        function = tool.get("function") or {}
        if not function.get("name") or "server_url" in tool or "server_url" in function:
            raise ToolConfigurationError("function tools must be plain local definitions")


def estimate_tokens(messages: list[dict[str, Any]], tools: Optional[list[dict[str, Any]]] = None) -> int:
    """Rough (chars / 3) estimate, deliberately pessimistic for mixed-language text."""
    chars = sum(len(m.get("content") or "") + len(json.dumps(m.get("tool_calls") or "")) for m in messages)
    chars += len(json.dumps(tools)) if tools else 0
    return chars // 3


def vendor_label(provider: ProviderConfig) -> str:
    return "Groq" if is_groq_base_url(provider.baseUrl) else "OpenAI"


def token_budget(provider: ProviderConfig) -> int:
    """Prompt + completion tokens one call may use: Groq's per-minute cap, or a
    generous context bound for OpenAI."""
    return GROQ_TOKENS_PER_MINUTE if is_groq_base_url(provider.baseUrl) else OPENAI_PROMPT_TOKEN_BUDGET


def _is_openai_reasoning_model(model: str) -> bool:
    """gpt-5* (except the *-chat-latest aliases) and the o-series accept
    `reasoning_effort`; gpt-4.x/gpt-4o reject it."""
    name = (model or "").lower()
    if re.match(r"^o\d", name):
        return True
    return name.startswith("gpt-5") and "chat" not in name


def _completion_budget(provider: ProviderConfig, messages: list[dict[str, Any]], tools: Optional[list[dict[str, Any]]]) -> int:
    return max(MIN_COMPLETION_TOKENS, min(MAX_COMPLETION_TOKENS, token_budget(provider) - estimate_tokens(messages, tools)))


def build_request_body(
    provider: ProviderConfig,
    messages: list[dict[str, Any]],
    tools: Optional[list[dict[str, Any]]] = None,
    *,
    tool_choice: str = "auto",
) -> dict[str, Any]:
    assert_local_function_tools(tools)
    body: dict[str, Any] = {
        "model": provider.model,
        "messages": messages,
        "max_completion_tokens": _completion_budget(provider, messages, tools),
    }
    if is_groq_base_url(provider.baseUrl):
        # gpt-oss: keep hidden reasoning short (it counts against the TPM
        # budget) and never send it back to us at all.
        body["reasoning_effort"] = "low"
        body["include_reasoning"] = False
    elif _is_openai_reasoning_model(provider.model):
        # OpenAI never returns reasoning from chat completions; just keep it short.
        body["reasoning_effort"] = "low"
    if tools:
        body["tools"] = tools
        body["tool_choice"] = tool_choice
    return body


_TRY_AGAIN_RE = re.compile(r"try again in (?:(\d+)m)?([\d.]+)s", re.IGNORECASE)


def _retry_after_seconds(response: httpx.Response, attempt: int) -> float:
    header = response.headers.get("retry-after")
    if header:
        try:
            return float(header)
        except ValueError:
            pass
    match = _TRY_AGAIN_RE.search(response.text or "")
    if match:
        return int(match.group(1) or 0) * 60 + float(match.group(2))
    return min(8.0, 2 ** (attempt - 1)) + random.uniform(0, 0.5)


def _parse_success(payload: dict[str, Any], provider: ProviderConfig) -> Optional[dict[str, Any]]:
    choices = payload.get("choices") or []
    if not choices:
        return None
    message = choices[0].get("message") or {}
    tool_calls = []
    for call in message.get("tool_calls") or []:
        function = call.get("function") or {}
        if call.get("type", "function") != "function" or not function.get("name"):
            continue
        tool_calls.append({
            "id": call.get("id") or f"call_{len(tool_calls)}",
            "name": function["name"],
            "arguments": function.get("arguments") or "{}",
        })
    content = message.get("content") or ""
    if not content.strip() and not tool_calls:
        return None
    return {
        "ok": True,
        "content": content,
        "toolCalls": tool_calls,
        "finishReason": choices[0].get("finish_reason"),
        "model": payload.get("model", provider.model),
        "tokenUsage": (payload.get("usage") or {}).get("total_tokens", 0),
    }


async def _sleep(seconds: float) -> None:
    await asyncio.sleep(seconds)


async def chat(
    provider: ProviderConfig,
    messages: list[dict[str, Any]],
    tools: Optional[list[dict[str, Any]]] = None,
    *,
    tool_choice: str = "auto",
) -> dict[str, Any]:
    """One chat completion (which may ask for tool calls). Returns
    `{ok: True, content, toolCalls: [{id, name, arguments}], model, tokenUsage}`
    or `{ok: False, kind: "rate_limit"|"auth"|"error", error}`."""
    body = build_request_body(provider, messages, tools, tool_choice=tool_choice)
    headers = {"Authorization": f"Bearer {provider.apiKey}", "Content-Type": "application/json"}
    vendor = vendor_label(provider)
    log_prefix = f"[llmChatService] vendor={vendor} model={provider.model}"

    last_failure: dict[str, Any] = {"ok": False, "kind": "error", "error": f"{vendor} request failed"}
    for attempt in range(1, MAX_ATTEMPTS + 1):
        started = time.time()
        try:
            async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT_SECONDS) as client:
                response = await client.post(chat_completions_url(provider), json=body, headers=headers)
        except httpx.TimeoutException:
            print(f"{log_prefix} attempt={attempt} status=timeout")
            last_failure = {"ok": False, "kind": "error", "error": f"{vendor} request timed out"}
            continue
        except httpx.HTTPError as exc:
            print(f"{log_prefix} attempt={attempt} status=network_error type={type(exc).__name__}")
            last_failure = {"ok": False, "kind": "error", "error": f"{vendor} could not be reached"}
            await _sleep(min(4.0, 2 ** (attempt - 1)))
            continue

        elapsed_ms = (time.time() - started) * 1000
        status = response.status_code
        if status == 200:
            try:
                parsed = _parse_success(response.json(), provider)
            except ValueError:
                parsed = None
            if parsed is not None:
                print(f"{log_prefix} attempt={attempt} status=ok durationMs={elapsed_ms:.0f} "
                      f"toolCalls={len(parsed['toolCalls'])} tokens={parsed['tokenUsage']}")
                return parsed
            print(f"{log_prefix} attempt={attempt} status=empty durationMs={elapsed_ms:.0f}")
            last_failure = {"ok": False, "kind": "error", "error": f"{vendor} returned an empty response"}
            continue

        if status == 401 or status == 403:
            print(f"{log_prefix} status=auth_error httpStatus={status}")
            return {"ok": False, "kind": "auth", "error": f"{vendor} rejected the configured API key"}

        if status == 400 and "tool_use_failed" in (response.text or ""):
            # The model produced a malformed tool call; a fresh sample usually doesn't.
            print(f"{log_prefix} attempt={attempt} status=tool_use_failed")
            last_failure = {"ok": False, "kind": "error", "error": f"{vendor} produced an invalid tool call"}
            continue

        if status in RETRYABLE_STATUSES:
            wait = _retry_after_seconds(response, attempt)
            kind = "rate_limit" if status == 429 else "error"
            print(f"{log_prefix} attempt={attempt} status={kind} httpStatus={status} retryAfterSeconds={wait:.1f}")
            last_failure = {"ok": False, "kind": kind, "error": f"{vendor} {'rate limit reached' if status == 429 else 'is temporarily unavailable'}"}
            if attempt < MAX_ATTEMPTS and wait <= MAX_RETRY_WAIT_SECONDS:
                await _sleep(wait)
                continue
            return last_failure

        print(f"{log_prefix} status=error httpStatus={status}")
        return {"ok": False, "kind": "error", "error": f"{vendor} request failed ({status})"}

    return last_failure
