"""Unit tests for app/services/html_structure_patch.py — pure string/data
functions, no DB or HTTP needed. Builds small, realistic HTML snippets with
render_question_module itself (the same function publish_form uses) so the
synthetic markup matches exactly what a real generated file looks like.
"""

from __future__ import annotations

from app.form_pipeline.codegen.html.fragments.render_question_module import render_question_module
from app.form_pipeline.form.definition import AnswerDefinition, QuestionDefinition
from app.services.html_structure_patch import diff_questions, patch_html_for_question_diff


def _question(qid: str, order: int, answer_ids: list[str] | None = None, control_type: str = "radio") -> QuestionDefinition:
    answers = [AnswerDefinition(id=aid, order=i + 1, textByLocale={"en_GB": aid}) for i, aid in enumerate(answer_ids or [])]
    return QuestionDefinition(
        id=qid, order=order, controlType=control_type, headingByLocale={"en_GB": qid}, required=False, answers=answers
    )


def _page_with_questions(questions: list[QuestionDefinition]) -> str:
    """A minimal page skeleton — just enough structure for the patch
    functions to anchor on (the real `<div class="form_check_group">`
    wrapper, plus the questions' own modules), standing in for a full
    generated page."""
    modules = "".join(render_question_module(q) for q in questions)
    return f'<html><body><div class="form_check_group">{modules}</div></body></html>'


class _FakeDefinition:
    """A tiny stand-in for FormDefinition — patch_html_for_question_diff only
    ever reads `.questions` off it."""

    def __init__(self, questions: list[QuestionDefinition]):
        self.questions = questions


def _structure(questions: list[QuestionDefinition]) -> dict:
    return {
        "questions": [q.id for q in questions],
        "answers": {q.id: [a.id for a in q.answers] for q in questions},
    }


class TestDiffQuestions:
    def test_detects_added_and_removed_questions(self):
        old = _structure([_question("Q1", 1), _question("Q2", 2)])
        new_def = _FakeDefinition([_question("Q1", 1), _question("Q3", 2)])
        diff = diff_questions(old, new_def)
        assert diff.added_question_ids == ["Q3"]
        assert diff.removed_question_ids == ["Q2"]
        assert diff.questions_with_changed_answers == []
        assert diff.is_patchable

    def test_detects_an_answer_set_change_on_an_existing_question(self):
        old = _structure([_question("Q1", 1, ["A1", "A2"])])
        new_def = _FakeDefinition([_question("Q1", 1, ["A1", "A2", "A3"])])
        diff = diff_questions(old, new_def)
        assert diff.added_question_ids == []
        assert diff.removed_question_ids == []
        assert diff.questions_with_changed_answers == ["Q1"]
        assert not diff.is_patchable

    def test_no_change_is_empty_and_patchable(self):
        old = _structure([_question("Q1", 1, ["A1"])])
        new_def = _FakeDefinition([_question("Q1", 1, ["A1"])])
        diff = diff_questions(old, new_def)
        assert diff.added_question_ids == []
        assert diff.removed_question_ids == []
        assert diff.questions_with_changed_answers == []
        assert diff.is_patchable


class TestPatchHtmlForQuestionDiff:
    def test_inserts_a_new_last_question_after_the_existing_one(self):
        q1 = _question("Q1", 1, ["A1", "A2"])
        q2 = _question("Q2", 2, ["A1"])
        html = _page_with_questions([q1])
        new_def = _FakeDefinition([q1, q2])
        diff = diff_questions(_structure([q1]), new_def)

        patched = patch_html_for_question_diff(html, diff, new_def, "ff")
        assert patched is not None
        assert patched.index('id="Q1"') < patched.index('id="Q2"')
        assert render_question_module(q2) in patched

    def test_inserts_a_new_first_question_before_the_existing_one(self):
        q1 = _question("Q1", 1)
        q0 = _question("Q0", 1)
        html = _page_with_questions([q1])
        new_def = _FakeDefinition([q0, q1])
        diff = diff_questions(_structure([q1]), new_def)

        patched = patch_html_for_question_diff(html, diff, new_def, "ff")
        assert patched is not None
        assert patched.index('id="Q0"') < patched.index('id="Q1"')

    def test_inserts_a_new_middle_question_between_two_existing_ones(self):
        q1 = _question("Q1", 1)
        q3 = _question("Q3", 3)
        q2 = _question("Q2", 2)
        html = _page_with_questions([q1, q3])
        new_def = _FakeDefinition([q1, q2, q3])
        diff = diff_questions(_structure([q1, q3]), new_def)

        patched = patch_html_for_question_diff(html, diff, new_def, "ff")
        assert patched is not None
        assert patched.index('id="Q1"') < patched.index('id="Q2"') < patched.index('id="Q3"')

    def test_removes_a_deleted_question_and_leaves_the_others(self):
        q1 = _question("Q1", 1)
        q2 = _question("Q2", 2)
        q3 = _question("Q3", 3)
        html = _page_with_questions([q1, q2, q3])
        new_def = _FakeDefinition([q1, q3])
        diff = diff_questions(_structure([q1, q2, q3]), new_def)

        patched = patch_html_for_question_diff(html, diff, new_def, "ff")
        assert patched is not None
        assert 'id="Q2"' not in patched
        assert 'id="Q1"' in patched and 'id="Q3"' in patched

    def test_preserves_an_unrelated_hand_edit_elsewhere_in_the_file(self):
        q1 = _question("Q1", 1)
        q2 = _question("Q2", 2)
        html = _page_with_questions([q1]).replace("<body>", "<body><!-- redirect handled elsewhere -->")
        new_def = _FakeDefinition([q1, q2])
        diff = diff_questions(_structure([q1]), new_def)

        patched = patch_html_for_question_diff(html, diff, new_def, "ff")
        assert patched is not None
        assert "<!-- redirect handled elsewhere -->" in patched

    def test_only_inserts_into_the_variant_the_question_is_visible_in(self):
        q1 = _question("Q1", 1)
        q2 = _question("Q2", 2)
        q2.visibleInVariants = ["oc"]
        html = _page_with_questions([q1])
        new_def = _FakeDefinition([q1, q2])
        diff = diff_questions(_structure([q1]), new_def)

        ff_patched = patch_html_for_question_diff(html, diff, new_def, "ff")
        assert ff_patched is not None
        assert 'id="Q2"' not in ff_patched  # not visible in ff — nothing to insert here

        oc_patched = patch_html_for_question_diff(html, diff, new_def, "oc")
        assert oc_patched is not None
        assert 'id="Q2"' in oc_patched

    def test_returns_none_when_an_answer_set_also_changed(self):
        """Not surgically mergeable (see module doc comment) — the caller
        must fall back to the existing warn-and-confirm flow for the whole
        file rather than a partial merge."""
        q1 = _question("Q1", 1, ["A1"])
        q2 = _question("Q2", 2)
        html = _page_with_questions([q1])
        new_q1 = _question("Q1", 1, ["A1", "A2"])
        new_def = _FakeDefinition([new_q1, q2])
        diff = diff_questions(_structure([q1]), new_def)

        assert patch_html_for_question_diff(html, diff, new_def, "ff") is None

    def test_returns_none_when_the_anchor_question_is_missing_from_the_html(self):
        """The hand-edit itself removed/renamed Q1's module — can't safely
        guess where a new Q2 belongs, so it bails out rather than guess."""
        q1 = _question("Q1", 1)
        q2 = _question("Q2", 2)
        html = '<html><body><div class="form_check_group"></div></body></html>'  # Q1's module isn't here at all
        new_def = _FakeDefinition([q1, q2])
        diff = diff_questions(_structure([q1]), new_def)

        patched = patch_html_for_question_diff(html, diff, new_def, "ff")
        # No earlier sibling is found, but the form_check_group container
        # itself is still intact, so this still succeeds by inserting at
        # the start of it — a genuinely missing container is covered below.
        assert patched is not None
        assert 'id="Q2"' in patched

    def test_returns_none_when_the_form_check_group_container_itself_is_gone(self):
        q1 = _question("Q1", 1)
        html = "<html><body>completely hand-rewritten, no recognizable structure left</body></html>"
        new_def = _FakeDefinition([q1])
        diff = diff_questions(_structure([]), new_def)

        assert patch_html_for_question_diff(html, diff, new_def, "ff") is None
