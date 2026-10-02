"""ai_proposal_service.revise_proposal: the user's own inline edit of a
proposal (ProposalCard checkboxes/text fields) — applies directly to the
proposal's own stored JSON and re-validates, with no LLM call involved."""

from __future__ import annotations

import asyncio
import uuid

import pytest

from app.errors import ConflictError, NotFoundError
from app.services import ai_proposal_service


def _auth(user) -> dict:
    return {"sub": user.id, "username": user.username, "role": user.role, "subsidiaryId": user.subsidiaryId}


def _proposal(**overrides) -> dict:
    return {
        "name": "New hand raiser", "projectCode": None, "subsidiary": None, "baseFormId": None,
        "questions": [
            {"id": None, "sourceFormId": None, "sourceQuestionId": None, "controlType": "radio", "required": True,
             "heading": "Which TV model?", "subheading": None,
             "answers": [{"id": None, "sourceAnswerId": None, "text": "QLED"}, {"id": None, "sourceAnswerId": None, "text": "OLED"}]},
            {"id": None, "sourceFormId": None, "sourceQuestionId": None, "controlType": "text", "required": False,
             "heading": "Anything else?", "subheading": None, "answers": []},
        ],
        **overrides,
    }


def _validate(db_session, user, raw, conversation_id=None):
    return asyncio.run(ai_proposal_service.validate_form(db_session, _auth(user), conversation_id or str(uuid.uuid4()), raw))


def _revise(db_session, user, proposal_id, question_patches):
    return asyncio.run(ai_proposal_service.revise_proposal(db_session, _auth(user), proposal_id, question_patches))


def _keep(**overrides):
    return {"keep": True, **overrides}


def test_revise_drops_a_question(db_session, standard_user):
    _result, row = _validate(db_session, standard_user, _proposal())
    result = _revise(db_session, standard_user, row.id, [{"keep": False}, _keep()])
    assert result["valid"] is True
    assert result["version"] == 2
    assert [q["heading"] for q in result["questions"]] == ["Anything else?"]


def test_revise_edits_heading_and_answer_text(db_session, standard_user):
    _result, row = _validate(db_session, standard_user, _proposal())
    patches = [
        _keep(heading="Which TV size?", answers=[{"keep": True, "text": "55 inch"}, _keep()]),
        _keep(),
    ]
    result = _revise(db_session, standard_user, row.id, patches)
    assert result["valid"] is True
    q0 = result["questions"][0]
    assert q0["heading"] == "Which TV size?"
    assert q0["answers"] == ["55 inch", "OLED"]


def test_revise_rejects_dropping_a_choice_answer_below_two(db_session, standard_user):
    _result, row = _validate(db_session, standard_user, _proposal())
    patches = [_keep(answers=[{"keep": False}, _keep()]), _keep()]
    result = _revise(db_session, standard_user, row.id, patches)
    assert result["valid"] is False
    assert any(e["code"] == "TOO_FEW" for e in result["errors"])


def test_revise_rejects_dropping_every_question(db_session, standard_user):
    _result, row = _validate(db_session, standard_user, _proposal())
    result = _revise(db_session, standard_user, row.id, [{"keep": False}, {"keep": False}])
    assert result["valid"] is False
    assert result["errors"][0]["code"] == "TOO_FEW"


def test_revise_rejects_a_length_mismatched_patch(db_session, standard_user):
    _result, row = _validate(db_session, standard_user, _proposal())
    with pytest.raises(ConflictError):
        _revise(db_session, standard_user, row.id, [_keep()])


def test_revise_rejects_a_stale_version(db_session, standard_user):
    conversation_id = str(uuid.uuid4())
    _r1, v1 = _validate(db_session, standard_user, _proposal(), conversation_id)
    _r2, _v2 = _validate(db_session, standard_user, _proposal(name="Changed"), conversation_id)
    with pytest.raises(ConflictError):
        _revise(db_session, standard_user, v1.id, [_keep(), _keep()])


def test_revise_rejects_an_already_saved_proposal(db_session, admin_user, subsidiary_row):
    _result, row = _validate(db_session, admin_user, _proposal(subsidiary=subsidiary_row.name))
    approved = ai_proposal_service.approve_proposal(db_session, _auth(admin_user), row.id)
    asyncio.run(ai_proposal_service.save_draft_form(db_session, _auth(admin_user), row.id, approved["approvalToken"]))
    with pytest.raises(ConflictError):
        _revise(db_session, admin_user, row.id, [_keep(), _keep()])


def test_another_user_cannot_revise(db_session, standard_user, other_standard_user):
    _result, row = _validate(db_session, standard_user, _proposal())
    with pytest.raises(NotFoundError):
        _revise(db_session, other_standard_user, row.id, [_keep(), _keep()])


def test_standard_user_cannot_use_a_hand_raiser_project_code(db_session, standard_user):
    from app.models.project_code import ProjectCode

    code = ProjectCode(code=f"PYTEST-HR-{uuid.uuid4().hex[:8]}", isOpen=True, isLocked=False, category="handRaiser")
    db_session.add(code)
    db_session.commit()

    result, row = _validate(db_session, standard_user, _proposal(projectCode=code.code))
    assert result["valid"] is False and row is None
    assert any(e["path"] == "projectCode" for e in result["errors"])


def test_admin_can_use_a_hand_raiser_project_code(db_session, admin_user, subsidiary_row):
    from app.models.project_code import ProjectCode

    code = ProjectCode(code=f"PYTEST-HR-{uuid.uuid4().hex[:8]}", isOpen=True, isLocked=False, category="handRaiser")
    db_session.add(code)
    db_session.commit()

    result, row = _validate(db_session, admin_user, _proposal(subsidiary=subsidiary_row.name, projectCode=code.code))
    assert result["valid"] is True and row is not None
