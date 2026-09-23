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

import json
import time
from typing import Any
from urllib.parse import urlparse

import httpx

from app.services.ai_providers_service import ProviderConfig, chat_completions_url


GROQ_TOKENS_PER_MINUTE = 7600  # just under the 8000 TPM on-demand cap

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
        # The cap counts prompt + requested completion, so shrink the completion
        # budget as the prompt grows instead of asking for 4096 on top of a big prompt.
        prompt_tokens = sum(len(m["content"]) for m in messages) // 3
        body["max_completion_tokens"] = max(1024, min(4096, GROQ_TOKENS_PER_MINUTE - prompt_tokens))
        body["reasoning_effort"] = "low"
    elif host.endswith("openai.com"):
        body["max_completion_tokens"] = 4096
    else:
        # The widest-supported spelling among OpenAI-compatible servers; and no
        # vendor-specific extras, which other servers may reject outright.
        body["max_tokens"] = 4096
    return body


def _native_tool_call_as_fenced_json(message: dict[str, Any]) -> str | None:
    """This app never sends a `tools` parameter — tools are described in the
    system prompt and called by replying with a fenced ```json {"tool", "args"}```
    block (aiSystemPrompt.TOOL_CALL_CONVENTION). Models trained on native
    function calling (gpt-oss on Groq especially) still sometimes emit a real
    `tool_calls` entry with `content` empty, which would otherwise surface as
    "response did not include any text" on every lookup question. Rewrites the
    first such call into the text convention aiAssistantService already parses."""
    tool_calls = message.get("tool_calls") or []
    if not tool_calls:
        return None
    function = (tool_calls[0] or {}).get("function") or {}
    name = (function.get("name") or "").strip()
    # gpt-oss's harmony format namespaces calls as "functions.<NAME>".
    name = name.rsplit(".", 1)[-1]
    if not name:
        return None
    raw_args = function.get("arguments")
    try:
        args = json.loads(raw_args) if isinstance(raw_args, str) and raw_args.strip() else (raw_args or {})
    except (json.JSONDecodeError, ValueError):
        return None
    if not isinstance(args, dict):
        return None
    return "```json\n" + json.dumps({"tool": name, "args": args}) + "\n```"


# Empty-content failures (a reasoning-capable model like gpt-oss burning its
# whole completion budget on hidden chain-of-thought and never emitting a
# visible answer) are a stochastic side effect of sampling, not a persistent
# condition like a bad API key or a closed connection -- an immediate retry
# with the exact same request often succeeds outright. Every other failure
# (auth, rate limit, timeout, network, refusal) is retried zero times, since
# retrying those either can't help or actively makes things worse (burning
# more of a per-minute rate limit right after hitting it).
_RETRYABLE_EMPTY_CONTENT_ATTEMPTS = 2


async def _attempt(
    provider: ProviderConfig, messages: list[dict[str, str]], body: dict[str, Any], headers: dict[str, str], label: str
) -> dict[str, Any]:
    """One HTTP round trip + response parse. A dict with `_retryableEmptyContent: True`
    means the call itself succeeded but produced no visible text -- worth retrying;
    every other shape (success, or any other failure) is final."""
    started_at = time.time()
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(chat_completions_url(provider), json=body, headers=headers)
    except httpx.TimeoutException:
        return {"ok": False, "error": f"{label} request timed out"}
    except httpx.HTTPError as exc:
        # Typically the host can't reach the provider at all (firewall / no outbound internet / DNS).
        return {"ok": False, "error": f"{label} request failed ({type(exc).__name__}): {exc}"}

    elapsed_ms = (time.time() - started_at) * 1000
    log_prefix = f"[openaiCompatAIService] provider={label!r} model={provider.model} durationMs={elapsed_ms:.0f}"

    if response.status_code == 401:
        print(f"{log_prefix} status=auth_error")
        return {"ok": False, "error": f"{label} authentication failed — check the API key."}
    if response.status_code == 429:
        # The body says which limit was hit (per-minute tokens vs. requests vs. daily) — keep it for the server log.
        print(f"{log_prefix} status=rate_limited detail={response.text[:300]!r}")
        return {"ok": False, "error": f"{label} rate limit exceeded — try again shortly. ({response.text[:300]})"}
    if response.status_code != 200:
        print(f"{log_prefix} status=error httpStatus={response.status_code} detail={response.text[:300]!r}")
        return {"ok": False, "error": f"{label} error ({response.status_code}): {response.text[:500]}"}

    try:
        payload = response.json()
    except Exception:
        return {"ok": False, "error": f"{label} returned a non-JSON response"}

    choices = payload.get("choices") or []
    if not choices:
        return {"ok": False, "error": f"{label} response did not include any choices"}

    finish_reason = choices[0].get("finish_reason")
    message = choices[0].get("message") or {}
    content = message.get("content")
    if not content:
        content = _native_tool_call_as_fenced_json(message)
        if content:
            print(f"{log_prefix} status=ok_native_tool_call finishReason={finish_reason}")
    if not content:
        if finish_reason == "content_filter":
            print(f"{log_prefix} status=refusal")
            return {"ok": False, "error": f"{label} declined to respond to this request."}
        if finish_reason == "length":
            # Reasoning-capable models (gpt-oss on Groq, etc.) emit hidden
            # chain-of-thought tokens before the real answer, counted against
            # the same completion budget _build_body computed above — on a
            # long conversation (more history/campaign-context turns already
            # eating into the prompt side of Groq's combined TPM cap), that
            # budget can be small enough that the model exhausts it on
            # reasoning alone and never emits a single visible token.
            print(f"{log_prefix} status=empty_length maxCompletionTokens={body.get('max_completion_tokens') or body.get('max_tokens')}")
            return {
                "ok": False,
                "_retryableEmptyContent": True,
                "error": f"{label} ran out of its response budget before producing any visible text "
                         "(likely spent it on internal reasoning) — try a shorter question or a shorter conversation.",
            }
        print(f"{log_prefix} status=empty_content finishReason={finish_reason} messageKeys={sorted(message.keys())}")
        return {"ok": False, "_retryableEmptyContent": True, "error": f"{label} response did not include any text"}

    usage = payload.get("usage") or {}
    print(f"{log_prefix} status=ok")
    return {
        "ok": True,
        "replyText": content,
        "model": payload.get("model", provider.model),
        "tokenUsage": usage.get("total_tokens", 0),
    }


async def send_message(request: dict[str, Any], provider: ProviderConfig) -> dict[str, Any]:
    """Sends one conversation turn to `provider` and returns its reply,
    retrying up to `_RETRYABLE_EMPTY_CONTENT_ATTEMPTS` times total when the
    model produces no visible text (see `_attempt`'s docstring)."""
    label = provider.name
    messages = [{"role": _to_chat_role(m["role"]), "content": m["content"]} for m in request["messages"]]
    body = _build_body(provider, messages)
    headers = {"Authorization": f"Bearer {provider.apiKey}", "Content-Type": "application/json"}

    result = await _attempt(provider, messages, body, headers, label)
    attempt = 1
    while result.get("_retryableEmptyContent") and attempt < _RETRYABLE_EMPTY_CONTENT_ATTEMPTS:
        attempt += 1
        print(f"[openaiCompatAIService] provider={label!r} got no visible text on attempt {attempt - 1} — retrying (attempt {attempt}/{_RETRYABLE_EMPTY_CONTENT_ATTEMPTS})")
        result = await _attempt(provider, messages, body, headers, label)

    result.pop("_retryableEmptyContent", None)
    return result
