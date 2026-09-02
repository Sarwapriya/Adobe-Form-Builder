"""Port of `backend/src/services/claudeAIService.ts`.

Talks to the Anthropic Claude Messages API. Uses the official `anthropic` SDK.
"""

from __future__ import annotations

import time
from typing import Any, Optional

import anthropic

from app.services.claude_settings_service import ClaudeSettings, get_claude_settings


async def send_message(request: dict[str, Any], db: Any) -> dict[str, Any]:
    """Sends one conversation turn to Claude and returns its reply, or a
    structured ``{ok: False, error: ...}`` if the config is missing/disabled."""
    settings = get_claude_settings(db)
    if settings is None:
        return {"ok": False, "error": "Claude is not configured"}
    if not settings.enabled:
        return {"ok": False, "error": "Claude is disabled"}

    client = anthropic.Anthropic(api_key=settings.apiKey)

    system_parts = [m["content"] for m in request["messages"] if m["role"] == "system"]
    system_prompt = "\n\n".join(system_parts) if system_parts else ""

    messages = []
    for m in request["messages"]:
        if m["role"] == "system":
            continue
        role = "assistant" if m["role"] == "assistant" else "user"
        messages.append({"role": role, "content": m["content"]})

    started_at = time.time()
    try:
        kwargs: dict[str, Any] = {
            "model": settings.model,
            "max_tokens": 8192,
            "messages": messages,
        }
        if system_prompt:
            kwargs["system"] = system_prompt

        response = client.messages.create(**kwargs)

        if response.stop_reason == "refusal":
            elapsed_ms = (time.time() - started_at) * 1000
            print(f"[claudeAIService] model={settings.model} durationMs={elapsed_ms:.0f} status=refusal")
            return {"ok": False, "error": "Claude declined to respond to this request."}

        text_block = next(
            (block for block in response.content if block.type == "text"), None
        )
        if text_block is None:
            return {"ok": False, "error": "Claude response did not include any text"}

        elapsed_ms = (time.time() - started_at) * 1000
        print(f"[claudeAIService] model={settings.model} durationMs={elapsed_ms:.0f} status=ok")
        return {
            "ok": True,
            "replyText": text_block.text,
            "model": response.model,
            "tokenUsage": response.usage.input_tokens + response.usage.output_tokens,
        }
    except anthropic.AuthenticationError:
        return {"ok": False, "error": "Claude authentication failed — check the API key."}
    except anthropic.RateLimitError:
        return {"ok": False, "error": "Claude rate limit exceeded — try again shortly."}
    except anthropic.BadRequestError as exc:
        return {"ok": False, "error": f"Claude rejected the request: {exc.message}"}
    except anthropic.APIError as exc:
        return {"ok": False, "error": f"Claude error ({exc.status_code}): {exc.message}"}
    except Exception as exc:
        return {"ok": False, "error": str(exc)}
