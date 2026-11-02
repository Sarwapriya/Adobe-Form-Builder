"""Surgically merges an added/removed question into a hand-edited HTML file,
instead of publish_form having to choose between discarding the hand-edit or
blocking with a confirmation. Possible because of how the HTML is built:
every question is its own self-contained, uniquely-`id`-tagged block
(`<div class="form_check_module" id="Q3">...</div>`), concatenated directly
inside `<div class="form_check_group">...</div>` — see
`render_question_module.py`/`page_template.py`'s `render_page` — and that
`id` is the question's own stable field, never derived from its position, so
removing/inserting one question's block never shifts any other question's
identity.

An *answer's* DOM id, by contrast, is derived from its `order` (see
`question_input_id` in `dom_ids.py`): removing one answer from the middle of
a question renumbers every later answer's `order`, which changes their DOM
ids too — not just the removed one's. Patching a single answer block in
place would silently leave the wrong ids/values on every answer after it, so
answer-level changes are deliberately NOT surgically merged here; they're
still correctly *detected* (via `structure_fingerprint`'s own `answers` key)
so the existing warn-and-confirm flow catches them instead of silently
missing them, same as any other change this module can't safely handle.

Every function here is pure (no DB/disk access) and deliberately
conservative: the moment an expected anchor (a question's own id, or the
`form_check_group` container itself) can't be found — because the admin's
hand-edit already altered that exact region, or the file predates this
feature and has some other shape — `patch_html_for_question_diff` returns
`None` rather than guess, and the caller falls back to the existing
warn-and-confirm flow for that one file. Field/consent changes (mobile
number, additional consents, etc.) are out of scope here too — several of
them share one wrapper div between two fields (firstName/lastName,
callingCode/mobileNumber) in a way that isn't safely patchable without the
same risk of guessing wrong — those also keep using the existing flow.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Literal, Optional

from app.form_pipeline.codegen.escaping import escape_html
from app.form_pipeline.codegen.html.fragments.render_question_module import render_question_module
from app.form_pipeline.form.definition import FormDefinition

_FORM_CHECK_GROUP_OPEN_RE = re.compile(r'<div\s+class="form_check_group">')
_DIV_OPEN_RE = re.compile(r"<div\b", re.IGNORECASE)
_DIV_CLOSE_RE = re.compile(r"</div\s*>", re.IGNORECASE)


@dataclass
class QuestionDiff:
    """What changed between the structure a hand-edited file's questions
    currently match (`old_structure`, the editable version's parsed
    `structureFingerprint`) and the new definition about to be published."""

    # Ids of questions present in the new definition but not the old
    # structure, in the new definition's own list order (so inserting them
    # in this order, each relative to whatever's already in the file,
    # produces the same left-to-right order a fresh generation would).
    added_question_ids: list[str] = field(default_factory=list)
    # Ids of questions present in the old structure but not the new definition.
    removed_question_ids: list[str] = field(default_factory=list)
    # Ids of questions present in both whose own answer set changed —
    # surgical merge can't safely handle this (see module doc comment), so
    # any entry here means patch_html_for_question_diff always returns None.
    questions_with_changed_answers: list[str] = field(default_factory=list)

    @property
    def is_patchable(self) -> bool:
        """False whenever there's any structural change this module can't
        safely merge (only an answer-set change, today) — the caller should
        skip trying to patch at all and go straight to the existing
        warn-and-confirm/regenerate flow."""
        return not self.questions_with_changed_answers


def diff_questions(old_structure: dict, new_definition: FormDefinition) -> QuestionDiff:
    """`old_structure` is `json.loads(...)` of a previously-stored
    `compute_structure_fingerprint` result — `{"questions": [...ids],
    "answers": {qid: [...answer ids]}, ...}` (extra keys, e.g. "fields"/
    "consents", are ignored here)."""
    old_question_ids = set(old_structure.get("questions") or [])
    old_answers_by_question: dict[str, list[str]] = old_structure.get("answers") or {}

    new_questions_in_order = list(new_definition.questions)
    new_question_ids = {q.id for q in new_questions_in_order}

    added_question_ids = [q.id for q in new_questions_in_order if q.id not in old_question_ids]
    removed_question_ids = sorted(old_question_ids - new_question_ids)

    questions_with_changed_answers = [
        q.id
        for q in new_questions_in_order
        if q.id in old_question_ids and sorted(a.id for a in q.answers) != sorted(old_answers_by_question.get(q.id, []))
    ]

    return QuestionDiff(
        added_question_ids=added_question_ids,
        removed_question_ids=removed_question_ids,
        questions_with_changed_answers=questions_with_changed_answers,
    )


def _find_balanced_div(html: str, open_tag_match: "re.Match[str]") -> Optional[tuple[int, int]]:
    """Given a match of a `<div ...>` opening tag, returns (start, end) of the
    whole balanced element (including the opening and matching closing tag),
    scanning forward and counting nested `<div` opens against `</div>`
    closes. Returns None if the file runs out before balancing — meaning the
    hand-edited HTML's own structure here isn't what was expected, so the
    caller should not touch it."""
    depth = 1
    pos = open_tag_match.end()
    while depth > 0:
        next_open = _DIV_OPEN_RE.search(html, pos)
        next_close = _DIV_CLOSE_RE.search(html, pos)
        if next_close is None:
            return None
        if next_open is not None and next_open.start() < next_close.start():
            depth += 1
            pos = next_open.end()
        else:
            depth -= 1
            pos = next_close.end()
    return open_tag_match.start(), pos


def _find_element_by_id(html: str, element_id: str) -> Optional[tuple[int, int]]:
    """Finds the `<div ...>` whose own opening tag carries `id="{element_id}"`
    (escaped the same way render_question_module escapes question ids), and
    returns its balanced (start, end) span. None if not found, or found but
    unbalanced."""
    pattern = re.compile(r'<div\b[^>]*\bid="' + re.escape(escape_html(element_id)) + r'"[^>]*>')
    match = pattern.search(html)
    if match is None:
        return None
    return _find_balanced_div(html, match)


def patch_html_for_question_diff(
    html: str, diff: QuestionDiff, new_definition: FormDefinition, variant: Literal["ff", "oc"]
) -> Optional[str]:
    """Applies `diff` to `html`: removes each removed question's whole
    module, then inserts each added question's fresh module at the position
    a full regeneration would have put it. Returns the patched HTML, or
    None the moment the diff includes a change this module can't safely
    merge (see `QuestionDiff.is_patchable`) or any step can't find its
    expected anchor — signaling the caller to fall back to the existing
    warn-and-confirm flow for this file instead of guessing."""
    if not diff.is_patchable:
        return None

    questions_by_id = {q.id: q for q in new_definition.questions}

    for removed_id in diff.removed_question_ids:
        span = _find_element_by_id(html, removed_id)
        if span is None:
            continue  # already absent from this hand-edited file — nothing to do
        start, end = span
        html = html[:start] + html[end:]

    new_ids_in_order = [q.id for q in new_definition.questions]
    added_set = set(diff.added_question_ids)
    for added_id in diff.added_question_ids:
        q = questions_by_id.get(added_id)
        if q is None:
            return None
        if q.visibleInVariants and variant not in q.visibleInVariants:
            continue  # this file's variant never shows this question — nothing to insert here

        fragment = render_question_module(q)
        position_in_new_list = new_ids_in_order.index(added_id)
        # Walk backward through the new list looking for the nearest earlier
        # question whose module is actually present in the file to anchor
        # on — skipping ids that were also just added (not inserted into
        # `html` yet at this point in the loop) and any that simply don't
        # render in this variant (so their module was never present at all).
        insert_at: Optional[int] = None
        for candidate_id in reversed(new_ids_in_order[:position_in_new_list]):
            if candidate_id in added_set:
                continue
            span = _find_element_by_id(html, candidate_id)
            if span is not None:
                insert_at = span[1]
                break
        if insert_at is None:
            group_match = _FORM_CHECK_GROUP_OPEN_RE.search(html)
            if group_match is None:
                return None
            insert_at = group_match.end()
        html = html[:insert_at] + fragment + html[insert_at:]

    return html
