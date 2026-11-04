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

`patch_html_for_field_diff` applies the same philosophy to the profile-field
group (`.form_top_group`) and the consent-checkbox group
(`.form_bottom_check_group`/terms-and-conditions link) — turning email,
first/last name, calling-code+mobile-number, privacy policy, marketing
opt-in, additional consents, or the T&C link on or off is reconciled
directly against each unit's own marker id (the id actually present or
absent in the hand-edited file, not just what the old fingerprint claimed),
so it self-corrects even if the file already drifted slightly. firstName and
lastName share one `.form_text_group` wrapper that must itself appear/
disappear exactly when *both* go from absent to present or vice versa (see
`_patch_name_pair`); callingCode and mobileNumber are rendered as a single
indivisible block regardless of which one of the two actually changed (see
`_patch_mobile_group`) — mirroring `render_profile_fields` exactly, so
there's never a partial/half-rendered profile field left behind.

Every function here is pure (no DB/disk access) and deliberately
conservative: the moment an expected anchor (a question's own id, the
`form_check_group`/`form_top_group`/`form_bottom_group` container, or the
`form_text_group`/`form_bottom_check_group` wrapper) can't be found —
because the admin's hand-edit already altered that exact region, or the
file predates this feature and has some other shape — these functions
return `None` rather than guess, and the caller falls back to the existing
warn-and-confirm flow for that one file. A *property* changing on an
already-present field/question/consent (e.g. toggling `required`, or
`visibleInVariants`) is not detected as a structural change at all (see
`compute_structure_fingerprint`'s own doc comment) and so never reaches this
module — only presence/absence (added/removed) is in scope here, consistent
with how question/answer changes are already scoped.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Callable, Literal, Optional

from app.form_pipeline.codegen.escaping import escape_html
from app.form_pipeline.codegen.html.fragments.render_profile_field import render_profile_fields
from app.form_pipeline.codegen.html.fragments.render_question_module import render_question_module
from app.form_pipeline.codegen.html.page_template import (
    _RECAPTCHA_API_SCRIPT,
    _SUBMIT_INTENT_POPUP,
    _recaptcha_widget,
    _terms_link,
)
from app.form_pipeline.form.definition import (
    CallingCodeFieldMeta,
    ConsentDefinition,
    FormDefinition,
    LocalizedFieldMeta,
    MobileNumberFieldMeta,
)

_FORM_CHECK_GROUP_OPEN_RE = re.compile(r'<div\s+class="form_check_group">')
_FORM_TOP_GROUP_OPEN_RE = re.compile(r'<div\s+class="form_top_group">')
_FORM_BOTTOM_GROUP_OPEN_RE = re.compile(r'<div\s+class="form_bottom_group">')
_BOTTOM_CHECK_GROUP_OPEN_RE = re.compile(r'<div\s+class="form_bottom_check_group">')
_NAME_GROUP_OPEN_RE = re.compile(r'<div\s+class="form_text_group">')
_TERMS_LINK_RE = re.compile(r'<a\b[^>]*\bid="termsAndConditionsLink"[^>]*>.*?</a>', re.DOTALL)
# Both the widget and its API <script> tag are fixed, content-free fragments
# (see page_template.py's own _recaptcha_widget()/_RECAPTCHA_API_SCRIPT) —
# matched as a single literal regex rather than via the balanced-div
# scanner, same reasoning as _TERMS_LINK_RE.
_RECAPTCHA_WIDGET_RE = re.compile(
    r'<div class="g-recaptcha" id="g-recaptcha"></div><div class="error" id="reCaptchaRequired" style="display:none"></div>'
)
_RECAPTCHA_SCRIPT_RE = re.compile(re.escape(_RECAPTCHA_API_SCRIPT))
# Also a fixed, content-free fragment (see page_template.py's own
# _SUBMIT_INTENT_POPUP doc comment) — same literal-match treatment.
_SUBMIT_INTENT_POPUP_RE = re.compile(re.escape(_SUBMIT_INTENT_POPUP))
_HEAD_CLOSE_RE = re.compile(r"</head>", re.IGNORECASE)
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


def _find_enclosing_div(html: str, pos: int) -> Optional[tuple[int, int]]:
    """The smallest `<div>...</div>` span that contains character offset
    `pos` — found by scanning every `<div` open tag before `pos` and keeping
    the *last* (nearest, hence smallest, for well-formed nested HTML) one
    whose balanced span still encloses `pos`. None if no div encloses it."""
    best: Optional[tuple[int, int]] = None
    for open_match in _DIV_OPEN_RE.finditer(html, 0, pos):
        span = _find_balanced_div(html, open_match)
        if span is not None and span[0] <= pos <= span[1]:
            best = span
    return best


def _find_element_by_id(html: str, element_id: str) -> Optional[tuple[int, int]]:
    """Finds wherever `id="{element_id}"` (escaped the same way
    render_question_module/render_profile_fields escape ids) actually sits —
    on a `<div>` itself (question modules carry their id directly) or on a
    descendant `<input>`/`<select>` (every profile field and consent
    checkbox does instead) — and returns the smallest enclosing `<div>`'s
    balanced (start, end) span either way. None if the id isn't found, or
    found but no enclosing div balances."""
    pattern = re.compile(r'\bid="' + re.escape(escape_html(element_id)) + r'"')
    match = pattern.search(html)
    if match is None:
        return None
    return _find_enclosing_div(html, match.start())


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


def diff_consents(old_structure: dict, new_definition: FormDefinition) -> list[str]:
    """Additional-consent ids the old structure had that the new definition
    doesn't — candidates to look for and remove. (Added ids need no such
    list: they're read straight off `new_definition.fields.additionalConsents`
    by `_patch_consent_group`. privacyPolicy/marketingOptin need no list
    either — their presence is a plain field, discoverable the same way on
    both the old and new side without needing the stored fingerprint at
    all.)"""
    old_consent_ids = set(old_structure.get("consents") or [])
    new_consent_ids = {c.id for c in (new_definition.fields.additionalConsents or [])}
    return sorted(old_consent_ids - new_consent_ids)


def _render_privacy_policy_fragment(required: Optional[bool]) -> str:
    """Must stay byte-identical to page_template.py's own privacyPolicy
    consent_checks branch."""
    star = '<span class="star">*</span>' if required is not False else ""
    return (
        '<div class="form_bottom_check">'
        '<input id="privacyPolicy" name="privacyPolicy" type="checkbox" data-pt-api="y">'
        f'<label for="privacyPolicy"><span></span>{star}<br>'
        '<a href="#" target="_blank" id="privacyPolicyLink"><span></span><img src="" alt=""></a></label>'
        "</div>"
    )


def _render_marketing_optin_fragment(required: Optional[bool]) -> str:
    """Must stay byte-identical to page_template.py's own marketingOptin
    consent_checks branch."""
    star = '<span class="star">*</span>' if required else ""
    return (
        '<div class="form_bottom_check form_bottom_check2">'
        '<input id="subscribe" name="subscribe" type="checkbox" data-pt-api="y">'
        f'<label for="subscribe"><span></span>{star}</label>'
        "</div>"
    )


def _render_additional_consent_fragment(consent: ConsentDefinition) -> str:
    """Must stay byte-identical to page_template.py's own additionalConsents
    consent_checks branch."""
    cid = escape_html(consent.id)
    link = f'<br><a href="#" target="_blank" id="{cid}Link"><span></span></a>' if consent.linkUrlByLocale else ""
    star = '<span class="star">*</span>' if consent.required else ""
    return (
        '<div class="form_bottom_check form_bottom_check2">'
        f'<input id="{cid}" name="{cid}" type="checkbox" data-pt-api="y">'
        f'<label for="{cid}"><span></span>{link}{star}</label>'
        "</div>"
    )


def _find_form_text_bx_wrapper(html: str, element_id: str) -> Optional[tuple[int, int]]:
    """Every `.form_top_group` profile field (`render_profile_fields`) wraps
    its `<input>`/`<select>` in one or two more levels of `.input_wrap`/
    `.select_wrap` div before reaching the field's own outermost
    `.form_text_bx` wrapper — the actual removable/insertable unit — so
    `_find_element_by_id`'s plain "smallest enclosing div" isn't enough
    here; this walks further up until it reaches a div whose class starts
    with `form_text_bx`."""
    pattern = re.compile(r'\bid="' + re.escape(escape_html(element_id)) + r'"')
    match = pattern.search(html)
    if match is None:
        return None
    pos = match.start()
    for _ in range(5):  # a handful of nesting levels is always enough here
        span = _find_enclosing_div(html, pos)
        if span is None:
            return None
        start, _end = span
        if html[start : start + 60].find('class="form_text_bx') != -1:
            return span
        pos = start
    return None


def _locate_top_unit(html: str, unit: str) -> Optional[tuple[int, int]]:
    """The outer, removable/insertable span for one `.form_top_group` unit —
    a plain id lookup for `email`/`countryCode`, the shared
    `.form_text_group` wrapper for `namePair` (found by its own class, not
    by either child's id, so it's still found even mid-edit when it might
    temporarily hold only one child or be empty), and whichever of
    `callingCode`/`mobileNumber` is actually present for `mobileGroup` (the
    two are rendered as one block — see `render_profile_fields` — so either
    id locates the same single span)."""
    if unit == "namePair":
        match = _NAME_GROUP_OPEN_RE.search(html)
        if match is None:
            return None
        return _find_balanced_div(html, match)
    if unit == "mobileGroup":
        span = _find_form_text_bx_wrapper(html, "mobileNumber")
        return span if span is not None else _find_form_text_bx_wrapper(html, "callingCode")
    return _find_form_text_bx_wrapper(html, unit)


def _find_top_group_insert_anchor(html: str, preceding_units: list[str]) -> Optional[int]:
    """Walks `preceding_units` (nearest first) looking for the nearest
    earlier `.form_top_group` unit that's actually present in `html`, and
    returns the position right after it to insert at. None if none of them
    are present — the caller falls back to the very start of
    `.form_top_group`."""
    for unit in preceding_units:
        span = _locate_top_unit(html, unit)
        if span is not None:
            return span[1]
    return None


def _patch_simple_top_unit(
    html: str, unit: str, new_present: bool, render_fragment: Callable[[], str], preceding_units: list[str]
) -> Optional[str]:
    """Reconciles one independently-wrapped `.form_top_group` unit
    (`countryCode`/`email`, each its own `<div>` with no sibling sharing
    it) against whether `unit`'s id is actually found in `html` right now —
    not against the old fingerprint — so it self-corrects even if the file
    already drifted. Returns `html` unchanged when nothing needs to
    change."""
    span = _locate_top_unit(html, unit)
    currently_present = span is not None
    if currently_present and not new_present:
        assert span is not None
        return html[: span[0]] + html[span[1] :]
    if not currently_present and new_present:
        insert_at = _find_top_group_insert_anchor(html, preceding_units)
        if insert_at is None:
            top_match = _FORM_TOP_GROUP_OPEN_RE.search(html)
            if top_match is None:
                return None
            insert_at = top_match.end()
        return html[:insert_at] + render_fragment() + html[insert_at:]
    return html


def _patch_name_pair(
    html: str,
    first_name_field: Optional[LocalizedFieldMeta],
    last_name_field: Optional[LocalizedFieldMeta],
    preceding_units: list[str],
) -> Optional[str]:
    """firstName/lastName share one `.form_text_group` wrapper
    (`render_profile_fields`) that must itself be created/removed exactly
    when going from neither-present to either-present or back, and whose
    two possible children are otherwise independently reconciled inside it
    without disturbing the other."""
    new_first = first_name_field is not None
    new_last = last_name_field is not None
    new_any = new_first or new_last

    group_span = _locate_top_unit(html, "namePair")

    if group_span is None:
        if not new_any:
            return html
        fragment = render_profile_fields(firstName=first_name_field, lastName=last_name_field)
        insert_at = _find_top_group_insert_anchor(html, preceding_units)
        if insert_at is None:
            top_match = _FORM_TOP_GROUP_OPEN_RE.search(html)
            if top_match is None:
                return None
            insert_at = top_match.end()
        return html[:insert_at] + fragment + html[insert_at:]

    if not new_any:
        start, end = group_span
        return html[:start] + html[end:]

    first_in_file = _find_form_text_bx_wrapper(html, "firstName") is not None
    last_in_file = _find_form_text_bx_wrapper(html, "lastName") is not None

    if first_in_file and not new_first:
        span = _find_form_text_bx_wrapper(html, "firstName")
        if span is None:
            return None
        html = html[: span[0]] + html[span[1] :]
    if last_in_file and not new_last:
        span = _find_form_text_bx_wrapper(html, "lastName")
        if span is None:
            return None
        html = html[: span[0]] + html[span[1] :]

    if new_first and not first_in_file:
        group_match = _NAME_GROUP_OPEN_RE.search(html)
        if group_match is None:
            return None
        fragment = render_profile_fields(firstName=first_name_field)
        inner = fragment[len('<div class="form_text_group">') : -len("</div>")]
        html = html[: group_match.end()] + inner + html[group_match.end() :]

    if new_last and not last_in_file:
        group_match = _NAME_GROUP_OPEN_RE.search(html)
        if group_match is None:
            return None
        group_span2 = _find_balanced_div(html, group_match)
        if group_span2 is None:
            return None
        insert_at = group_span2[1] - len("</div>")
        fragment = render_profile_fields(lastName=last_name_field)
        inner = fragment[len('<div class="form_text_group">') : -len("</div>")]
        html = html[:insert_at] + inner + html[insert_at:]

    return html


def _patch_mobile_group(
    html: str,
    calling_code_field: Optional[CallingCodeFieldMeta],
    mobile_number_field: Optional[MobileNumberFieldMeta],
    preceding_units: list[str],
) -> Optional[str]:
    """callingCode/mobileNumber render as one indivisible block regardless
    of which of the two is actually set (see `render_profile_fields`), so
    the unit's presence is `calling_code_field is not None or
    mobile_number_field is not None` — there's no partial-membership case
    to reconcile here, unlike firstName/lastName."""
    new_present = calling_code_field is not None or mobile_number_field is not None
    span = _locate_top_unit(html, "mobileGroup")
    currently_present = span is not None
    if currently_present and not new_present:
        assert span is not None
        return html[: span[0]] + html[span[1] :]
    if not currently_present and new_present:
        fragment = render_profile_fields(callingCode=calling_code_field, mobileNumber=mobile_number_field)
        insert_at = _find_top_group_insert_anchor(html, preceding_units)
        if insert_at is None:
            top_match = _FORM_TOP_GROUP_OPEN_RE.search(html)
            if top_match is None:
                return None
            insert_at = top_match.end()
        return html[:insert_at] + fragment + html[insert_at:]
    return html


def _patch_consent_group(
    html: str, removed_consent_ids: list[str], new_definition: FormDefinition, variant: Literal["ff", "oc"]
) -> Optional[str]:
    """Reconciles `.form_bottom_check_group` (privacyPolicy, marketingOptin,
    and every `additionalConsents` entry visible in `variant`) the same
    self-correcting way as the top-group units, plus the group wrapper
    itself, which must appear/disappear exactly when the item count goes
    from zero to non-zero or back — mirroring `render_page`'s own
    `privacy_block = ... if consent_checks else ""`."""
    f = new_definition.fields
    new_items: list[tuple[str, str]] = []
    pp = f.privacyPolicy
    if pp and variant in (pp.visibleInVariants or ["ff"]):
        new_items.append(("privacyPolicy", _render_privacy_policy_fragment(pp.required)))
    mo = f.marketingOptin
    if mo and variant in (mo.visibleInVariants or ["ff"]):
        new_items.append(("subscribe", _render_marketing_optin_fragment(mo.required)))
    for consent in f.additionalConsents or []:
        if variant in (consent.visibleInVariants or ["ff"]):
            new_items.append((escape_html(consent.id), _render_additional_consent_fragment(consent)))

    new_keys = {key for key, _ in new_items}

    # privacyPolicy/subscribe are always checked (their presence is a plain
    # field on new_definition, no stored list needed); additional-consent
    # removals can only be discovered via the old fingerprint, passed in by
    # the caller — see diff_consents's own doc comment.
    for candidate in set(removed_consent_ids) | {"privacyPolicy", "subscribe"}:
        if candidate in new_keys:
            continue
        span = _find_element_by_id(html, candidate)
        if span is not None:
            html = html[: span[0]] + html[span[1] :]

    if not new_items:
        group_match = _BOTTOM_CHECK_GROUP_OPEN_RE.search(html)
        if group_match is None:
            return html
        span = _find_balanced_div(html, group_match)
        if span is None:
            return None
        return html[: span[0]] + html[span[1] :]

    group_match = _BOTTOM_CHECK_GROUP_OPEN_RE.search(html)
    if group_match is None:
        fragment = '<div class="form_bottom_check_group">' + "".join(frag for _, frag in new_items) + "</div>"
        if variant == "oc":
            anchor = _find_element_by_id(html, "formBottomBar")
            if anchor is None:
                return None
            insert_at = anchor[0]
        else:
            fbg_match = _FORM_BOTTOM_GROUP_OPEN_RE.search(html)
            if fbg_match is None:
                return None
            insert_at = fbg_match.end()
        return html[:insert_at] + fragment + html[insert_at:]

    keys_in_order = [key for key, _ in new_items]
    for key, fragment in new_items:
        if _find_element_by_id(html, key) is not None:
            continue
        position = keys_in_order.index(key)
        insert_at = None
        for candidate_key in reversed(keys_in_order[:position]):
            span = _find_element_by_id(html, candidate_key)
            if span is not None:
                insert_at = span[1]
                break
        if insert_at is None:
            group_match = _BOTTOM_CHECK_GROUP_OPEN_RE.search(html)
            if group_match is None:
                return None
            insert_at = group_match.end()
        html = html[:insert_at] + fragment + html[insert_at:]

    return html


def _patch_terms_link(html: str, new_definition: FormDefinition, variant: Literal["ff", "oc"]) -> Optional[str]:
    """The terms-and-conditions link is a single `<a>` with no wrapping
    `<div>` of its own (see `_terms_link`/`page_template.py`), sitting right
    after the `apiError` div inside the submit block — so it's found/removed
    by matching the `<a>` tag itself rather than a div span."""
    new_present = bool(new_definition.fields.termsAndConditions)
    match = _TERMS_LINK_RE.search(html)
    currently_present = match is not None
    if currently_present and not new_present:
        assert match is not None
        return html[: match.start()] + html[match.end() :]
    if not currently_present and new_present:
        anchor = _find_element_by_id(html, "apiError")
        if anchor is None:
            return None
        fragment = _terms_link(new_definition, "form_bottom_terms" if variant == "oc" else "")
        insert_at = anchor[1]
        return html[:insert_at] + fragment + html[insert_at:]
    return html


def _recaptcha_enabled(new_definition: FormDefinition, variant: Literal["ff", "oc"]) -> bool:
    rc = new_definition.fields.recaptcha
    return bool(rc) and variant in (rc.visibleInVariants if rc and rc.visibleInVariants is not None else ["ff"])


def _patch_recaptcha_widget(html: str, new_definition: FormDefinition, variant: Literal["ff", "oc"]) -> Optional[str]:
    """The reCAPTCHA widget (the "I'm not a robot" checkbox target plus its
    own validation-error placeholder) sits right after the consent-checkbox
    group — or, when there's no consent group at all, at the same anchor the
    group itself would be created at (see `_patch_consent_group`) — and
    right before the submit block, mirroring `page_template.py`'s own
    `recaptcha_block` placement exactly."""
    new_present = _recaptcha_enabled(new_definition, variant)
    match = _RECAPTCHA_WIDGET_RE.search(html)
    currently_present = match is not None
    if currently_present and not new_present:
        assert match is not None
        return html[: match.start()] + html[match.end() :]
    if not currently_present and new_present:
        group_match = _BOTTOM_CHECK_GROUP_OPEN_RE.search(html)
        if group_match is not None:
            group_span = _find_balanced_div(html, group_match)
            if group_span is None:
                return None
            insert_at = group_span[1]
        elif variant == "oc":
            anchor = _find_element_by_id(html, "formBottomBar")
            if anchor is None:
                return None
            insert_at = anchor[0]
        else:
            fbg_match = _FORM_BOTTOM_GROUP_OPEN_RE.search(html)
            if fbg_match is None:
                return None
            insert_at = fbg_match.end()
        return html[:insert_at] + _recaptcha_widget() + html[insert_at:]
    return html


def _patch_recaptcha_script(html: str, new_definition: FormDefinition, variant: Literal["ff", "oc"]) -> Optional[str]:
    """The Google reCAPTCHA API `<script>` tag in `<head>` — opt-in only,
    same treatment as the widget itself. The template's own
    `{recaptcha_script}\\n</head>` always has that slot's own trailing
    newline present even when `recaptcha_script` is empty (the same way
    `{analytics_script}` does) — so the blank line already sitting right
    before `</head>` belongs to this slot, and inserting the fragment has to
    land *before* that single trailing newline, not after it, or an extra
    blank line is left behind (and the opposite direction on removal)."""
    new_present = _recaptcha_enabled(new_definition, variant)
    match = _RECAPTCHA_SCRIPT_RE.search(html)
    currently_present = match is not None
    if currently_present and not new_present:
        assert match is not None
        return html[: match.start()] + html[match.end() :]
    if not currently_present and new_present:
        head_match = _HEAD_CLOSE_RE.search(html)
        if head_match is None:
            return None
        insert_at = head_match.start()
        if insert_at > 0 and html[insert_at - 1] == "\n":
            insert_at -= 1
        return html[:insert_at] + _RECAPTCHA_API_SCRIPT + html[insert_at:]
    return html


def _patch_submit_confirmation_popup(html: str, new_definition: FormDefinition) -> Optional[str]:
    """The "Are you sure you want to submit?" popup (`#submitIntentPopup`) is
    a single fixed, content-free fragment — see `page_template.py`'s own
    `_SUBMIT_INTENT_POPUP` doc comment — sitting right after the `#overlay`
    div and before the data/behavior `<script>` tags, identically in both
    variants (unlike reCAPTCHA, this toggle isn't per-variant: the same
    presence/absence applies to every HTML file for the form). Same
    newline-accounting caveat as `_patch_recaptcha_script`: the template's
    `</div>\\n{submit_confirmation_popup}\\n<script` slot leaves two bare
    newlines back-to-back when the popup is absent, so inserting it has to
    land between those two newlines rather than add a third."""
    new_present = new_definition.fields.submitConfirmationEnabled is not False
    match = _SUBMIT_INTENT_POPUP_RE.search(html)
    currently_present = match is not None
    if currently_present and not new_present:
        assert match is not None
        return html[: match.start()] + html[match.end() :]
    if not currently_present and new_present:
        anchor = _find_element_by_id(html, "overlay")
        if anchor is None:
            return None
        insert_at = anchor[1]
        if insert_at < len(html) and html[insert_at] == "\n":
            insert_at += 1
        return html[:insert_at] + _SUBMIT_INTENT_POPUP + html[insert_at:]
    return html


def patch_html_for_field_diff(
    html: str, removed_consent_ids: list[str], new_definition: FormDefinition, variant: Literal["ff", "oc"]
) -> Optional[str]:
    """Reconciles every profile-field/consent unit in `html` against
    `new_definition` for one HTML file's `variant` — email/firstName/
    lastName only apply to the Full Form profile block (see `render_page`'s
    own `is_oc` branch: the One-Click call never passes them at all, so
    they're skipped here too rather than ever being inserted into an OC
    file). Returns the patched HTML, or `None` the moment any step can't
    find its expected anchor, signaling the caller to fall back to the
    existing warn-and-confirm flow for this file instead of guessing."""
    f = new_definition.fields

    patched = _patch_simple_top_unit(html, "countryCode", bool(f.countryCode), lambda: render_profile_fields(countryCode=f.countryCode), [])
    if patched is None:
        return None
    html = patched

    if variant == "ff":
        patched = _patch_simple_top_unit(html, "email", bool(f.email), lambda: render_profile_fields(email=f.email), ["countryCode"])
        if patched is None:
            return None
        html = patched

        patched = _patch_name_pair(html, f.firstName, f.lastName, ["email", "countryCode"])
        if patched is None:
            return None
        html = patched

        patched = _patch_mobile_group(html, f.callingCode, f.mobileNumber, ["namePair", "email", "countryCode"])
        if patched is None:
            return None
        html = patched
    else:
        patched = _patch_mobile_group(html, f.callingCode, f.mobileNumber, ["countryCode"])
        if patched is None:
            return None
        html = patched

    patched = _patch_consent_group(html, removed_consent_ids, new_definition, variant)
    if patched is None:
        return None
    html = patched

    patched = _patch_terms_link(html, new_definition, variant)
    if patched is None:
        return None
    html = patched

    patched = _patch_recaptcha_widget(html, new_definition, variant)
    if patched is None:
        return None
    html = patched

    patched = _patch_recaptcha_script(html, new_definition, variant)
    if patched is None:
        return None
    html = patched

    patched = _patch_submit_confirmation_popup(html, new_definition)
    if patched is None:
        return None
    html = patched

    return html
