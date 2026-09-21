"""Talks to any OpenAI-compatible chat completions API (Groq, OpenAI, Together,
a self-hosted gateway, ...) — one call to `<baseUrl>/chat/completions` for one
`ProviderConfig` (see `ai_providers_service.py`). Same result contract as
`fabrixAIService.py`: takes `request["messages"]` (a flat list of `{role,
content}` turns, `role` one of "system"/"user"/"assistant"/"tool") and returns
`{ok, replyText, model, tokenUsage}`, or a structured `{ok: False, error}`.
Never raises. Uses `httpx` (already a dependency), not a vendor SDK, since each
call is a single JSON POST.
"""

from __future__ import annotations

import time
from typing import Any
from urllib.parse import urlparse

import httpx

from app.services.ai_providers_service import ProviderConfig, chat_completions_url


def _to_chat_role(role: str) -> str:
    # This codebase's "tool" role is a synthetic turn injecting tool-call
    # results back into the conversation, not a real tool_call_id-linked
    # OpenAI tool message — folded into "user" instead.
    if role in ("system", "assistant"):
        return role
    return "user"


def _host(provider: ProviderConfig) -> str:
    return (urlparse(provider.baseUrl).hostname or "").lower()


def _build_body(provider: ProviderConfig, messages: list[dict[str, str]]) -> dict[str, Any]:
    host = _host(provider)
    body: dict[str, Any] = {"model": provider.model, "messages": messages}
    if host.endswith("groq.com"):
        # Groq's free/on_demand tier caps requests at 8000 tokens-per-minute
        # combined prompt+completion, and this app's system prompt plus
        # campaign-context turns already run several thousand tokens, so the
        # completion budget stays modest. gpt-oss (and other reasoning-capable
        # Groq models) emit hidden chain-of-thought before the real answer —
        # left at the default effort that alone could eat the whole budget
        # (`finish_reason: "length"` with `content` still empty), so it is
        # pinned low.
        body["max_completion_tokens"] = 4096
        body["reasoning_effort"] = "low"
    elif host.endswith("openai.com"):
        body["max_completion_tokens"] = 4096
    else:
        # The widest-supported spelling among OpenAI-compatible servers; and no
        # vendor-specific extras, which other servers may reject outright.
        body["max_tokens"] = 4096
    return body


async def send_message(request: dict[str, Any], provider: ProviderConfig) -> dict[str, Any]:
    """Sends one conversation turn to `provider` and returns its reply."""
    label = provider.name
    messages = [{"role": _to_chat_role(m["role"]), "content": m["content"]} for m in request["messages"]]
    body = _build_body(provider, messages)
    headers = {"Authorization": f"Bearer {provider.apiKey}", "Content-Type": "application/json"}

    started_at = time.time()
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(chat_completions_url(provider), json=body, headers=headers)
    except httpx.TimeoutException:
        return {"ok": False, "error": f"{label} request timed out"}
    except httpx.HTTPError as exc:
        return {"ok": False, "error": f"{label} request failed: {exc}"}

    elapsed_ms = (time.time() - started_at) * 1000
    log_prefix = f"[openaiCompatAIService] provider={label!r} model={provider.model} durationMs={elapsed_ms:.0f}"

    if response.status_code == 401:
        print(f"{log_prefix} status=auth_error")
        return {"ok": False, "error": f"{label} authentication failed — check the API key."}
    if response.status_code == 429:
        print(f"{log_prefix} status=rate_limited")
        return {"ok": False, "error": f"{label} rate limit exceeded — try again shortly."}
    if response.status_code != 200:
        print(f"{log_prefix} status=error httpStatus={response.status_code}")
        return {"ok": False, "error": f"{label} error ({response.status_code}): {response.text[:500]}"}

    try:
        payload = response.json()
    except Exception:
        return {"ok": False, "error": f"{label} returned a non-JSON response"}

    choices = payload.get("choices") or []
    if not choices:
        return {"ok": False, "error": f"{label} response did not include any choices"}

    finish_reason = choices[0].get("finish_reason")
    content = (choices[0].get("message") or {}).get("content")
    if not content:
        if finish_reason == "content_filter":
            print(f"{log_prefix} status=refusal")
            return {"ok": False, "error": f"{label} declined to respond to this request."}
        return {"ok": False, "error": f"{label} response did not include any text"}

    usage = payload.get("usage") or {}
    print(f"{log_prefix} status=ok")
    return {
        "ok": True,
        "replyText": content,
        "model": payload.get("model", provider.model),
        "tokenUsage": usage.get("total_tokens", 0),
    }
