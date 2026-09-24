"""campaign_retrieval (direct path, real DB): the chatbot's campaign search,
details and question library read the backend's own database with the
session user's subsidiary scope, and project only allow-listed fields."""

from __future__ import annotations

import asyncio
import json
import uuid

import pytest
from sqlalchemy.orm import Session

from app.config import settings
from app.models.form import Form
from app.models.form_version import FormVersion
from app.models.subsidiary_project_block import SubsidiaryProjectBlock
from app.services import campaign_retrieval
from tests.form_builder.conftest import unique_name


@pytest.fixture(autouse=True)
def _direct(monkeypatch):
    monkeypatch.setattr(settings, "AI_RETRIEVAL_SOURCE", "direct")


def _definition(subsidiary: str, heading: str) -> str:
    return json.dumps({
        "meta": {"subsidiary": subsidiary, "defaultLocale": "en_GB", "sourceFileName": "secret-file.xlsx"},
        "locales": [{"code": "en_GB"}],
        "questions": [{
            "id": "Q1", "order": 1, "controlType": "radio", "required": True,
            "headingByLocale": {"en_GB": heading},
            "answers": [{"id": "A1", "order": 1, "textByLocale": {"en_GB": "QLED"}},
                        {"id": "A2", "order": 2, "textByLocale": {"en_GB": "OLED"}}],
        }],
        "fields": {"email": {"required": True}, "firstName": True},
    })


def _form(db: Session, creator_id: str, subsidiary: str, name: str, *, status="published", origin="admin",
          project_code=None, draft_heading=None, published_heading="Which TV model do you own?") -> Form:
    form = Form(name=name, subsidiaryId=subsidiary, projectCode=project_code, status=status, origin=origin,
                createdByUserId=creator_id, reviewNote="internal review note")
    db.add(form)
    db.flush()
    if status == "published":
        pub = FormVersion(formId=form.id, definition=_definition(subsidiary, published_heading), config="{}",
                          status="published", createdByUserId=creator_id)
        db.add(pub)
        db.flush()
        form.publishedVersionId = pub.id
    if draft_heading:
        draft = FormVersion(formId=form.id, definition=_definition(subsidiary, draft_heading), config="{}",
                            status="draft", createdByUserId=creator_id)
        db.add(draft)
        db.flush()
        form.currentDraftVersionId = draft.id
    db.commit()
    return form


def _auth(user) -> dict:
    return {"sub": user.id, "username": user.username, "role": user.role, "subsidiaryId": user.subsidiaryId}


def _call(db, name, args, auth):
    return asyncio.run(campaign_retrieval.call_campaign_tool(db, name, args, auth))


@pytest.fixture
def campaigns(db_session, admin_user, subsidiary_row, other_subsidiary_row, project_code_row):
    tag = unique_name("TVHR")
    own = _form(db_session, admin_user.id, subsidiary_row.name, f"{tag} Hand Raiser",
                draft_heading="UNPUBLISHED ADMIN EDIT")
    blocked_code = unique_name("BLK")
    blocked = _form(db_session, admin_user.id, subsidiary_row.name, f"{tag} Blocked", project_code=blocked_code)
    db_session.add(SubsidiaryProjectBlock(subsidiaryName=subsidiary_row.name, projectCode=blocked_code))
    other = _form(db_session, admin_user.id, other_subsidiary_row.name, f"{tag} Other Sub")
    adhoc = _form(db_session, admin_user.id, subsidiary_row.name, f"{tag} Adhoc Draft", status="draft",
                  origin="adhoc", draft_heading="Adhoc draft question about TV")
    db_session.commit()
    return {"tag": tag, "own": own, "blocked": blocked, "other": other, "adhoc": adhoc}


def _names(result):
    return {c["name"] for c in result["campaigns"]}


def test_standard_user_sees_only_own_unblocked_published_and_adhoc(db_session, standard_user, campaigns):
    result = _call(db_session, "search_previous_campaigns", {"query": campaigns["tag"]}, _auth(standard_user))
    tag = campaigns["tag"]
    assert _names(result) == {f"{tag} Hand Raiser", f"{tag} Adhoc Draft"}


def test_admin_sees_every_subsidiary(db_session, admin_user, campaigns):
    result = _call(db_session, "search_previous_campaigns", {"query": campaigns["tag"]}, _auth(admin_user))
    tag = campaigns["tag"]
    assert _names(result) == {f"{tag} Hand Raiser", f"{tag} Blocked", f"{tag} Other Sub", f"{tag} Adhoc Draft"}


def test_llm_subsidiary_argument_cannot_widen_scope(db_session, standard_user, other_subsidiary_row, campaigns):
    args = {"query": campaigns["tag"], "subsidiary": other_subsidiary_row.name}
    assert _call(db_session, "search_previous_campaigns", args, _auth(standard_user))["campaigns"] == []


def test_out_of_scope_details_look_like_not_found(db_session, standard_user, campaigns):
    auth = _auth(standard_user)
    for key in ("other", "blocked"):
        result = _call(db_session, "get_campaign_details", {"formId": campaigns[key].id}, auth)
        assert result == {"error": {"code": "NOT_FOUND", "message": "campaign not found"}}
    missing = _call(db_session, "get_campaign_details", {"formId": str(uuid.uuid4())}, auth)
    assert missing["error"]["code"] == "NOT_FOUND"


def test_standard_user_gets_published_version_not_admin_draft(db_session, standard_user, admin_user, campaigns):
    std = _call(db_session, "get_campaign_details", {"formId": campaigns["own"].id}, _auth(standard_user))
    assert std["questions"][0]["heading"] == "Which TV model do you own?"
    adm = _call(db_session, "get_campaign_details", {"formId": campaigns["own"].id}, _auth(admin_user))
    assert adm["questions"][0]["heading"] == "UNPUBLISHED ADMIN EDIT"


def test_details_are_allow_listed(db_session, admin_user, campaigns):
    details = _call(db_session, "get_campaign_details", {"formId": campaigns["own"].id}, _auth(admin_user))
    dumped = json.dumps(details)
    for leaked in ("internal review note", "secret-file.xlsx", admin_user.id, "createdByUserId", "reviewNote"):
        assert leaked not in dumped
    assert details["profileFields"] == [{"key": "email", "required": True}, {"key": "firstName"}]
    assert details["questions"][0]["answers"][1] == {"id": "A2", "order": 2, "text": "OLED"}


def test_hr_alias_matches_hand_raiser(db_session, admin_user, campaigns):
    result = _call(db_session, "search_previous_campaigns", {"query": "HR"}, _auth(admin_user))
    assert f"{campaigns['tag']} Hand Raiser" in _names(result)


def test_question_library_returns_source_ids_in_scope(db_session, standard_user, campaigns):
    result = _call(db_session, "search_question_library", {"text": "TV model"}, _auth(standard_user))
    # SQL Server returns uniqueidentifiers upper-cased; compare case-insensitively.
    sources = {(q["sourceFormId"].lower(), q["sourceQuestionId"]) for q in result["questions"]}
    assert (campaigns["own"].id.lower(), "Q1") in sources
    hidden = {campaigns["other"].id.lower(), campaigns["blocked"].id.lower()}
    assert all(form_id not in hidden for form_id, _q in sources)


def test_user_without_subsidiary_sees_nothing(db_session, campaigns):
    auth = {"sub": str(uuid.uuid4()), "username": "x", "role": "standard", "subsidiaryId": None}
    assert _call(db_session, "search_previous_campaigns", {"query": campaigns["tag"]}, auth)["campaigns"] == []


def test_bad_arguments_return_errors_not_exceptions(db_session, admin_user):
    auth = _auth(admin_user)
    assert _call(db_session, "search_previous_campaigns", {"status": "bogus"}, auth)["error"]["code"] == "BAD_ARGUMENT"
    assert _call(db_session, "search_previous_campaigns", {"sql": "SELECT 1"}, auth)["error"]["code"] == "BAD_ARGUMENT"
    assert _call(db_session, "execute_sql_query", {}, auth)["error"]["code"] == "UNKNOWN_TOOL"
