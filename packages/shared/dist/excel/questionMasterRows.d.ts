/**
 * Builds the flat, per-(subsidiary, locale, question/field, answer) row shape used by
 * the "Question Master" admin export — one `.xlsx` per project code, compiled from
 * every subsidiary's published `FormDefinition` under that project. Column layout and
 * values are modeled after the hand-maintained reference workbooks in `Documents/`
 * (`Question_Master_F2H26_V2.xlsx`, `QuestionMaster_TV2H26.xlsx`), not derived from them
 * at runtime — this is a pure projection of `FormDefinition`. A multi-option question
 * (radio/checkbox/dropdown) expands into one row per answer (`question_text_full`/
 * `question_text_alias`/`mandatory_yn`/`local_yn` repeated across those rows, matching
 * the reference workbooks' own shape) — everything else (profile fields, free-text
 * questions) gets exactly one row.
 */
import { type FormDefinition } from "../form/formDefinition";
export interface QuestionMasterRow {
    division: string;
    project: string;
    subsidiary: string;
    country_alpha_2: string;
    locale: string;
    question_code: string;
    question_text_full: string;
    question_text_alias: string;
    mandatory_yn: "Y" | "N";
    local_yn: "Standard" | "Local";
    /** "Free text" (name/email/mobile/free-text questions), "checkbox" (Privacy Policy,
     * Marketing Opt-in, extra consents), "dropdown" (Country, dropdown-control
     * questions), "Single" (radio-control questions), or "Multi" (checkbox-control
     * questions) — matches the reference workbooks' own `type` values. */
    type: "Free text" | "checkbox" | "dropdown" | "Single" | "Multi";
    /** The generated form's own DOM id for whatever this row describes — `A1`/`A2`/... for
     * a question's answer (see `domIds.answerDomKey`, the "A1" part of the rendered
     * `Q1A1` input id), or the field's own fixed input id (`firstName`, `email`,
     * `mobileNumber`, ...) for profile fields — see renderProfileField.ts/pageTemplate.ts,
     * the actual generated-HTML source of these ids. */
    answer_code: string;
    answer_text_full: string;
    answer_text_alias: string;
}
/**
 * Pure projection of a single subsidiary's `FormDefinition` into Question Master rows —
 * one row per (locale, profile field or question answer). `division` and `project` are
 * supplied by the caller (see `questionMasterService.ts`) — neither is carried on
 * `FormDefinition` itself: `division` has no equivalent anywhere in the app, and
 * `project` lives on the backend's `Form` entity, not the definition JSON. Called once
 * per subsidiary's published form by the backend generation service, which
 * concatenates the results across every subsidiary in a project before writing the
 * workbook.
 */
export declare function buildQuestionMasterRows(form: FormDefinition, division: string, project: string): QuestionMasterRow[];
