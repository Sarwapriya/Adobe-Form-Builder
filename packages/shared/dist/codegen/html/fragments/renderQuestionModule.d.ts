import type { QuestionDefinition } from "../../../form/formDefinition";
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
export declare function renderQuestionModule(q: QuestionDefinition): string;
