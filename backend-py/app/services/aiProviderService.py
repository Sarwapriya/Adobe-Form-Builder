"""Plain-text (no tools) completion for the AI chatbot's helper calls — the
question-suggestion and translation generators in aiAssistantService.

Goes straight to `llmChatService` with the chatbot's provider from
`ai_providers_service.get_chat_provider_config` (OpenAI, else Groq). FabriX and
any other `fq.AiProviders` rows are not part of the chatbot path (FabriX's
admin settings screens and their "test" endpoint still exist and are
unaffected — see routers/admin.py).
"""

from __future__ import annotations

from typing import Any

CHAT_PROVIDER_NOT_CONFIGURED = "No OpenAI or Groq provider is configured for the AI assistant"


async def send_message(request: dict[str, Any], db: Any) -> dict[str, Any]:
    """`request["messages"]`: `[{role, content}]`. Returns
    `{ok: True, replyText, model, tokenUsage}` or `{ok: False, error}`. Never raises."""
    from app.services import llmChatService
    from app.services.ai_providers_service import get_chat_provider_config

    provider = get_chat_provider_config(db)
    if provider is None:
        print(f"[aiProviderService] {CHAT_PROVIDER_NOT_CONFIGURED}")
        return {"ok": False, "error": CHAT_PROVIDER_NOT_CONFIGURED}

    messages = [
        {"role": m["role"] if m["role"] in ("system", "assistant") else "user", "content": m["content"]}
        for m in request["messages"]
    ]
    result = await llmChatService.chat(provider, messages)
    if not result["ok"]:
        return {"ok": False, "error": result["error"]}
    return {"ok": True, "replyText": result["content"], "model": result["model"], "tokenUsage": result["tokenUsage"]}
