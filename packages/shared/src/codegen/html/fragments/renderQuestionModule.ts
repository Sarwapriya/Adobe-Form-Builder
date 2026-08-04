import type { QuestionDefinition } from "../../../form/formDefinition";
import { answerDomKey, questionInputId } from "../../domIds";
import { escapeHtml } from "../../js/escaping";

/**
 * Renders one `.form_check_module` for a question. Markup stays text-empty (all text
 * is injected at runtime by the byte-identical reference FF.js/OC.js from the data
 * file, matching the reference's data-driven convention) — but unlike the reference's
 * inconsistent 0/1/2-children label convention, every answer here always wraps its
 * text in a `<p>` and only adds an `<img>` when the model actually has image data, so
 * the population loop (case 1/2 of its branching) never needs a bare-text case.
 *
 * No `data-parsley-*`/`required` attributes are emitted on question/answer inputs —
 * the reference never validates questions through Parsley; the byte-identical script's
 * own `enableDisableSubmit()` is what gates the Submit button (hardcoded to the first
 * question's first three answer ids, unchanged from the reference).
 */
export function renderQuestionModule(q: QuestionDefinition): string {
  const requiredStar = q.required ? '<span class="star">*</span>' : "";
  const titleBlock = `<div class="form_check_title"><h3><span></span>${requiredStar}</h3><p></p></div>`;

  if (q.controlType === "text") {
    return (
      `<div class="form_check_module" id="${escapeHtml(q.id)}">` +
      titleBlock +
      `<div class="form_text_bx"><div class="input_wrap">` +
      `<textarea id="${escapeHtml(q.id)}" name="${escapeHtml(q.id)}" rows="3" data-pt-api="y"></textarea>` +
      `</div></div></div>`
    );
  }

  const inputType = q.controlType === "checkbox" ? "checkbox" : "radio";
  // Match the reference: radio with ≤3 answers uses radio_group (inline layout),
  // radio with >3 answers uses form_check_list_wrap (grid layout) with radio_wrap
  // children. Checkboxes always use form_check_list_wrap with form_check_list children.
  const isRadioWithFewAnswers = q.controlType === "radio" && q.answers.length <= 3;
  const groupClass = isRadioWithFewAnswers ? "radio_group" : "form_check_list_wrap";
  const wrapClass = q.controlType === "checkbox" ? "form_check_list" : "radio_wrap";
  // Matches the reference's Q1A1, which alone carries a (Parsley-inert, since nothing
  // declares it required) "must select one" error message — kept for exact parity.
  const isFirstQuestion = q.order === 1;

  const answersHtml = q.answers
    .map((a, index) => {
      const inputId = questionInputId(q.id, a.order);
      const value = answerDomKey(a.order);
      const errorMessageAttr = isFirstQuestion && index === 0 ? ' data-parsley-error-message="Must select atleast one"' : "";
      const img = a.image ? `<img src="${escapeHtml(a.image.src)}" alt="">` : "";
      return (
        `<div class="${wrapClass}">` +
        `<input type="${inputType}" id="${inputId}" name="${escapeHtml(q.id)}" value="${value}" data-pt-api="y"${errorMessageAttr}>` +
        `<label for="${inputId}">${img}<p></p></label>` +
        `</div>`
      );
    })
    .join("");

  return (
    `<div class="form_check_module" id="${escapeHtml(q.id)}">` +
    titleBlock +
    `<div class="${groupClass}">${answersHtml}</div>` +
    `</div>`
  );
}
