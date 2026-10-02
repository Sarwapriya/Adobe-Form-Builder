"""The guided campaign wizard's non-chat endpoints: POST /ai/wizard/proposals
(create_proposal_from_wizard), GET /ai/questions/search (a thin wrapper over
search_question_library), POST /ai/questions/draft (a single tool-less LLM
call, the same helper the in-chat suggest_questions tool uses)."""

from __future__ import annotations

import asyncio
import uuid

from app.models.ai_conversation import AIConversation
from app.models.ai_form_proposal import AIFormProposal
from app.services import aiAssistantService, campaign_retrieval
from tests.form_builder.conftest import auth_headers


def _proposal(**overrides) -> dict:
    return {
        "name": "New hand raiser", "projectCode": None, "subsidiary": None, "baseFormId": None,
        "questions": [
            {"id": None, "sourceFormId": None, "sourceQuestionId": None, "controlType": "radio", "required": True,
             "heading": "Which TV model?", "subheading": None,
             "answers": [{"id": None, "sourceAnswerId": None, "text": "QLED"}, {"id": None, "sourceAnswerId": None, "text": "OLED"}]},
        ],
        **overrides,
    }


# --- POST /ai/wizard/proposals -----------------------------------------------------

def test_wizard_proposal_creates_a_conversation_and_a_proposal(client, db_session, admin_user, subsidiary_row):
    before = db_session.query(AIConversation).filter(AIConversation.userId == admin_user.id).count()

    resp = client.post(
        "/api/v1/ai/wizard/proposals", json=_proposal(subsidiary=subsidiary_row.name), headers=auth_headers(admin_user)
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["valid"] is True
    assert body["name"] == "New hand raiser"
    assert body["subsidiary"] == subsidiary_row.name
    assert body["version"] == 1
    assert body["saved"] is False

    after = db_session.query(AIConversation).filter(AIConversation.userId == admin_user.id).count()
    assert after == before + 1

    row = db_session.get(AIFormProposal, body["id"])
    assert row is not None and row.userId == admin_user.id


def test_wizard_proposal_returns_errors_and_creates_nothing_when_invalid(client, db_session, standard_user):
    before = db_session.query(AIConversation).filter(AIConversation.userId == standard_user.id).count()

    # A choice question needs at least two answers (TOO_FEW).
    raw = _proposal()
    raw["questions"][0]["answers"] = raw["questions"][0]["answers"][:1]
    resp = client.post("/api/v1/ai/wizard/proposals", json=raw, headers=auth_headers(standard_user))
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["valid"] is False
    assert any(e["code"] == "TOO_FEW" for e in body["errors"])

    after = db_session.query(AIConversation).filter(AIConversation.userId == standard_user.id).count()
    assert after == before


def test_wizard_proposal_is_approvable_and_savable_like_any_other(client, db_session, admin_user, subsidiary_row):
    created = client.post(
        "/api/v1/ai/wizard/proposals", json=_proposal(subsidiary=subsidiary_row.name), headers=auth_headers(admin_user)
    ).json()
    headers = auth_headers(admin_user)

    approved = client.post(f"/api/v1/ai/proposals/{created['id']}/approve", headers=headers)
    assert approved.status_code == 200, approved.text
    saved = client.post(
        f"/api/v1/ai/proposals/{created['id']}/save", json={"approvalToken": approved.json()["approvalToken"]}, headers=headers
    )
    assert saved.status_code == 200, saved.text
    assert saved.json()["route"] == f"/admin/form-builder/{saved.json()['formId']}"


# --- GET /ai/questions/search -------------------------------------------------------

def test_search_questions_wraps_the_retrieval_tool(client, admin_user, monkeypatch):
    calls = []

    async def fake_call(db, name, args, auth):
        calls.append((name, args))
        return {"questions": [{"sourceFormId": "f1", "sourceQuestionId": "Q1", "heading": "Which TV model?",
                                "subheading": None, "controlType": "radio", "required": True,
                                "answers": [{"id": "A1", "text": "QLED"}]}], "totalMatched": 1}

    monkeypatch.setattr(campaign_retrieval, "call_campaign_tool", fake_call)

    resp = client.get("/api/v1/ai/questions/search?text=TV+model", headers=auth_headers(admin_user))
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["totalMatched"] == 1
    assert body["questions"][0]["heading"] == "Which TV model?"
    assert calls == [("search_question_library", {"text": "TV model"})]


# --- POST /ai/questions/draft --------------------------------------------------------

def _fake_ai(reply_text: str):
    async def _send(_request, _db):
        return {"ok": True, "replyText": reply_text, "tokenUsage": None, "model": "test"}

    return _send


def test_draft_question_returns_a_proposal_shaped_question(client, admin_user, monkeypatch):
    reply = (
        '```json\n{"questions": [{"heading": "How satisfied are you?", "controlType": "radio", '
        '"required": true, "answers": ["Very satisfied", "Not satisfied"]}]}\n```'
    )
    monkeypatch.setattr(aiAssistantService, "send_ai_message", _fake_ai(reply))

    resp = client.post(
        "/api/v1/ai/questions/draft",
        json={"topic": "customer satisfaction", "locale": "en_GB", "defaultLocale": "en_GB"},
        headers=auth_headers(admin_user),
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body == {
        "heading": "How satisfied are you?", "subheading": None, "controlType": "radio", "required": True,
        "answers": ["Very satisfied", "Not satisfied"], "reused": False, "sourceFormId": None, "sourceQuestionId": None,
    }


def test_draft_question_502s_when_generation_fails(client, admin_user, monkeypatch):
    monkeypatch.setattr(aiAssistantService, "send_ai_message", _fake_ai("not json at all"))

    resp = client.post(
        "/api/v1/ai/questions/draft",
        json={"topic": "x", "locale": "en_GB", "defaultLocale": "en_GB"},
        headers=auth_headers(admin_user),
    )
    assert resp.status_code == 502
