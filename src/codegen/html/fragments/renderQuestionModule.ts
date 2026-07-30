import type { QuestionDefinition } from "../../../form/formDefinition.ts";
import { answerDomKey, questionInputId } from "../../domIds.ts";
import { escapeHtml } from "../../js/escaping.ts";

/**
 * Renders one `.form_check_module` for a question. Markup stays text-empty (all
 * text is injected at runtime by behavior.js from data.js, matching the reference's
 * data-driven convention) — but unlike the reference's inconsistent 0/1/2-children
 * label convention, every answer here always wraps its text in a `<p>` and only adds
 * an `<img>` when the model actually has image data, so behavior.js's population loop
 * never needs to branch on DOM shape.
 */
export function renderQuestionModule(q: QuestionDefinition): string {
  const requiredStar = q.required ? '<span class="star">*</span>' : "";
  const titleBlock = `<div class="form_check_title"><h3><span></span>${requiredStar}</h3><p></p></div>`;

  if (q.controlType === "text") {
    const requiredAttr = q.required ? ' required data-parsley-required="true"' : "";
    return (
      `<div class="form_check_module" id="${escapeHtml(q.id)}">` +
      titleBlock +
      `<div class="form_text_bx"><div class="input_wrap">` +
      `<textarea id="${escapeHtml(q.id)}" name="${escapeHtml(q.id)}" rows="3"${requiredAttr}></textarea>` +
      `</div></div></div>`
    );
  }

  const inputType = q.controlType === "checkbox" ? "checkbox" : "radio";
  const groupClass = q.controlType === "checkbox" ? "form_check_list_wrap" : "radio_group";
  const wrapClass = q.controlType === "checkbox" ? "form_check_list" : "radio_wrap";

  const answersHtml = q.answers
    .map((a, index) => {
      const inputId = questionInputId(q.id, a.order);
      const value = answerDomKey(a.order);
      // Required validation only needs to be declared once per group. Native `required`
      // on one radio in a named group correctly means "at least one must be checked" —
      // but the same attribute on one checkbox would wrongly force that specific
      // option, so checkbox groups rely on checkboxGroupsValid() in behavior.js instead.
      const nativeRequired = q.required && index === 0 && inputType === "radio" ? " required" : "";
      const requiredAttr =
        q.required && index === 0
          ? nativeRequired + ' data-parsley-required="true" data-parsley-errors-container="#' + escapeHtml(q.id) + '-errors"'
          : "";
      const img = a.image ? `<img src="${escapeHtml(a.image.src)}" alt="">` : "";
      return (
        `<div class="${wrapClass}">` +
        `<input type="${inputType}" id="${inputId}" name="${escapeHtml(q.id)}" value="${value}"${requiredAttr}>` +
        `<label for="${inputId}">${img}<p></p></label>` +
        `</div>`
      );
    })
    .join("");

  return (
    `<div class="form_check_module" id="${escapeHtml(q.id)}">` +
    titleBlock +
    `<div class="${groupClass}" id="${escapeHtml(q.id)}-errors">${answersHtml}</div>` +
    `</div>`
  );
}
