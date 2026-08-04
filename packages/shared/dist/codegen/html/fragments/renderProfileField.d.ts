import type { ProfileFieldSet } from "../../../form/formDefinition";
type ProfileInputFields = Pick<ProfileFieldSet, "email" | "firstName" | "lastName" | "countryCode" | "callingCode">;
/**
 * Renders the `.form_top_group` profile inputs, matching the reference's exact
 * attributes field-for-field (autocapitalize/autocorrect hints, maxlength, Parsley
 * trigger/pattern/error-message attributes, and even its `type="firstName"`/
 * `type="lastName"` typo — kept since the byte-identical reference FF.js/OC.js run
 * against this markup and a generic tool reskin would drift from what they expect).
 * Each block is presence-driven: a workbook that never defined a `firstName` row
 * produces no first-name input at all. All label/placeholder text stays empty here —
 * the generated FF.js/OC.js inject it at runtime from the data file.
 */
export declare function renderProfileFields(fields: ProfileInputFields): string;
export {};
