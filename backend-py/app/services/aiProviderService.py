"""Port of `backend/src/services/aiProviderService.ts`, extended with a
third tier not present on the Node side yet: tries FabriX first, falls back
to Claude, then falls back to Groq.
"""

from __future__ import annotations

from typing import Any


async def send_message(request: dict[str, Any], db: Any) -> dict[str, Any]:
    """Tries FabriX first; falls back to Claude, then Groq, only if the
    tier(s) before it fail. Never raises."""
    from app.services.fabrixAIService import send_message as send_fabrix
    from app.services.claudeAIService import send_message as send_claude
    from app.services.groqAIService import send_message as send_groq

    fabrix_result = await send_fabrix(request, db)
    if fabrix_result["ok"]:
        return fabrix_result

    print(f"[aiProviderService] FabriX unavailable ({fabrix_result['error']}) — falling back to Claude")
    claude_result = await send_claude(request, db)
    if claude_result["ok"]:
        return claude_result

    print(f"[aiProviderService] Claude fallback also failed ({claude_result['error']}) — falling back to Groq")
    groq_result = await send_groq(request, db)
    if groq_result["ok"]:
        return groq_result

    print(f"[aiProviderService] Groq fallback also failed ({groq_result['error']})")
    return fabrix_result
