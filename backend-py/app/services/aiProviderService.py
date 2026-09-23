"""Port of `backend/src/services/aiProviderService.ts`.

Provider-agnostic chat contract. FabriX (see `fabrix_settings_service.py`) always
gets first priority; every enabled "other" provider (see
`ai_providers_service.py` — any number of OpenAI-compatible endpoints, each
with its own admin-chosen name) is tried after it, in the order shown in the
admin UI, until one answers. A disabled FabriX / provider costs nothing — it is
skipped without a network call — so switching one off is effectively instant and
there is nothing else to configure.
"""

from __future__ import annotations

from typing import Any


async def send_message(request: dict[str, Any], db: Any) -> dict[str, Any]:
    """Tries FabriX first, then each enabled other provider in turn. Returns
    the first success; if every one fails, the LAST one actually attempted —
    FabriX's own error only when it was the only one tried (no other provider
    enabled). Returning FabriX's error after other providers were tried and
    failed would be actively misleading whenever FabriX is deliberately
    disabled (its error is then always the same stale "disabled" message,
    which hides the real, and often transient, reason the other provider(s)
    just failed for). Never raises."""
    from app.services.ai_providers_service import list_enabled_provider_configs
    from app.services.fabrixAIService import send_message as send_fabrix
    from app.services.openaiCompatAIService import send_message as send_provider

    fabrix_result = await send_fabrix(request, db)
    if fabrix_result["ok"]:
        return fabrix_result

    providers = list_enabled_provider_configs(db)
    if not providers:
        print(f"[aiProviderService] FabriX unavailable ({fabrix_result['error']}) — no other AI provider is enabled")
        return fabrix_result

    provider_names = [f"{p.name!r} (id={getattr(p, 'id', None)})" for p in providers]
    print(f"[aiProviderService] FabriX unavailable ({fabrix_result['error']}) — trying {len(providers)} other provider(s): {provider_names}")
    last_result = fabrix_result
    for provider in providers:
        last_result = await send_provider(request, provider)
        if last_result["ok"]:
            return last_result
        print(f"[aiProviderService] {provider.name!r} failed ({last_result['error']})")

    return last_result
