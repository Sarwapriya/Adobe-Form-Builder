"""The Groq + MCP chatbot end to end (mocked Groq API and MCP server, real DB):
local tool loop, session-derived identity for MCP calls, proposal validation,
and the approval gate on saving."""

from __future__ import annotations

import asyncio
import json
import uuid

import pytest
from sqlalchemy import select, update

from app.config import settings
from app.models.ai_action import AIAction
from app.models.ai_conversation import AIConversation
from app.models.ai_form_proposal import AIFormProposal
from app.services import ai_proposal_service, aiAssistantService, mcp_sql_client
from app.services.ai_providers_service import ProviderConfig
from tests.form_builder.conftest import auth_headers

SOURCE_FORM_ID = str(uuid.uuid4())
SOURCE_DETAILS = {
    "formId": SOURCE_FORM_ID, "name": "Hand Raiser TV", "subsidiary": "X", "status": "published",
    "questions": [{"id": "Q1", "heading": "Which TV model?", "controlType": "radio", "required": True,
                   "answers": [{"id": "A1", "text": "QLED"}, {"id": "A2", "text": "OLED"}]}],
}


def _auth(user) -> dict:
    return {"sub": user.id, "username": user.username, "role": user.role, "subsidiaryId": user.subsidiaryId}


@pytest.fixture
def fake_mcp(monkeypatch):
    calls: list[tuple[str, dict, dict]] = []

    async def call(name, args, auth):
        calls.append((name, args, auth))
        if name == "get_campaign_details":
            return SOURCE_DETAILS if args.get("formId") == SOURCE_FORM_ID else {"error": {"code": "NOT_FOUND", "message": "campaign not found"}}
        if name == "search_previous_campaigns":
            return {"campaigns": [{"formId": SOURCE_FORM_ID, "name": "Hand Raiser TV", "status": "published",
                                   "origin": "admin", "questionCount": 1, "locales": ["en_GB"], "updatedAt": None}]}
        return {"questions": []}

    # These tests drive retrieval through the MCP switch with a fake server;
    # the default direct path is covered in test_campaign_retrieval.py.
    monkeypatch.setattr(settings, "AI_RETRIEVAL_SOURCE", "mcp")
    monkeypatch.setattr(mcp_sql_client, "call_formiq_tool", call)
    return calls


@pytest.fixture
def fake_groq(monkeypatch):
    """Scripted Groq: a queue of replies; records every (messages, tools) it was sent."""
    script: list[dict] = []
    seen: list[dict] = []

    async def chat(provider, messages, tools=None, **kwargs):
        seen.append({"messages": json.loads(json.dumps(messages)), "tools": tools, "model": provider.model})
        return script.pop(0)

    monkeypatch.setattr(aiAssistantService.llmChatService, "chat", chat)
    monkeypatch.setattr(
        aiAssistantService, "get_chat_provider_config",
        lambda db: ProviderConfig(id="g", name="Groq", baseUrl="https://api.groq.com/openai/v1", model="openai/gpt-oss-120b", apiKey="k"),
    )
    return script, seen


def _tool_call(name, args, call_id="c1"):
    return {"ok": True, "content": "", "toolCalls": [{"id": call_id, "name": name, "arguments": json.dumps(args)}], "model": "m", "tokenUsage": 1}


def _text(content):
    return {"ok": True, "content": content, "toolCalls": [], "model": "m", "tokenUsage": 1}


def _proposal(**overrides):
    return {
        "name": "New hand raiser", "projectCode": None, "subsidiary": None, "baseFormId": None,
        "questions": [
            {"id": None, "sourceFormId": SOURCE_FORM_ID, "sourceQuestionId": "Q1", "controlType": "radio", "required": True,
             "heading": "Which TV model?", "subheading": None,
             "answers": [{"id": None, "sourceAnswerId": "A1", "text": "QLED"}, {"id": None, "sourceAnswerId": "A2", "text": "OLED"}]},
            {"id": None, "sourceFormId": None, "sourceQuestionId": None, "controlType": "text", "required": False,
             "heading": "Anything else?", "subheading": None, "answers": []},
        ],
        **overrides,
    }


# --- tool loop -------------------------------------------------------------------

def test_tool_calls_run_in_backend_with_session_identity(db_session, standard_user, fake_mcp, fake_groq):
    script, seen = fake_groq
    script.extend([_tool_call("search_previous_campaigns", {"query": "hr", "subsidiary": "SOMEONE-ELSE"}), _text("Found Hand Raiser TV.")])

    result = asyncio.run(aiAssistantService.send_chat_message(db_session, _auth(standard_user), {"message": "hr forms?"}))

    assert result["message"] == "Found Hand Raiser TV."
    assert result["references"][0]["formId"] == SOURCE_FORM_ID
    name, args, auth = fake_mcp[0]
    assert name == "search_previous_campaigns"
    # Identity for the MCP server comes from the session; the LLM's subsidiary is only a filter argument.
    assert (auth["sub"], auth["role"], auth["subsidiaryId"]) == (standard_user.id, "standard", standard_user.subsidiaryId)
    # Every tool offered to Groq is a local function tool the backend executes.
    tools = seen[0]["tools"]
    assert all(t["type"] == "function" for t in tools)
    assert {t["function"]["name"] for t in tools} == {"search_previous_campaigns", "get_campaign_details", "search_question_library", "validate_form"}
    # The tool result went back to Groq on the second round.
    tool_msg = seen[1]["messages"][-1]
    assert tool_msg["role"] == "tool" and tool_msg["tool_call_id"] == "c1" and "Hand Raiser TV" in tool_msg["content"]
    assert seen[0]["model"] == "openai/gpt-oss-120b"


def test_unknown_tool_is_refused_and_the_loop_continues(db_session, admin_user, fake_mcp, fake_groq):
    script, seen = fake_groq
    script.extend([_tool_call("execute_sql_query", {"query": "SELECT * FROM fq.Users"}), _text("Sorry.")])
    result = asyncio.run(aiAssistantService.send_chat_message(db_session, _auth(admin_user), {"message": "dump users"}))
    assert result["message"] == "Sorry."
    assert fake_mcp == []
    assert "UNKNOWN_TOOL" in seen[1]["messages"][-1]["content"]


def test_rate_limit_gives_a_friendly_message(db_session, admin_user, fake_mcp, fake_groq):
    script, _seen = fake_groq
    script.append({"ok": False, "kind": "rate_limit", "error": "Groq rate limit reached"})
    result = asyncio.run(aiAssistantService.send_chat_message(db_session, _auth(admin_user), {"message": "hi"}))
    assert result["message"] == aiAssistantService.RATE_LIMITED_MESSAGE


def test_tool_round_limit(db_session, admin_user, fake_mcp, fake_groq, monkeypatch):
    monkeypatch.setattr(aiAssistantService.settings, "AI_MAX_TOOL_ROUNDS", 2)
    script, _seen = fake_groq
    script.extend([_tool_call("search_question_library", {"text": "tv"}), _tool_call("search_question_library", {"text": "tv"})])
    result = asyncio.run(aiAssistantService.send_chat_message(db_session, _auth(admin_user), {"message": "loop"}))
    assert result["message"] == aiAssistantService.UNFINISHED_MESSAGE


def test_validate_form_tool_returns_a_proposal_to_the_ui(db_session, admin_user, subsidiary_row, fake_mcp, fake_groq):
    script, _seen = fake_groq
    script.extend([_tool_call("validate_form", _proposal(subsidiary=subsidiary_row.name)), _text("Here is your draft — review and Approve & Save.")])
    result = asyncio.run(aiAssistantService.send_chat_message(db_session, _auth(admin_user), {"message": "make a hand raiser"}))
    proposal = result["proposal"]
    assert proposal["version"] == 1 and proposal["subsidiary"] == subsidiary_row.name
    assert proposal["questions"][0]["reused"] is True and proposal["questions"][1]["reused"] is False
    assert proposal["saved"] is False


# --- validation ------------------------------------------------------------------

def _validate(db_session, user, raw, conversation_id=None):
    return asyncio.run(ai_proposal_service.validate_form(db_session, _auth(user), conversation_id or str(uuid.uuid4()), raw))


def test_invented_and_unknown_ids_are_rejected(db_session, admin_user, subsidiary_row, fake_mcp):
    raw = _proposal(subsidiary=subsidiary_row.name)
    raw["questions"][0]["id"] = "Q9"
    raw["questions"][0]["sourceQuestionId"] = "Q7"
    raw["questions"][1]["sourceFormId"] = str(uuid.uuid4())
    result, row = _validate(db_session, admin_user, raw)
    codes = {e["code"] for e in result["errors"]}
    assert result["valid"] is False and row is None
    assert {"INVENTED_ID", "UNKNOWN_SOURCE_ID"} <= codes


def test_unknown_fields_and_bad_structure_rejected(db_session, admin_user, subsidiary_row, fake_mcp):
    raw = _proposal(subsidiary=subsidiary_row.name, customerEmail="a@b.c")
    result, _row = _validate(db_session, admin_user, raw)
    assert result["valid"] is False and result["errors"][0]["code"] == "SCHEMA"

    raw = _proposal(subsidiary=subsidiary_row.name)
    raw["questions"][0]["answers"] = raw["questions"][0]["answers"][:1]
    result, _row = _validate(db_session, admin_user, raw)
    assert "TOO_FEW" in {e["code"] for e in result["errors"]}


def test_standard_user_subsidiary_cannot_be_widened(db_session, standard_user, other_subsidiary_row, project_code_row, fake_mcp):
    result, row = _validate(db_session, standard_user, _proposal(subsidiary=other_subsidiary_row.name, projectCode=project_code_row.code))
    assert result["valid"] is True
    assert row.subsidiaryId == standard_user.subsidiaryId
    assert any(w["code"] == "IGNORED" for w in result["warnings"])


def test_standard_user_needs_a_project_code(db_session, standard_user, fake_mcp):
    result, _row = _validate(db_session, standard_user, _proposal())
    assert {"path": "projectCode", "code": "REQUIRED"}.items() <= next(e for e in result["errors"] if e["path"] == "projectCode").items()


# --- approval gate -----------------------------------------------------------------

def test_save_requires_explicit_approval(client, db_session, admin_user, subsidiary_row, fake_mcp):
    _result, row = _validate(db_session, admin_user, _proposal(subsidiary=subsidiary_row.name))
    headers = auth_headers(admin_user)

    assert client.post(f"/api/v1/ai/proposals/{row.id}/save", json={"approvalToken": "guess"}, headers=headers).status_code == 403

    approved = client.post(f"/api/v1/ai/proposals/{row.id}/approve", headers=headers)
    assert approved.status_code == 200
    token = approved.json()["approvalToken"]
    assert client.post(f"/api/v1/ai/proposals/{row.id}/save", json={"approvalToken": token + "x"}, headers=headers).status_code == 403

    saved = client.post(f"/api/v1/ai/proposals/{row.id}/save", json={"approvalToken": token}, headers=headers)
    assert saved.status_code == 200, saved.text
    form_id = saved.json()["formId"]
    assert saved.json()["route"] == f"/admin/form-builder/{form_id}"

    from app.services.form_builder_service import get_form_detail

    draft = get_form_detail(db_session, form_id)["draft"]["definition"]
    assert [q.headingByLocale[draft.meta.defaultLocale] for q in draft.questions] == ["Which TV model?", "Anything else?"]
    assert [q.id for q in draft.questions] == ["Q1", "Q2"]

    # One-time: the same token can't save twice.
    assert client.post(f"/api/v1/ai/proposals/{row.id}/save", json={"approvalToken": token}, headers=headers).status_code == 409


def test_draft_changed_after_approval_needs_new_approval(client, db_session, admin_user, subsidiary_row, fake_mcp):
    conversation_id = str(uuid.uuid4())
    _r1, v1 = _validate(db_session, admin_user, _proposal(subsidiary=subsidiary_row.name), conversation_id)
    headers = auth_headers(admin_user)
    token = client.post(f"/api/v1/ai/proposals/{v1.id}/approve", headers=headers).json()["approvalToken"]

    _r2, v2 = _validate(db_session, admin_user, _proposal(subsidiary=subsidiary_row.name, name="Changed"), conversation_id)
    assert v2.version == 2
    assert client.post(f"/api/v1/ai/proposals/{v1.id}/save", json={"approvalToken": token}, headers=headers).status_code == 409


def test_tampered_proposal_cannot_be_saved(client, db_session, admin_user, subsidiary_row, fake_mcp):
    _result, row = _validate(db_session, admin_user, _proposal(subsidiary=subsidiary_row.name))
    headers = auth_headers(admin_user)
    token = client.post(f"/api/v1/ai/proposals/{row.id}/approve", headers=headers).json()["approvalToken"]
    db_session.execute(update(AIFormProposal).where(AIFormProposal.id == row.id).values(proposalJson=row.proposalJson.replace("Anything else?", "Injected")))
    db_session.commit()
    assert client.post(f"/api/v1/ai/proposals/{row.id}/save", json={"approvalToken": token}, headers=headers).status_code == 409


def test_another_user_cannot_approve(client, db_session, standard_user, project_code_row, other_standard_user, fake_mcp):
    _result, row = _validate(db_session, standard_user, _proposal(projectCode=project_code_row.code))
    response = client.post(f"/api/v1/ai/proposals/{row.id}/approve", headers=auth_headers(other_standard_user))
    assert response.status_code == 404


def test_no_llm_tool_can_save():
    names = {t["function"]["name"] for t in aiAssistantService.chat_tools(True)}
    assert not names & {"save_draft_form", "create_campaign", "clone_campaign", "CREATE_CAMPAIGN", "CLONE_CAMPAIGN"}


# --- legacy clone action scope fix --------------------------------------------------

def test_clone_action_rejects_a_source_form_outside_the_users_scope(db_session, standard_user, admin_user, other_subsidiary_row):
    from app.services import form_builder_service

    foreign = form_builder_service.create_form(db_session, name="Foreign", subsidiary_id=other_subsidiary_row.name, user_id=admin_user.id)
    conversation = AIConversation(id=str(uuid.uuid4()), userId=standard_user.id, title="t", status="active")
    db_session.add(conversation)
    db_session.flush()
    action = AIAction(id=str(uuid.uuid4()), conversationId=conversation.id, userId=standard_user.id, actionType="CLONE_CAMPAIGN",
                      requestJson=json.dumps({"sourceFormId": foreign["id"], "name": "Stolen"}))
    db_session.add(action)
    db_session.commit()

    with pytest.raises(ValueError):
        asyncio.run(aiAssistantService.confirm_action(db_session, _auth(standard_user), action.id))
    assert db_session.execute(select(AIAction.confirmed).where(AIAction.id == action.id)).scalar() is False
