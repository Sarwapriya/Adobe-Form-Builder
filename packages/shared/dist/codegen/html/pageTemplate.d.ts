import type { FormDefinition, LocaleInfo } from "../../form/formDefinition";
import type { FileNames } from "../fileNames";
import type { BuilderConfig, FormVariant } from "../types";
/**
 * Renders the full page for either variant. Both FF and OC share the same overall
 * skeleton, question modules, and empty-text-node convention (the generated FF.js/OC.js
 * — byte-identical copies of the reference scripts — inject all text from the data file
 * at runtime) — they differ only in which profile fields appear, whether the OC-only
 * heading is present, and the submit-button container (inline `.form_bottom_group` vs.
 * OC's floating `.form_bottom_bar`).
 *
 * `targetLocale` is which of the form's own locales this particular page represents
 * for `<html lang>`/`dir` — defaults to the form's own default locale (today's only
 * behavior, for the single shared HTML/JS pair every form still gets). A multi-locale
 * form's *additional* per-locale HTML pages (see fileNames.ts's `localeVariants` and
 * generate.ts) pass their own locale here instead — the page markup itself doesn't
 * otherwise vary by locale (every piece of text is an empty node filled at runtime by
 * the shared data.js/behavior JS), so this is the only thing that needs to change.
 */
export declare function renderPage(form: FormDefinition, config: BuilderConfig, variant: FormVariant, fileNames: FileNames, targetLocale?: LocaleInfo): string;
