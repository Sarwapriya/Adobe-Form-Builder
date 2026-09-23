"""Creates (or updates) the OpenAI row in Configuration > AI Assistant > Other
AI Providers (`fq.AiProviders`) from the OPENAI_API_KEY/OPENAI_MODEL env vars,
so the AI chatbot uses OpenAI (see `ai_providers_service.get_chat_provider_config`,
which prefers an enabled api.openai.com row over Groq). The key is stored
encrypted exactly as the admin screen stores it, and is never printed.

Idempotent — re-running updates the existing api.openai.com row's key/model
and enables it. Run from `backend-py/`:

    python scripts/set_openai_provider.py
"""

from __future__ import annotations

import sys

sys.path.insert(0, ".")

from app.config import settings
from app.db import get_sessionmaker
from app.services import ai_providers_service as svc


def main() -> None:
    api_key = (settings.OPENAI_API_KEY or "").strip()
    if not api_key:
        print("Missing required environment variable: OPENAI_API_KEY", file=sys.stderr)
        sys.exit(1)
    model = settings.OPENAI_MODEL or svc.DEFAULT_OPENAI_MODEL

    db = get_sessionmaker()()
    try:
        existing = next((r for r in svc.list_ai_providers(db) if svc.is_openai_base_url(r.baseUrl)), None)
        if existing is None:
            row = svc.create_ai_provider(db, "OpenAI", svc.DEFAULT_OPENAI_BASE_URL, model, api_key, is_enabled=True)
            print(f'Created AI provider "OpenAI" (id: {row.id}, model: {model}).')
        else:
            row = svc.update_ai_provider(db, existing.id, {"model": model, "apiKey": api_key, "isEnabled": True})
            print(f'Updated AI provider "{row.name}" (id: {row.id}, model: {model}, enabled).')

        active = svc.get_chat_provider_config(db)
        print(f"The AI chatbot now uses: {active.name if active else 'nothing'} "
              f"({active.baseUrl if active else '-'}, model {active.model if active else '-'}).")
    finally:
        db.close()


if __name__ == "__main__":
    main()
