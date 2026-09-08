"""Port of packages/shared/src/codegen/html/fragments/renderQuestionModule.ts.

Renders one `.form_check_module` for a question. Markup stays text-empty
(all text is injected at runtime by the byte-identical reference FF.js/OC.js
from the data file) — every answer here always wraps its text in a `<p>` and
only adds an `<img>` when the model actually has image data.
"""

from __future__ import annotations

from ....form.definition import QuestionDefinition
from ...dom_ids import answer_dom_key, question_input_id
from ...escaping import escape_html


def render_question_module(q: QuestionDefinition) -> str:
    required_star = '<span class="star">*</span>' if q.required else ""
    title_block = f'<div class="form_check_title"><h3><span></span>{required_star}</h3><p></p></div>'

    if q.controlType == "text":
        qid = escape_html(q.id)
        return (
            f'<div class="form_check_module" id="{qid}">'
            + title_block
            + '<div class="form_text_bx"><div class="input_wrap">'
            + f'<textarea id="{qid}" name="{qid}" rows="3" data-pt-api="y"></textarea>'
            + "</div></div></div>"
        )

    if q.controlType == "shortText":
        qid = escape_html(q.id)
        return (
            f'<div class="form_check_module" id="{qid}">'
            + title_block
            + '<div class="form_text_bx"><div class="input_wrap">'
            + f'<input type="text" id="{qid}" name="{qid}" data-pt-api="y">'
            + '<div class="btn_clear"></div>'
            + "</div></div></div>"
        )

    if q.controlType == "dropdown":
        qid = escape_html(q.id)
        return (
            f'<div class="form_check_module" id="{qid}">'
            + title_block
            + '<div class="form_text_bx select_bx"><div class="select_wrap">'
            + f'<select id="{qid}" name="{qid}" data-pt-api="y"><option value=""></option></select>'
            + "</div></div></div>"
        )

    input_type = "checkbox" if q.controlType == "checkbox" else "radio"
    # Match the reference: radio with <=3 answers uses radio_group (inline layout),
    # radio with >3 answers uses form_check_list_wrap (grid layout) with radio_wrap
    # children. Checkboxes always use form_check_list_wrap with form_check_list children.
    is_radio_with_few_answers = q.controlType == "radio" and len(q.answers) <= 3
    group_class = "radio_group" if is_radio_with_few_answers else "form_check_list_wrap"
    wrap_class = "form_check_list" if q.controlType == "checkbox" else "radio_wrap"
    # Matches the reference's Q1A1, which alone carries a (Parsley-inert, since
    # nothing declares it required) "must select one" error message — kept for
    # exact parity.
    is_first_question = q.order == 1

    answer_parts: list[str] = []
    for index, a in enumerate(q.answers):
        input_id = question_input_id(q.id, a.order)
        value = answer_dom_key(a.order)
        error_message_attr = ' data-parsley-error-message="Must select atleast one"' if is_first_question and index == 0 else ""
        img = f'<img src="{escape_html(a.image.src)}" alt="">' if a.image else ""
        answer_parts.append(
            f'<div class="{wrap_class}">'
            f'<input type="{input_type}" id="{input_id}" name="{escape_html(q.id)}" value="{value}" data-pt-api="y"{error_message_attr}>'
            f'<label for="{input_id}">{img}<p></p></label>'
            "</div>"
        )
    answers_html = "".join(answer_parts)

    qid = escape_html(q.id)
    return f'<div class="form_check_module" id="{qid}">' + title_block + f'<div class="{group_class}">{answers_html}</div>' + "</div>"
