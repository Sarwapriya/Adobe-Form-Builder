"""Talks to Groq's OpenAI-compatible chat completions API
(https://api.groq.com/openai/v1/chat/completions). Same `send_message`
contract as `claudeAIService.py`/`fabrixAIService.py` — takes
`request["messages"]` (a flat list of `{role, content}` turns, `role` one of
"system"/"user"/"assistant"/"tool") and returns `{ok, replyText, model,
tokenUsage}`, or a structured `{ok: False, error}`. Uses `httpx` (already a
dependency for `fabrixAIService.py`), not the separate `openai` SDK, to avoid
adding another dependency for what's a single JSON POST.
"""

from __future__ import annotations

import time
from typing import Any

import httpx

from app.services.groq_settings_service import get_groq_settings

GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions"


def _to_groq_role(role: str) -> str:
    # Groq's chat-completions API has no "tool" role in the sense this
    # codebase uses it (a synthetic turn injecting tool-call results back
    # into the conversation, not a real OpenAI tool-call response tied to a
    # tool_call_id) — folded into "user" like the "assistant"/other-role
    # normalization claudeAIService.py does for the Anthropic side.
    if role in ("system", "assistant"):
        return role
    return "user"


async def send_message(request: dict[str, Any], db: Any) -> dict[str, Any]:
    """Sends one conversation turn to Groq and returns its reply, or a
    structured ``{ok: False, error: ...}`` if the config is missing/disabled.
    Never raises."""
    settings = get_groq_settings(db)
    if settings is None:
        return {"ok": False, "error": "Groq is not configured"}
    if not settings.enabled:
        return {"ok": False, "error": "Groq is disabled"}

    messages = [{"role": _to_groq_role(m["role"]), "content": m["content"]} for m in request["messages"]]

    body = {
        "model": settings.model,
        "messages": messages,
        # Kept well under Claude's 8192 — Groq's free/on_demand tier caps
        # requests at 8000 tokens-per-minute *combined* prompt+completion
        # (see the account's actual limit surfaced in a 413 response), and
        # this app's system prompt + campaign-context turns alone can run
        # several thousand tokens, leaving little room if this were set any
        # higher.
        "max_completion_tokens": 2048,
    }
    headers = {
        "Authorization": f"Bearer {settings.apiKey}",
        "Content-Type": "application/json",
    }

    started_at = time.time()
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(GROQ_CHAT_COMPLETIONS_URL, json=body, headers=headers)
    except httpx.TimeoutException:
        return {"ok": False, "error": "Groq request timed out"}
    except httpx.HTTPError as exc:
        return {"ok": False, "error": f"Groq request failed: {exc}"}

    elapsed_ms = (time.time() - started_at) * 1000

    if response.status_code == 401:
        print(f"[groqAIService] model={settings.model} durationMs={elapsed_ms:.0f} status=auth_error")
        return {"ok": False, "error": "Groq authentication failed — check the API key."}
    if response.status_code == 429:
        print(f"[groqAIService] model={settings.model} durationMs={elapsed_ms:.0f} status=rate_limited")
        return {"ok": False, "error": "Groq rate limit exceeded — try again shortly."}
    if response.status_code != 200:
        detail = response.text[:500]
        print(f"[groqAIService] model={settings.model} durationMs={elapsed_ms:.0f} status=error httpStatus={response.status_code}")
        return {"ok": False, "error": f"Groq error ({response.status_code}): {detail}"}

    try:
        payload = response.json()
    except Exception:
        return {"ok": False, "error": "Groq returned a non-JSON response"}

    choices = payload.get("choices") or []
    if not choices:
        return {"ok": False, "error": "Groq response did not include any choices"}

    finish_reason = choices[0].get("finish_reason")
    content = (choices[0].get("message") or {}).get("content")
    if not content:
        if finish_reason == "content_filter":
            print(f"[groqAIService] model={settings.model} durationMs={elapsed_ms:.0f} status=refusal")
            return {"ok": False, "error": "Groq declined to respond to this request."}
        return {"ok": False, "error": "Groq response did not include any text"}

    usage = payload.get("usage") or {}
    print(f"[groqAIService] model={settings.model} durationMs={elapsed_ms:.0f} status=ok")
    return {
        "ok": True,
        "replyText": content,
        "model": payload.get("model", settings.model),
        "tokenUsage": usage.get("total_tokens", 0),
    }
