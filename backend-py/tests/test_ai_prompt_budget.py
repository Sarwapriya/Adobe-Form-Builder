"""The admin prompt (system prompt + MCP tool catalog + history) plus Groq's completion
budget must stay under Groq's per-minute token cap, or every chat turn fails."""

from __future__ import annotations

import asyncio
from types import SimpleNamespace

from app.services import aiAssistantService, mcp_sql_client
from app.services.ai_providers_service import ProviderConfig
from app.services.openaiCompatAIService import GROQ_TOKENS_PER_MINUTE, _build_body

_VERBOSE_TOOL = {
    "name": "execute_sql_query",
    "description": "Executes a read-only SQL query against the chosen connection. " + "Detailed usage notes. " * 60,
    "inputSchema": {
        "type": "object",
        "properties": {
            "connection": {"type": "string", "description": "Which connection to use. " * 30},
            "query": {"type": "string", "description": "The T-SQL text. " * 30},
            "max_rows": {"type": "integer", "description": "Row cap. " * 30},
        },
        "required": ["connection", "query"],
    },
}


def _groq(model: str = "openai/gpt-oss-120b") -> ProviderConfig:
    return ProviderConfig(id="1", name="Groq", baseUrl="https://api.groq.com/openai/v1", model=model, apiKey="k")


def test_mcp_section_is_compact_but_keeps_names_and_required_args(monkeypatch):
    async def fake_list_tools(**_kwargs):
        return {"ok": True, "tools": [_VERBOSE_TOOL]}

    monkeypatch.setattr(mcp_sql_client, "is_enabled", lambda: True)
    monkeypatch.setattr(mcp_sql_client, "list_tools", fake_list_tools)

    section = asyncio.run(aiAssistantService._build_mcp_tools_section("admin"))

    assert section is not None
    assert "execute_sql_query" in section
    assert "arguments: { connection: string, query: string, max_rows?: integer }" in section
    assert "Detailed usage notes. " * 20 not in section
    assert len(section) < 1500


def test_groq_completion_budget_shrinks_with_the_prompt():
    small = _build_body(_groq(), [{"role": "user", "content": "hi"}])
    assert small["max_completion_tokens"] == 4096

    big_prompt = "x" * (3 * 6500)  # ~6500 tokens
    big = _build_body(_groq(), [{"role": "user", "content": big_prompt}])
    assert 1024 <= big["max_completion_tokens"] < 4096
    assert 6500 + big["max_completion_tokens"] <= GROQ_TOKENS_PER_MINUTE + 1024


def test_non_groq_hosts_keep_their_own_body_shape():
    provider = ProviderConfig(id="2", name="Other", baseUrl="https://llm.example.com/v1", model="m", apiKey="k")
    body = _build_body(provider, [{"role": "user", "content": "hi"}])
    assert body["max_tokens"] == 4096
    assert "reasoning_effort" not in body


def test_short_conversation_keeps_all_history():
    history = [SimpleNamespace(role="user", message="hi"), SimpleNamespace(role="assistant", message="hello")]
    turns = aiAssistantService._build_base_turns(None, history, {"role": "standard"})
    # system turn + both history turns, nothing dropped.
    assert len(turns) == 3
    assert turns[1]["content"] == "hi"
    assert turns[2]["content"] == "hello"


def test_long_conversation_drops_oldest_history_but_keeps_the_most_recent(monkeypatch):
    # Force a tiny budget so the trimming logic is exercised deterministically,
    # independent of how large the real system prompt happens to be.
    monkeypatch.setattr(aiAssistantService, "_MAX_PROMPT_CHARS_FOR_HISTORY_BUDGET", 10_000)

    history = [SimpleNamespace(role="user" if i % 2 == 0 else "assistant", message="x" * 3000) for i in range(10)]
    turns = aiAssistantService._build_base_turns(None, history, {"role": "standard"})

    history_turns = turns[1:]
    assert 0 < len(history_turns) < len(history)
    # Whatever survived is a contiguous, most-recent suffix of the original history.
    assert [t["content"] for t in history_turns] == [h.message for h in history[len(history) - len(history_turns):]]


def test_trim_history_to_budget_always_keeps_the_latest_turn_even_if_it_overflows():
    history_turns = [{"role": "user", "content": "x" * 5000}]
    kept = aiAssistantService._trim_history_to_budget(history_turns, budget_chars=10)
    assert kept == history_turns
