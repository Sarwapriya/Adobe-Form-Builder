"""The chatbot prompt (system prompt + tool schemas + history) plus Groq's
completion budget must stay under Groq's per-minute token cap, or every chat
turn fails — history is trimmed oldest-first to make room."""

from __future__ import annotations

from types import SimpleNamespace

from app.services import aiAssistantService, llmChatService

AUTH = {"sub": "u", "role": "standard", "subsidiaryId": "SGE"}


def _messages(history, tools=None):
    tools = tools if tools is not None else aiAssistantService.chat_tools(False)
    return aiAssistantService._build_messages(AUTH, None, history, "latest question", tools)


def test_short_conversation_keeps_all_history():
    history = [SimpleNamespace(role="user", message="hi"), SimpleNamespace(role="assistant", message="hello")]
    messages = _messages(history)
    assert [m["content"] for m in messages[1:]] == ["hi", "hello", "latest question"]
    assert messages[0]["role"] == "system"


def test_long_conversation_drops_oldest_history_but_keeps_the_most_recent():
    history = [SimpleNamespace(role="user" if i % 2 == 0 else "assistant", message="x" * 3000) for i in range(10)]
    messages = _messages(history)
    history_turns = messages[1:-1]
    assert 0 < len(history_turns) < len(history)
    assert [t["content"] for t in history_turns] == [h.message for h in history[len(history) - len(history_turns):]]
    tools = aiAssistantService.chat_tools(False)
    assert llmChatService.estimate_tokens(messages, tools) <= llmChatService.GROQ_TOKENS_PER_MINUTE


def test_tool_rows_are_not_replayed_as_history():
    history = [SimpleNamespace(role="tool", message='{"tool":"x"}'), SimpleNamespace(role="user", message="hi")]
    assert [m["content"] for m in _messages(history)[1:]] == ["hi", "latest question"]


def test_trim_history_to_budget_always_keeps_the_latest_turn_even_if_it_overflows():
    history_turns = [{"role": "user", "content": "x" * 5000}]
    kept = aiAssistantService._trim_history_to_budget(history_turns, budget_chars=10)
    assert kept == history_turns


def test_editor_tools_only_offered_with_an_open_campaign():
    closed = {t["function"]["name"] for t in aiAssistantService.chat_tools(False)}
    opened = {t["function"]["name"] for t in aiAssistantService.chat_tools(True)}
    assert closed == {"search_previous_campaigns", "get_campaign_details", "search_question_library", "validate_form"}
    assert opened == closed | aiAssistantService.EDITOR_TOOL_NAMES
    assert all(t["type"] == "function" for t in aiAssistantService.chat_tools(True))
