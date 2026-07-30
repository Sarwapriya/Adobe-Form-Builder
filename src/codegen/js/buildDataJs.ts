import { CALLING_CODES } from "../../form/callingCodes.ts";
import { resolveLocalizedText, type FormDefinition, type LocaleCode, type PageCopy } from "../../form/formDefinition.ts";
import { answerDomKey } from "../domIds.ts";
import type { BuilderConfig, GeneratedFile } from "../types.ts";
import { safeJsonForScript } from "./escaping.ts";

/** Excel supplies no per-locale translations for Parsley validation/modal copy, so a
 * single generic English set is used for every included locale — a documented
 * limitation, not a bug (there is no source data to translate from). */
const DEFAULT_VALIDATION_MESSAGES = {
  requiredField: "This field is required.",
  email: "Please enter a valid email address.",
  mobileNumber: "Please enter a valid mobile number.",
  modalMessage1: "Are you sure you want to submit?",
  modalMessage2: "You won't be able to change your answers after this.",
  modalButtonYes: "Yes, submit",
  modalButtonNo: "No, go back",
};

function resolvePageCopy(map: Record<LocaleCode, PageCopy>, locale: LocaleCode, defaultLocale: LocaleCode): Required<PageCopy> {
  const entry = map[locale] ?? map[defaultLocale] ?? {};
  const fallback = map[defaultLocale] ?? {};
  return {
    heading: entry.heading ?? fallback.heading ?? "",
    subHeading: entry.subHeading ?? fallback.subHeading ?? "",
    subHeadingUrlText: entry.subHeadingUrlText ?? fallback.subHeadingUrlText ?? "",
    subHeadingUrl: entry.subHeadingUrl ?? fallback.subHeadingUrl ?? "",
  };
}

/**
 * Builds `data.js`: the per-locale text/data constants that `behavior.js` reads at
 * runtime to populate the (otherwise text-empty) generated HTML — mirroring the
 * reference's `SGE-EN_F2H26.js` shape. Fallback-to-default-locale is baked in here at
 * generation time (every included locale ends up with a complete string set) rather
 * than left to runtime lookup logic, keeping `behavior.js` a simple, direct reader.
 */
export function buildDataJs(form: FormDefinition, config: BuilderConfig): GeneratedFile {
  const defaultLocale = form.meta.defaultLocale;
  const localeCodes = form.locales.map((l) => l.code);

  const fields: Record<LocaleCode, unknown> = {};
  const pageError: Record<LocaleCode, unknown> = {};
  const questions: Record<LocaleCode, unknown> = {};
  const answers: Record<LocaleCode, unknown> = {};
  const validationMessages: Record<LocaleCode, typeof DEFAULT_VALIDATION_MESSAGES> = {};

  for (const locale of localeCodes) {
    const f = form.fields;
    const label: Record<string, string> = {};
    if (f.email) label.email = resolveLocalizedText(f.email.labelByLocale, locale, defaultLocale);
    if (f.firstName) label.firstName = resolveLocalizedText(f.firstName.labelByLocale, locale, defaultLocale);
    if (f.lastName) label.lastName = resolveLocalizedText(f.lastName.labelByLocale, locale, defaultLocale);
    if (f.countryCode) label.countryCode = resolveLocalizedText(f.countryCode.labelByLocale, locale, defaultLocale);
    if (f.callingCode) label.callingCode = resolveLocalizedText(f.callingCode.labelByLocale, locale, defaultLocale);

    const extra: Record<string, string> = {};
    if (f.extraFieldsByLocale) {
      for (const [key, map] of Object.entries(f.extraFieldsByLocale)) {
        extra[key] = resolveLocalizedText(map, locale, defaultLocale);
      }
    }

    fields[locale] = {
      label,
      callingCodeDropdownFirstEntry: f.callingCode
        ? resolveLocalizedText(f.callingCode.dropdownFirstEntryByLocale, locale, defaultLocale)
        : "",
      privacyPolicy: f.privacyPolicy
        ? {
            text: resolveLocalizedText(f.privacyPolicy.textByLocale, locale, defaultLocale),
            linkUrl: resolveLocalizedText(f.privacyPolicy.linkUrlByLocale, locale, defaultLocale),
          }
        : undefined,
      marketingOptin: f.marketingOptin
        ? { text: resolveLocalizedText(f.marketingOptin.labelByLocale, locale, defaultLocale) }
        : undefined,
      termsAndConditions: f.termsAndConditions
        ? {
            text: resolveLocalizedText(f.termsAndConditions.textByLocale, locale, defaultLocale),
            url: resolveLocalizedText(f.termsAndConditions.urlByLocale, locale, defaultLocale),
          }
        : undefined,
      submitButton: resolveLocalizedText(f.submitButton.labelByLocale, locale, defaultLocale),
      headingBeforeBreak: f.headingBeforeBreakByLocale
        ? resolveLocalizedText(f.headingBeforeBreakByLocale, locale, defaultLocale)
        : "",
      headingAfterBreak: f.headingAfterBreakByLocale
        ? resolveLocalizedText(f.headingAfterBreakByLocale, locale, defaultLocale)
        : "",
      requiredField: f.requiredFieldNoteByLocale
        ? resolveLocalizedText(f.requiredFieldNoteByLocale, locale, defaultLocale)
        : "",
      redirectAfterSuccessUrl: f.redirectAfterSuccessUrlByLocale
        ? resolveLocalizedText(f.redirectAfterSuccessUrlByLocale, locale, defaultLocale)
        : "",
      thankYou: resolvePageCopy(form.thankYou, locale, defaultLocale),
      extra,
    };

    pageError[locale] = resolvePageCopy(form.pageError, locale, defaultLocale);

    const questionsForLocale: Record<string, { heading: string; subheading: string }> = {};
    const answersForLocale: Record<string, Record<string, unknown>> = {};
    for (const q of form.questions) {
      questionsForLocale[q.id] = {
        heading: resolveLocalizedText(q.headingByLocale, locale, defaultLocale),
        subheading: resolveLocalizedText(q.subheadingByLocale, locale, defaultLocale),
      };
      const answerMap: Record<string, unknown> = {};
      for (const a of q.answers) {
        const text = resolveLocalizedText(a.textByLocale, locale, defaultLocale);
        answerMap[answerDomKey(a.order)] = a.image
          ? { label: text, image: a.image.src, imageAlt: a.image.alt ?? text }
          : text;
      }
      answersForLocale[q.id] = answerMap;
    }
    questions[locale] = questionsForLocale;
    answers[locale] = answersForLocale;

    validationMessages[locale] = DEFAULT_VALIDATION_MESSAGES;
  }

  const dataObject = {
    page_error: pageError,
    fields,
    questions,
    answers,
    validation_messages: validationMessages,
    calling_codes: CALLING_CODES,
    param: {
      apiEndpoint: config.apiEndpoint ?? "",
      fallbackLanguage: defaultLocale,
      analytics: config.analytics ?? { enabled: false },
    },
  };

  const contents = `var FORM_DATA = ${safeJsonForScript(dataObject)};\n`;
  return { path: "data.js", contents };
}
