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
    the first success; if every one fails, FabriX's own error (the primary
    provider's, and what the customer-facing message is based on). Never raises."""
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

    print(f"[aiProviderService] FabriX unavailable ({fabrix_result['error']}) — trying {len(providers)} other provider(s)")
    for provider in providers:
        result = await send_provider(request, provider)
        if result["ok"]:
            return result
        print(f"[aiProviderService] {provider.name!r} failed ({result['error']})")

    return fabrix_result
