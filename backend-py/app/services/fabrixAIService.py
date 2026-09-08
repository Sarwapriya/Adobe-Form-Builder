"""Port of `backend/src/services/fabrixAIService.ts`.

The one service that talks to FabriXAI's Agent API over the network.
Uses `httpx` for async HTTP with timeout/retry support.
"""

from __future__ import annotations

import time
from typing import Any, Literal, Optional

import httpx

from app.services.fabrix_settings_service import FabrixSettings, get_fabrix_settings

FabrixChatRole = Literal["system", "user", "assistant", "tool"]


class FabrixChatTurn:
    def __init__(self, role: FabrixChatRole, content: str) -> None:
        self.role = role
        self.content = content


class FabrixChatRequest:
    def __init__(self, messages: list[dict[str, str]], conversation_id: Optional[str] = None) -> None:
        self.messages = messages
        self.conversation_id = conversation_id


FabrixChatResult = dict[str, Any]


def _backoff_delay_ms(attempt: int) -> float:
    """Capped exponential backoff: 500ms, 1s, 2s, ... capped at 5s."""
    return min(500 * (2 ** attempt), 5000) / 1000.0


def _is_retryable_status(status: int) -> bool:
    return 500 <= status < 600


async def send_message(request: dict[str, Any], db: Any) -> FabrixChatResult:
    """Sends one conversation turn to FabriXAI and returns its reply, or a
    structured ``{ok: False, error: ...}`` if the config is missing/disabled
    or every retry attempt failed. Never raises."""
    settings = get_fabrix_settings(db)
    if settings is None:
        return {"ok": False, "error": "FabriXAI is not configured"}
    if not settings.enabled:
        return {"ok": False, "error": "FabriXAI is disabled"}
    if not settings.clientHeader or not settings.openApiToken:
        return {"ok": False, "error": "FabriXAI client header or openapi token is not configured"}

    messages = request["messages"]
    conversation_id = request.get("conversationId")

    started_at = time.time()
    last_error = "Unknown error"

    for attempt in range(settings.maxRetries + 1):
        try:
            result = await _call_fabrix_agent(settings, messages)
        except httpx.TimeoutException:
            elapsed_ms = (time.time() - started_at) * 1000
            last_error = f"FabriXAI request timed out after {settings.timeoutSeconds}s"
            if attempt == settings.maxRetries:
                _log_error(settings, conversation_id, elapsed_ms, last_error)
                return {"ok": False, "error": last_error}
            await _sleep(_backoff_delay_ms(attempt))
            continue
        except httpx.HTTPError as exc:
            elapsed_ms = (time.time() - started_at) * 1000
            last_error = str(exc)
            # Network-level failures are always retryable
            if attempt == settings.maxRetries:
                _log_error(settings, conversation_id, elapsed_ms, last_error)
                return {"ok": False, "error": last_error}
            await _sleep(_backoff_delay_ms(attempt))
            continue

        if result["ok"]:
            elapsed_ms = (time.time() - started_at) * 1000
            _log_ok(settings, conversation_id, elapsed_ms)
            return result

        last_error = result.get("error", "Unknown error")
        retryable = result.get("retryable", False)
        if not retryable or attempt == settings.maxRetries:
            elapsed_ms = (time.time() - started_at) * 1000
            _log_error(settings, conversation_id, elapsed_ms, last_error)
            return {"ok": False, "error": last_error}

        await _sleep(_backoff_delay_ms(attempt))

    return {"ok": False, "error": last_error}


async def _sleep(seconds: float) -> None:
    import asyncio
    await asyncio.sleep(seconds)


def _log_ok(settings: FabrixSettings, conversation_id: Optional[str], elapsed_ms: float) -> None:
    model_ids = ",".join(settings.modelIds)
    conv_id = conversation_id or "(new)"
    print(f"[fabrixAIService] modelIds={model_ids} conversationId={conv_id} durationMs={elapsed_ms:.0f} status=ok")


def _log_error(settings: FabrixSettings, conversation_id: Optional[str], elapsed_ms: float, error: str) -> None:
    model_ids = ",".join(settings.modelIds)
    conv_id = conversation_id or "(new)"
    print(
        f"[fabrixAIService] modelIds={model_ids} conversationId={conv_id} "
        f"durationMs={elapsed_ms:.0f} status=error error={error}"
    )


async def _call_fabrix_agent(
    config: FabrixSettings, messages: list[dict[str, str]]
) -> FabrixChatResult:
    """The real FabriX OpenAPI chat contract.

    POST {baseUrl}/openapi/chat/v1/messages
    Body: { modelIds, contents, isStream: false, systemPrompt? }
    """
    base_url = config.baseUrl.rstrip("/")
    url = f"{base_url}/openapi/chat/v1/messages"

    # Collapse system messages into systemPrompt, rest into flat contents array
    system_parts = [m["content"] for m in messages if m["role"] == "system"]
    system_prompt = "\n\n".join(system_parts) if system_parts else ""
    contents = [m["content"] for m in messages if m["role"] != "system"]

    body = {
        "modelIds": config.modelIds,
        "contents": contents,
        "isStream": False,
    }
    if system_prompt:
        body["systemPrompt"] = system_prompt

    open_api_token = config.openApiToken
    if not open_api_token.startswith("Bearer "):
        open_api_token = f"Bearer {open_api_token}"

    headers = {
        "Content-Type": "application/json",
        "x-fabrix-client": config.clientHeader,
        "x-openapi-token": open_api_token,
    }
    if config.userEmail:
        headers["x-generative-ai-user-email"] = config.userEmail

    async with httpx.AsyncClient(timeout=config.timeoutSeconds) as client:
        response = await client.post(url, json=body, headers=headers)

    if response.status_code != 200:
        retryable = _is_retryable_status(response.status_code)
        try:
            detail = response.text[:500]
        except Exception:
            detail = response.reason_phrase
        return {
            "ok": False,
            "error": f"FabriXAI request failed ({response.status_code}): {detail}",
            "retryable": retryable,
        }

    try:
        payload = response.json()
    except Exception:
        return {"ok": False, "error": "FabriXAI returned a non-JSON response", "retryable": False}

    if payload.get("status") in ("ERROR", "FILTER_INVALID"):
        detail = (payload.get("filterBlockReason") or {}).get("message") or payload.get("status", "unknown")
        return {"ok": False, "error": f"FabriXAI returned an error: {detail}", "retryable": False}

    content = payload.get("content")
    if not isinstance(content, str):
        return {"ok": False, "error": "FabriXAI response did not include content", "retryable": False}

    return {
        "ok": True,
        "replyText": content,
        "model": payload.get("modelType"),
    }
