"""SUGGEST_QUESTIONS/TRANSLATE_QUESTIONS never actually generated content in
the Python port -- unlike every other AI tool, their model-emitted `args` are
just `{topic, count}` / `{questionIds, targetLocale}`, never real question/
translation text (see aiSystemPrompt.py's tool description and the original
`backend/src/services/aiAssistantService.ts`). The old Node backend re-prompted
the model in a second, isolated exchange to actually generate the content and
turned each result into its own ADD_QUESTION/UPDATE_QUESTION pending action;
the Python port's `_handle_mutating_tool` instead created a single pending
action carrying the bare `{topic, count}` args, which the frontend's
QuestionSuggestionCard (expects `action.data` to be `{question: {...}}`) never
recognized -- so "suggest questions" silently did nothing. This locks in the
re-prompt/generate/expand behavior.
"""

from __future__ import annotations

import asyncio

from app.form_pipeline import AnswerDefinition, QuestionDefinition
from app.services import aiAssistantService as svc


def _fake_ai(reply_text: str):
    async def _send(_request, _db):
        return {"ok": True, "replyText": reply_text, "tokenUsage": None, "model": "test"}

    return _send


def test_generate_suggested_questions_expands_topic_into_real_questions(monkeypatch):
    reply = (
        '```json\n{"questions": ['
        '{"heading": "How satisfied are you?", "controlType": "radio", "required": true, '
        '"answers": ["Very satisfied", "Not satisfied"]},'
        '{"heading": "Any other comments?", "controlType": "text", "required": false}'
        "]}\n```"
    )
    monkeypatch.setattr(svc, "send_ai_message", _fake_ai(reply))

    questions = asyncio.run(svc._generate_suggested_questions(None, "admin", {"topic": "NPS", "count": 2}, "en_GB"))

    assert len(questions) == 2
    assert questions[0].headingByLocale["en_GB"] == "How satisfied are you?"
    assert questions[0].controlType == "radio"
    assert [a.textByLocale["en_GB"] for a in questions[0].answers] == ["Very satisfied", "Not satisfied"]
    assert questions[1].controlType == "text"
    assert questions[1].answers == []
    # Every generated question gets a fresh, distinct id.
    assert questions[0].id != questions[1].id


def test_generate_suggested_questions_retries_once_then_gives_up(monkeypatch):
    calls = {"n": 0}

    async def _send(_request, _db):
        calls["n"] += 1
        return {"ok": True, "replyText": "not json at all", "tokenUsage": None, "model": "test"}

    monkeypatch.setattr(svc, "send_ai_message", _send)

    questions = asyncio.run(svc._generate_suggested_questions(None, "admin", {"topic": "NPS", "count": 3}, "en_GB"))

    assert questions == []
    assert calls["n"] == 2


def test_generate_suggested_questions_caps_count_from_malformed_args(monkeypatch):
    reply = '```json\n{"questions": [{"heading": "Q1"}, {"heading": "Q2"}, {"heading": "Q3"}]}\n```'
    monkeypatch.setattr(svc, "send_ai_message", _fake_ai(reply))

    # count is a string here (a malformed/unexpected tool-call arg) -- must not raise.
    questions = asyncio.run(svc._generate_suggested_questions(None, "admin", {"topic": "x", "count": "2"}, "en_GB"))

    assert len(questions) == 2


def test_generate_translations_merges_into_existing_answer_locales(monkeypatch):
    question = QuestionDefinition(
        id="Q1",
        order=1,
        controlType="radio",
        headingByLocale={"en_GB": "I am currently using"},
        subheadingByLocale={},
        required=True,
        answers=[
            AnswerDefinition(id="A1", order=1, textByLocale={"en_GB": "Galaxy"}),
            AnswerDefinition(id="A2", order=2, textByLocale={"en_GB": "iPhone"}),
        ],
    )
    reply = (
        '```json\n{"translations": [{"questionId": "Q1", "heading": "J\'utilise actuellement", '
        '"answers": [{"answerId": "A1", "text": "Galaxy"}, {"answerId": "A2", "text": "iPhone"}]}]}\n```'
    )
    monkeypatch.setattr(svc, "send_ai_message", _fake_ai(reply))

    updates = asyncio.run(
        svc._generate_translations(None, "admin", {"questionIds": ["Q1"], "targetLocale": "fr_FR"}, [question], "en_GB")
    )

    assert len(updates) == 1
    patch = updates[0]["patch"]
    assert patch["headingByLocale"]["fr_FR"] == "J'utilise actuellement"
    assert patch["headingByLocale"]["en_GB"] == "I am currently using"
    by_id = {a["id"]: a for a in patch["answers"]}
    assert by_id["A1"]["textByLocale"]["fr_FR"] == "Galaxy"
    assert by_id["A1"]["textByLocale"]["en_GB"] == "Galaxy"


def test_generate_translations_ignores_unknown_question_ids():
    question = QuestionDefinition(
        id="Q1", order=1, controlType="text", headingByLocale={"en_GB": "Comments"},
        subheadingByLocale={}, required=False, answers=[],
    )
    updates = asyncio.run(
        svc._generate_translations(None, "admin", {"questionIds": ["does-not-exist"], "targetLocale": "fr_FR"}, [question], "en_GB")
    )
    assert updates == []
