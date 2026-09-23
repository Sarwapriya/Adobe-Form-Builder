"""GET_CAMPAIGN/GET_CAMPAIGN_QUESTIONS/SEARCH_QUESTIONS (the AI assistant's
fixed campaign-lookup tools, see aiCampaignTools.py -- the chatbot's sole
grounding in real data, with MCP-SQL off) previously returned each question's
heading/type/required but never its answer choices, so "what are the
answers in campaign X" could never be answered even though the question list
itself worked. This locks in the fix: each question's `answers` now carries
its option text, and SEARCH_QUESTIONS matches against answer text too, not
just headings -- "search campaign content", not just campaign/question names.
"""

from __future__ import annotations

from app.form_pipeline import BuilderConfig, FormDefinition
from app.services import form_builder_service
from app.services.aiCampaignTools import AiToolCallerContext, get_campaign, search_questions
from tests.form_builder.conftest import sample_config_json, sample_definition_json, unique_name


def _seed_sample_form(db_session, admin_user, subsidiary_row) -> str:
    created = form_builder_service.create_form(
        db_session, name=unique_name("Form"), subsidiary_id=subsidiary_row.name, user_id=admin_user.id
    )
    form_builder_service.update_draft(
        db_session,
        created["id"],
        FormDefinition.model_validate(sample_definition_json(subsidiary_row.name)),
        BuilderConfig.model_validate(sample_config_json()),
    )
    return created["id"]


def test_get_campaign_includes_each_questions_answer_choices(db_session, admin_user, subsidiary_row):
    form_id = _seed_sample_form(db_session, admin_user, subsidiary_row)
    ctx: AiToolCallerContext = {"userId": admin_user.id, "role": "admin", "subsidiaryId": None}
    campaign = get_campaign(db_session, ctx, {"formId": form_id})

    assert campaign is not None
    by_heading = {q["heading"]: q["answers"] for q in campaign["questions"]}
    assert by_heading["I am currently using"] == ["Galaxy", "iPhone"]
    assert by_heading["Any other comments?"] == []


def test_search_questions_matches_answer_text_not_just_headings(db_session, admin_user, subsidiary_row):
    form_id = _seed_sample_form(db_session, admin_user, subsidiary_row)
    ctx: AiToolCallerContext = {"userId": admin_user.id, "role": "admin", "subsidiaryId": None}

    # "Galaxy" appears only in an answer choice, never in any question heading.
    results = search_questions(db_session, ctx, {"searchText": "galaxy", "formId": form_id})

    assert len(results) == 1
    assert results[0]["heading"] == "I am currently using"
    assert results[0]["answers"] == ["Galaxy", "iPhone"]
