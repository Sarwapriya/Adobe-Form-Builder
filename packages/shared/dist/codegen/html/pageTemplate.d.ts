import type { FormDefinition } from "../../form/formDefinition";
import type { FileNames } from "../fileNames";
import type { BuilderConfig, FormVariant } from "../types";
/**
 * Renders the full page for either variant. Both FF and OC share the same overall
 * skeleton, question modules, and empty-text-node convention (the generated FF.js/OC.js
 * — byte-identical copies of the reference scripts — inject all text from the data file
 * at runtime) — they differ only in which profile fields appear, whether the OC-only
 * heading is present, and the submit-button container (inline `.form_bottom_group` vs.
 * OC's floating `.form_bottom_bar`).
 */
export declare function renderPage(form: FormDefinition, config: BuilderConfig, variant: FormVariant, fileNames: FileNames): string;
