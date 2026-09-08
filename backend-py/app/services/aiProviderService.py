"""Port of `backend/src/services/aiProviderService.ts`.

Provider-agnostic chat contract — two admin-toggleable tiers (see
`fabrix_settings_service.py`/`groq_settings_service.py`, each with its own
`enabled` flag). FabriX always gets first priority when both are enabled;
Groq is the fallback used only when FabriX is disabled or unreachable. A
disabled tier's own `send_message` returns `{ok: False, error: "... is
disabled"}` immediately (no network call), so disabling one is effectively
instant — there's nothing else to configure to "turn off" a provider.
"""

from __future__ import annotations

from typing import Any


async def send_message(request: dict[str, Any], db: Any) -> dict[str, Any]:
    """Tries FabriX first; falls back to Groq only if FabriX is disabled or
    unreachable. Never raises."""
    from app.services.fabrixAIService import send_message as send_fabrix
    from app.services.groqAIService import send_message as send_groq

    fabrix_result = await send_fabrix(request, db)
    if fabrix_result["ok"]:
        return fabrix_result

    print(f"[aiProviderService] FabriX unavailable ({fabrix_result['error']}) — falling back to Groq")
    groq_result = await send_groq(request, db)
    if groq_result["ok"]:
        return groq_result

    print(f"[aiProviderService] Groq fallback also failed ({groq_result['error']})")
    return fabrix_result
