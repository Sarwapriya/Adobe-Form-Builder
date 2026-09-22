"""GET_CAMPAIGN/GET_CAMPAIGN_QUESTIONS (the AI assistant's fixed campaign-lookup
tools, see aiCampaignTools.py) previously returned each question's heading/type/
required but never its answer choices — so "what are the questions and answers in
campaign X" could never be answered even though the question list itself worked.
This locks in the fix: each question's `answers` now carries its option text."""

from __future__ import annotations

from app.form_pipeline import BuilderConfig, FormDefinition
from app.services import form_builder_service
from app.services.aiCampaignTools import AiToolCallerContext, get_campaign
from tests.form_builder.conftest import sample_config_json, sample_definition_json, unique_name


def test_get_campaign_includes_each_questions_answer_choices(db_session, admin_user, subsidiary_row):
    created = form_builder_service.create_form(
        db_session, name=unique_name("Form"), subsidiary_id=subsidiary_row.name, user_id=admin_user.id
    )
    form_builder_service.update_draft(
        db_session,
        created["id"],
        FormDefinition.model_validate(sample_definition_json(subsidiary_row.name)),
        BuilderConfig.model_validate(sample_config_json()),
    )

    ctx: AiToolCallerContext = {"userId": admin_user.id, "role": "admin", "subsidiaryId": None}
    campaign = get_campaign(db_session, ctx, {"formId": created["id"]})

    assert campaign is not None
    by_heading = {q["heading"]: q["answers"] for q in campaign["questions"]}
    assert by_heading["I am currently using"] == ["Galaxy", "iPhone"]
    assert by_heading["Any other comments?"] == []
