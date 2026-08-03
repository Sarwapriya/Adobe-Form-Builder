/**
 * The single canonical, serializable model produced by the Excel parser/mapper and
 * consumed by both the live preview and the codegen pipeline. Keep this file and
 * `formDefinitionZod.ts` hand-kept in sync — there is no z.infer codegen.
 */

/** `<lang>_<COUNTRY>`, e.g. "en_GB", "he_IL", "ar_SA". Always includes the English source locale. */
export type LocaleCode = string;

/** The language subtag portion of a LocaleCode, e.g. "en", "he", "ar". */
export type LangSubtag = string;

export type ControlType = "radio" | "checkbox" | "text";

export interface LocaleInfo {
  code: LocaleCode;
  langSubtag: LangSubtag;
  isRtl: boolean;
  /** Which Excel column this locale's text came from. */
  sourceColumn: "en_GB" | "C" | "D";
  /** Display name for the builder UI's language selector. */
  label: string;
}

export interface AnswerDefinition {
  /** "A1".."An" */
  id: string;
  order: number;
  textByLocale: Record<LocaleCode, string>;
  /** Only set when a builder user explicitly attaches an image to this option. */
  image?: { src: string; alt?: string };
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
}

export interface LocalizedFieldMeta {
  labelByLocale: Record<LocaleCode, string>;
  placeholderByLocale?: Record<LocaleCode, string>;
}

export interface CallingCodeFieldMeta extends LocalizedFieldMeta {
  dropdownFirstEntryByLocale: Record<LocaleCode, string>;
}

export interface PrivacyPolicyMeta {
  /** Excel provides the full paragraph text plus a link URL, but no separate
   * "link text" translation — codegen renders the URL against generic anchor text. */
  textByLocale: Record<LocaleCode, string>;
  linkUrlByLocale: Record<LocaleCode, string>;
}

export interface TermsAndConditionsMeta {
  textByLocale: Record<LocaleCode, string>;
  urlByLocale: Record<LocaleCode, string>;
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
  privacyPolicy?: PrivacyPolicyMeta;
  marketingOptin?: LocalizedFieldMeta;
  termsAndConditions?: TermsAndConditionsMeta;
  submitButton: LocalizedFieldMeta;
  /** Varies per locale in the source (translators sometimes leave country-specific
   * notes alongside the URL), so this is a locale map, not a single string. */
  redirectAfterSuccessUrlByLocale?: Record<LocaleCode, string>;
  headingBeforeBreakByLocale?: Record<LocaleCode, string>;
  headingAfterBreakByLocale?: Record<LocaleCode, string>;
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
export function resolveLocalizedText(
  map: Record<LocaleCode, string> | undefined,
  locale: LocaleCode,
  defaultLocale: LocaleCode,
): string {
  if (!map) return "";
  return map[locale] ?? map[defaultLocale] ?? "";
}
