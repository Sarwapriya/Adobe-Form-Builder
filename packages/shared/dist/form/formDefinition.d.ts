/**
 * The single canonical, serializable model produced by the Excel parser/mapper and
 * consumed by both the live preview and the codegen pipeline. Keep this file and
 * `formDefinitionZod.ts` hand-kept in sync — there is no z.infer codegen.
 */
/** `<lang>_<COUNTRY>`, e.g. "en_GB", "he_IL", "ar_SA". Always includes the English source locale. */
export type LocaleCode = string;
/** The language subtag portion of a LocaleCode, e.g. "en", "he", "ar". */
export type LangSubtag = string;
/** "text" is historical naming — it renders as a multi-line `<textarea>`, kept as-is
 * for Excel-sourced-form backward compatibility. "shortText" (single-line `<input>`)
 * and "dropdown" (`<select>`) are builder-only additions. */
export type ControlType = "radio" | "checkbox" | "text" | "shortText" | "dropdown";
export interface LocaleInfo {
    code: LocaleCode;
    langSubtag: LangSubtag;
    isRtl: boolean;
    /** Which Excel column this locale's text came from — "builder" for a locale an
     * admin added directly in the Form Builder (no Excel column exists for it; never
     * produced by mapper.ts, which only ever sets "en_GB"/"C"/"D"). */
    sourceColumn: "en_GB" | "C" | "D" | "builder";
    /** Display name for the builder UI's language selector. */
    label: string;
}
export interface AnswerDefinition {
    /** "A1".."An" */
    id: string;
    order: number;
    textByLocale: Record<LocaleCode, string>;
    /** Only set when a builder user explicitly attaches an image to this option. */
    image?: {
        src: string;
        alt?: string;
    };
}
export interface QuestionDefinition {
    /** "Q1".."Qn" — arbitrary count, not capped. */
    id: string;
    order: number;
    controlType: ControlType;
    headingByLocale: Record<LocaleCode, string>;
    /** The Excel "(Single answer)"/"(Multiple answers)" marker text, per locale. */
    subheadingByLocale: Record<LocaleCode, string>;
    /** Excel has no explicit required flag; defaults true, builder-configurable. */
    required: boolean;
    /** Empty for controlType "text". */
    answers: AnswerDefinition[];
    /** Which output variant(s) render this question — pageTemplate.ts filters
     * `form.questions` by this before rendering each variant's question modules
     * (the DOM-driven reference JS then just never sees a module it wasn't given,
     * no per-variant script changes needed). Excel-sourced forms never set this
     * (mapper.ts has no such concept), so `undefined`/absent means "every
     * variant" everywhere this is read — a builder-only, additive concept. */
    visibleInVariants?: Array<"ff" | "oc">;
    /** Admin-configured (Form Builder): whether this question is eligible for
     * URL-param auto-populate in the One-Click variant. Only meaningful for
     * choice-type questions (radio/checkbox/dropdown) — a free-text question has no
     * discrete answer to auto-select. The URL param name isn't stored — it's derived
     * from the question's own order (see codegen/domIds.ts's autoPopulateParamName),
     * so it can't drift out of sync with a renumbered question. */
    autoPopulateEligible?: boolean;
    /** Subsidiary-configured, via a contribution (see form/contribution.ts's
     * autoPopulateToggles): whether this subsidiary's own form actually turns
     * auto-populate on for this question. Only takes effect when
     * autoPopulateEligible is also true. */
    autoPopulateEnabled?: boolean;
}
export interface LocalizedFieldMeta {
    labelByLocale: Record<LocaleCode, string>;
    placeholderByLocale?: Record<LocaleCode, string>;
}
export interface CallingCodeFieldMeta extends LocalizedFieldMeta {
    dropdownFirstEntryByLocale: Record<LocaleCode, string>;
}
/** A first-class, builder-only mobile-number field — Excel-sourced forms instead use
 * the separate `countryCode`/`callingCode` fields driven by the real Samsung subsidiary
 * tables. `countries` is a non-empty list of ISO-3166 alpha-2 codes, each required to be
 * resolvable via `findCallingCodeEntry` at publish time; it drives both the calling-code
 * dropdown and the runtime mobile-number validation via a synthesized "BUILDER"
 * subsidiary table (see buildDataJs.ts) rather than the real Samsung tables. */
export interface MobileNumberFieldMeta extends LocalizedFieldMeta {
    countries: string[];
    dropdownFirstEntryByLocale: Record<LocaleCode, string>;
}
export interface PrivacyPolicyMeta {
    /** The non-clickable paragraph text (e.g. "I have read and agree to the
     * Samsung Privacy Policy located at:"), rendered before the link itself. */
    textByLocale: Record<LocaleCode, string>;
    linkUrlByLocale: Record<LocaleCode, string>;
    /** The link's own visible/clickable text (e.g. "Samsung Privacy Policy"),
     * distinct from `textByLocale` above — see buildDataJs.ts's
     * `privacyPolicyLink.label`, consumed by the reference FF.js/OC.js's shared
     * consent-checkbox loop (`ckbLabelLink.html(...label + ckbLabelLink.html())`).
     * Excel-sourced forms never populate this (no matching workbook column), so
     * it's builder-only and optional; codegen falls back to empty text (an empty
     * clickable anchor) when unset, same as before this field existed. */
    linkTextByLocale?: Record<LocaleCode, string>;
    /** Whether checking this gates Submit (see `enableDisableSubmit()`'s generic
     * required-consent scan in both FF.js/OC.js). Absent means `true` — Excel-sourced
     * forms never set this and have always been required, so this preserves that
     * default exactly. Builder-configurable. */
    required?: boolean;
    /** Which output variant(s) render this checkbox — same filtering pageTemplate.ts
     * applies to `visibleInVariants` on QuestionDefinition, and the same "absent means
     * every variant" convention would be wrong here: Excel-sourced/pre-existing forms
     * (and every consent created before this field existed) have always rendered Full
     * Form only, so absent means `["ff"]`, not both — see pageTemplate.ts. */
    visibleInVariants?: Array<"ff" | "oc">;
}
/** An informational Terms & Conditions link — unlike PrivacyPolicyMeta/ConsentToggleMeta,
 * this isn't a consent checkbox (no `required`, nothing to gate Submit on), so it has no
 * `required`/`visibleInVariants` knobs; it simply renders (in both FF and OC, same as the
 * hardcoded link it replaces) whenever `ProfileFieldSet.termsAndConditions` is set. Fully
 * optional and presence-driven per-locale, same convention as every other field here — a
 * locale with no text/url just renders nothing for that locale, never blocking publish (see
 * formDefinitionValidator.ts, which only warns). Admin-configurable via the Form Builder and
 * separately per-locale-translatable by a subsidiary user via the contribution flow (see
 * contribution.ts's `termsAndConditionsText`/`termsAndConditionsUrl` targets). */
export interface TermsAndConditionsMeta {
    textByLocale: Record<LocaleCode, string>;
    urlByLocale: Record<LocaleCode, string>;
}
/** Marketing Opt-in's own shape — a LocalizedFieldMeta (just a label, like
 * firstName/lastName) plus the same required/visibility knobs PrivacyPolicyMeta and
 * ConsentDefinition have, so all three consent-style checkboxes are configured
 * identically. */
export interface ConsentToggleMeta extends LocalizedFieldMeta {
    /** Absent means `false` — Marketing Opt-in has always been optional/non-blocking. */
    required?: boolean;
    /** Absent means `["ff"]` — see PrivacyPolicyMeta.visibleInVariants. */
    visibleInVariants?: Array<"ff" | "oc">;
}
/**
 * An admin-added consent checkbox beyond the two fixed slots (Privacy Policy,
 * Marketing Opt-in) — an open-ended list, unlike those two, so `id` follows a
 * "consentExtraN" convention rather than a fixed name. Configured the same way as
 * the two fixed slots (required/visibleInVariants) and the same way as
 * QuestionDefinition's own visibleInVariants — see enableDisableSubmit()'s generic
 * required-consent scan (both FF.js/OC.js) and mapParam()'s generic "consentExtra"
 * payload collection, neither of which needed per-id changes to support this.
 * Builder-only; never set on an Excel-sourced form (no equivalent Excel row exists). */
export interface ConsentDefinition {
    /** "consentExtra1".."consentExtraN" */
    id: string;
    order: number;
    textByLocale: Record<LocaleCode, string>;
    /** Optional — same shape as PrivacyPolicyMeta's own link, rendered only when set. */
    linkUrlByLocale?: Record<LocaleCode, string>;
    /** Absent means `false` — additional consents have always been optional. */
    required?: boolean;
    /** Absent means `["ff"]` — see PrivacyPolicyMeta.visibleInVariants. */
    visibleInVariants?: Array<"ff" | "oc">;
}
/**
 * Each field is optional and presence-driven: a workbook that never defines a
 * `firstName` row produces a form with no first-name input at all, not a hidden one.
 */
export interface ProfileFieldSet {
    email?: LocalizedFieldMeta;
    firstName?: LocalizedFieldMeta;
    lastName?: LocalizedFieldMeta;
    countryCode?: LocalizedFieldMeta;
    callingCode?: CallingCodeFieldMeta;
    /** Builder-only alternative to callingCode — see MobileNumberFieldMeta's own doc
     * comment. Never set on an Excel-sourced form. */
    mobileNumber?: MobileNumberFieldMeta;
    privacyPolicy?: PrivacyPolicyMeta;
    marketingOptin?: ConsentToggleMeta;
    /** Admin-added consent checkboxes beyond the two above — see ConsentDefinition. */
    additionalConsents?: ConsentDefinition[];
    termsAndConditions?: TermsAndConditionsMeta;
    submitButton: LocalizedFieldMeta;
    /** Varies per locale in the source (translators sometimes leave country-specific
     * notes alongside the URL), so this is a locale map, not a single string. */
    redirectAfterSuccessUrlByLocale?: Record<LocaleCode, string>;
    headingBeforeBreakByLocale?: Record<LocaleCode, string>;
    headingAfterBreakByLocale?: Record<LocaleCode, string>;
    /** Builder-only campaign subheading, rendered under the page heading. Never set on
     * an Excel-sourced form (no equivalent Excel row exists). */
    campaignSubheadingByLocale?: Record<LocaleCode, string>;
    requiredFieldNoteByLocale?: Record<LocaleCode, string>;
    /** Passthrough for flat-field-key rows recognized in the sheet (non-blank column A)
     * that don't map to a dedicated field above (e.g. the source's "Rafle Draw" key) —
     * keyed by the row's own key text, so no source data is silently dropped. */
    extraFieldsByLocale?: Record<string, Record<LocaleCode, string>>;
}
export interface PageCopy {
    heading?: string;
    subHeading?: string;
    subHeadingUrlText?: string;
    subHeadingUrl?: string;
}
export interface ValidationMessageSet {
    requiredField?: string;
    email?: string;
    mobileNumber?: string;
    modalMessage1?: string;
    modalMessage2?: string;
    modalButtonYes?: string;
    modalButtonNo?: string;
    emailError?: string;
    firstNameError?: string;
    lastNameError?: string;
    callingCodeError?: string;
    mobileNumberType?: string;
    mobileNumberLength?: string;
    mobileNumberError?: string;
    zipCodeError?: string;
    reCaptchaRequired?: string;
    apiError?: string;
}
export interface FormDefinition {
    meta: {
        subsidiary: string;
        sourceFileName: string;
        /** The locale sourced from the "Original en_GB Text" column. */
        defaultLocale: LocaleCode;
    };
    locales: LocaleInfo[];
    questions: QuestionDefinition[];
    fields: ProfileFieldSet;
    validationMessages: Record<LocaleCode, ValidationMessageSet>;
    pageError: Record<LocaleCode, PageCopy>;
    thankYou: Record<LocaleCode, PageCopy>;
}
/** Resolve a per-locale text map with fallback to the form's default locale, then "". */
export declare function resolveLocalizedText(map: Record<LocaleCode, string> | undefined, locale: LocaleCode, defaultLocale: LocaleCode): string;
