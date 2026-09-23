"""`_extract_tool_call` previously set `remainderText` to the model's entire raw
reply (fenced JSON block included), and `_handle_mutating_tool` shows that text
to the user verbatim whenever it's non-empty -- so every mutating-tool reply
(SUGGEST_QUESTIONS, ADD_QUESTION, ...) leaked the raw ```json {...}``` blob into
the chat instead of a friendly proposal message. Locks in the fix: the JSON
block is stripped out of the reply before it's used as the remainder.
"""

from __future__ import annotations

from app.services.aiAssistantService import _extract_tool_call


def test_pure_fenced_tool_call_has_empty_remainder():
    reply = '```json\n{"tool": "SUGGEST_QUESTIONS", "args": {"topic": "customer feedback", "count": 10}}\n```'
    result = _extract_tool_call(reply)

    assert result is not None
    assert result["call"] == {
        "tool": "SUGGEST_QUESTIONS",
        "args": {"topic": "customer feedback", "count": 10},
    }
    assert result["remainderText"] == ""


def test_tool_call_with_surrounding_prose_keeps_only_the_prose():
    reply = (
        "Sure, here are some suggestions:\n\n"
        '```json\n{"tool": "SUGGEST_QUESTIONS", "args": {"topic": "NPS", "count": 3}}\n```\n\n'
        "Let me know if you'd like more."
    )
    result = _extract_tool_call(reply)

    assert result is not None
    assert "json" not in result["remainderText"]
    assert "Sure, here are some suggestions" in result["remainderText"]
    assert "Let me know if you'd like more." in result["remainderText"]


def test_plain_text_reply_is_not_a_tool_call():
    assert _extract_tool_call("This campaign has 5 questions.") is None
