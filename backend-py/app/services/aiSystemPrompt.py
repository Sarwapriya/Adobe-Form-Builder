"""System prompts for the FormIQ AI chatbot.

The chatbot's instructions live in a separate, versioned file
(`prompts/formiq_chatbot_v<N>.md`), so a prompt change is a reviewable diff of
its own. Tools are no longer described in prose — they're sent to Groq as
native function definitions (see aiAssistantService.CHAT_TOOLS), and the
backend executes every call itself.

Nothing in the prompt is an authorization control: subsidiary scoping is
enforced by the MCP server (signed user context) and the backend.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

CHATBOT_PROMPT_VERSION = 2
_PROMPTS_DIR = Path(__file__).resolve().parent / "prompts"

# For the isolated helper calls (question-suggestion / translation generators),
# which need no tools or conversation rules — just a tight output contract.
HELPER_SYSTEM_PROMPT = (
    "You are the FormIQ AI Assistant's content generator. You write professional survey/campaign form "
    "content. Campaign names are internal CRM program names (e.g. \"Hand Raiser\", \"NPS\"), not literal "
    "descriptions — never derive question content from the literal words of a name. Never include personal "
    "data. Follow the requested output format exactly."
)


@lru_cache(maxsize=None)
def load_chatbot_prompt(version: int = CHATBOT_PROMPT_VERSION) -> str:
    return (_PROMPTS_DIR / f"formiq_chatbot_v{version}.md").read_text(encoding="utf-8").strip()


def build_system_prompt(role: str) -> str:
    """The chatbot's system prompt. `role` no longer changes the text: every
    role gets the same tools, and what each one may see is decided server-side."""
    return load_chatbot_prompt()
