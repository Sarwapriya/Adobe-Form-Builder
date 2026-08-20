import { findCallingCodeEntry } from "../../form/callingCodes";
import { resolveLocalizedText, type FormDefinition, type LocaleCode, type LocaleInfo, type PageCopy } from "../../form/formDefinition";
import { COUNTRY_SUBSIDIARY, resolveCountryName, SUBSIDIARY_DETAIL, type SubsidiaryCountryEntry } from "../../form/subsidiaryData";
import { answerDomKey, autoPopulateParamName } from "../domIds";
import type { FileNames } from "../fileNames";
import type { BuilderConfig, GeneratedFile } from "../types";
import { safeJsonForScript } from "./escaping";

/** Reserved subsidiary key for a builder-authored `fields.mobileNumber` field — never
 * a real Samsung subsidiary code (those are short org codes like "SGE"/"SEIL"). Lets
 * the existing, unmodified reference-JS dropdown/validation population functions
 * (`populateCountryCodeDropdown`/`populateCallingCodeDropdown`, keyed purely off
 * `country_subsidiary`/`subsidiary_detail`) work against a builder's own configured
 * country list instead of the real Samsung tables, with zero reference-JS changes. */
const BUILDER_SUBSIDIARY_KEY = "BUILDER";

/** Question control types with discrete, selectable answers — the only kind a URL
 * param can meaningfully auto-populate (see QuestionDefinition.autoPopulateEligible). */
const AUTO_POPULATE_CONTROL_TYPES = new Set(["radio", "checkbox", "dropdown"]);

/** Synthesizes one-off `country_subsidiary`/`subsidiary_detail` tables for a builder's
 * `fields.mobileNumber.countries` list, from the generic `CALLING_CODES` table (see
 * `callingCodes.ts`) rather than the real, org-specific Samsung tables in
 * `subsidiaryData.ts`. Every one of the form's own locales also gets its country
 * suffix mapped to the same key, even if that country isn't in `countries` — so a
 * locale whose own country wasn't explicitly configured still resolves to a working
 * (if not country-specific) dropdown instead of an undefined-subsidiary lookup.
 *
 * Each country's name is resolved per-locale via `resolveCountryName` — real Samsung
 * translations (subsidiaryData.ts, sourced from Final_forms_format's master
 * `subsidiary_detail` tables) when available, English CALLING_CODES name otherwise —
 * rather than stamping the same English name under every locale key, so a locale being
 * translated into (e.g. Arabic) shows its own country names, not English ones. */
function buildBuilderSubsidiaryTables(
  countries: string[],
  locales: LocaleInfo[],
  defaultLocale: LocaleCode,
): { countrySubsidiary: Record<string, string>; subsidiaryDetail: Record<string, SubsidiaryCountryEntry[]> } {
  const countrySubsidiary: Record<string, string> = {};
  const entries: SubsidiaryCountryEntry[] = [];

  for (const code of countries) {
    const entry = findCallingCodeEntry(code);
    if (!entry) continue;
    countrySubsidiary[entry.countryCode] = BUILDER_SUBSIDIARY_KEY;
    entries.push({
      callingCode: entry.callingCode,
      countryCode: entry.countryCode,
      countryName: Object.fromEntries(locales.map((l) => [l.code, resolveCountryName(entry.countryCode, l.code, defaultLocale)])),
    });
  }

  for (const locale of locales) {
    const localeCountry = locale.code.split("_")[1];
    if (localeCountry && !countrySubsidiary[localeCountry]) {
      countrySubsidiary[localeCountry] = BUILDER_SUBSIDIARY_KEY;
    }
  }

  return { countrySubsidiary, subsidiaryDetail: { [BUILDER_SUBSIDIARY_KEY]: entries } };
}

/** Fallback validation messages when the workbook carries no "Error Messages" section.
 * The reference itself only ever ships one generic English set; these mirror that
 * (a documented limitation, not a bug: there is no source data to translate from). */
const DEFAULT_VALIDATION_MESSAGES = {
  emailError: "Please enter a valid Email address",
  firstNameError: "Only letters are allowed",
  lastNameError: "Only letters are allowed",
  callingCodeError: "Please select a value",
  mobileNumberType: "Only digits are allowed",
  mobileNumberLength: "Must be 9 or 10 digits",
  mobileNumberError: "Enter a valid mobile number",
  zipCodeError: "Please enter a valid ZIP code of 5 to 9 characters",
  reCaptchaRequired: "Please complete reCaptcha verification",
  apiError: "Something went wrong. Please try again later.",
  modalMessage_1: "Are you sure you want to submit?",
  modalMessage_2: "You won't be able to change your answers after this.",
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
 * Builds the data file (`{prefix}.js`): the bare top-level `const`s the byte-identical
 * `buildFfJs.ts`/`buildOcJs.ts` scripts read at runtime — same names and shape as the
 * reference's `SGE-EN_F2H26.js` (`page_error`, `fields`, `questions`, `answers`,
 * `validation_messages`, `country_subsidiary`, `subsidiary_detail`, `param`), not the
 * `FORM_DATA` wrapper object used previously. `country_subsidiary`/`subsidiary_detail`
 * are embedded in full (see `form/subsidiaryData.ts`) rather than filtered to one
 * selected subsidiary — the reference scripts resolve the right subsidiary themselves,
 * at runtime, from the active locale's own country suffix.
 */
export function buildDataJs(form: FormDefinition, config: BuilderConfig, fileNames: FileNames): GeneratedFile {
  const defaultLocale = form.meta.defaultLocale;
  const localeCodes = form.locales.map((l) => l.code);

  const fields: Record<LocaleCode, unknown> = {};
  const pageError: Record<LocaleCode, unknown> = {};
  const questions: Record<LocaleCode, unknown> = {};
  const answers: Record<LocaleCode, unknown> = {};
  const validationMessages: Record<LocaleCode, typeof DEFAULT_VALIDATION_MESSAGES> = {};

  for (const locale of localeCodes) {
    const f = form.fields;

    const callingCodeField = f.callingCode ?? f.mobileNumber;

    fields[locale] = {
      headingBeforeBreakFF: f.headingBeforeBreakByLocale ? resolveLocalizedText(f.headingBeforeBreakByLocale, locale, defaultLocale) : "",
      headingAfterBreakFF: f.headingAfterBreakByLocale ? resolveLocalizedText(f.headingAfterBreakByLocale, locale, defaultLocale) : "",
      headingBeforeBreak: f.headingBeforeBreakByLocale ? resolveLocalizedText(f.headingBeforeBreakByLocale, locale, defaultLocale) : "",
      headingAfterBreak: f.headingAfterBreakByLocale ? resolveLocalizedText(f.headingAfterBreakByLocale, locale, defaultLocale) : "",
      campaignSubheading: f.campaignSubheadingByLocale ? resolveLocalizedText(f.campaignSubheadingByLocale, locale, defaultLocale) : "",
      requiredField: f.requiredFieldNoteByLocale ? resolveLocalizedText(f.requiredFieldNoteByLocale, locale, defaultLocale) : "",
      label: {
        countryCode: f.countryCode ? resolveLocalizedText(f.countryCode.labelByLocale, locale, defaultLocale) : "",
        email: f.email ? resolveLocalizedText(f.email.labelByLocale, locale, defaultLocale) : "",
        firstName: f.firstName ? resolveLocalizedText(f.firstName.labelByLocale, locale, defaultLocale) : "",
        lastName: f.lastName ? resolveLocalizedText(f.lastName.labelByLocale, locale, defaultLocale) : "",
        callingCode: callingCodeField ? resolveLocalizedText(callingCodeField.labelByLocale, locale, defaultLocale) : "",
        zipCode: "",
      },
      placeholder: {
        email: f.email ? resolveLocalizedText(f.email.placeholderByLocale, locale, defaultLocale) : "",
        firstName: f.firstName ? resolveLocalizedText(f.firstName.placeholderByLocale, locale, defaultLocale) : "",
        lastName: f.lastName ? resolveLocalizedText(f.lastName.placeholderByLocale, locale, defaultLocale) : "",
        mobileNumber: "",
        zipCode: "",
      },
      callingCodeDropdownFirstEntry: callingCodeField
        ? resolveLocalizedText(callingCodeField.dropdownFirstEntryByLocale, locale, defaultLocale)
        : "",
      privacyPolicy: f.privacyPolicy ? resolveLocalizedText(f.privacyPolicy.textByLocale, locale, defaultLocale) : "",
      privacyPolicyLink: {
        label: f.privacyPolicy ? resolveLocalizedText(f.privacyPolicy.linkTextByLocale, locale, defaultLocale) : "",
        image: "",
        imageAlt: "",
        url: f.privacyPolicy ? resolveLocalizedText(f.privacyPolicy.linkUrlByLocale, locale, defaultLocale) : "",
      },
      termsAndConditions: f.termsAndConditions ? resolveLocalizedText(f.termsAndConditions.textByLocale, locale, defaultLocale) : "",
      termsAndConditionsLink: {
        label: "",
        image: "",
        imageAlt: "",
        url: f.termsAndConditions ? resolveLocalizedText(f.termsAndConditions.urlByLocale, locale, defaultLocale) : "",
      },
      subscribe: f.marketingOptin ? resolveLocalizedText(f.marketingOptin.labelByLocale, locale, defaultLocale) : "",
      submitButton: resolveLocalizedText(f.submitButton.labelByLocale, locale, defaultLocale),
      hrTy: resolvePageCopy(form.thankYou, locale, defaultLocale),
      redirectAfterSuccessUrl: f.redirectAfterSuccessUrlByLocale
        ? resolveLocalizedText(f.redirectAfterSuccessUrlByLocale, locale, defaultLocale)
        : "",
    };

    // Admin-added consent checkboxes beyond the two fixed slots above — keyed by
    // each one's own id (matching pageTemplate.ts's markup), same convention as
    // privacyPolicy/subscribe, so the reference FF.js's *existing*, fully generic
    // checkbox-label/link population loop (keyed off each `.form_bottom_check`
    // div's own `for` attribute) picks these up automatically. No script changes
    // needed for text/link population — only mapParam()'s payload construction
    // needed a small generic addition (see buildFfJs.ts's reference source).
    for (const consent of f.additionalConsents ?? []) {
      const localeRecord = fields[locale] as Record<string, unknown>;
      localeRecord[consent.id] = resolveLocalizedText(consent.textByLocale, locale, defaultLocale);
      if (consent.linkUrlByLocale) {
        localeRecord[`${consent.id}Link`] = {
          label: "",
          image: "",
          imageAlt: "",
          url: resolveLocalizedText(consent.linkUrlByLocale, locale, defaultLocale),
        };
      }
    }

    pageError[locale] = { hrErr: resolvePageCopy(form.pageError, locale, defaultLocale) };

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

    // Merge workbook-provided validation messages with hardcoded defaults.
    // Workbook values take precedence for the current locale; missing keys fall
    // back to the default English set.
    const wbMessages = form.validationMessages[locale] ?? {};
    validationMessages[locale] = { ...DEFAULT_VALIDATION_MESSAGES, ...wbMessages };
  }

  const builderSubsidiaryTables = form.fields.mobileNumber
    ? buildBuilderSubsidiaryTables(form.fields.mobileNumber.countries, form.locales, form.meta.defaultLocale)
    : null;

  // paramName -> questionId, for the One-Click reference script's
  // setAnswerDataFromParams() to read at runtime — see QuestionDefinition's
  // autoPopulateEligible/autoPopulateEnabled and domIds.ts's autoPopulateParamName.
  const autoPopulateParams: Record<string, string> = {};
  for (const q of form.questions) {
    if (q.autoPopulateEligible && q.autoPopulateEnabled && AUTO_POPULATE_CONTROL_TYPES.has(q.controlType)) {
      autoPopulateParams[autoPopulateParamName(q.order)] = q.id;
    }
  }

  const parts = [
    ["page_error", pageError],
    ["fields", fields],
    ["questions", questions],
    ["answers", answers],
    ["validation_messages", validationMessages],
    ["country_subsidiary", builderSubsidiaryTables?.countrySubsidiary ?? COUNTRY_SUBSIDIARY],
    ["subsidiary_detail", builderSubsidiaryTables?.subsidiaryDetail ?? SUBSIDIARY_DETAIL],
    [
      "param",
      {
        apiEndpoint: config.apiEndpoint ?? "",
        channel: { fullForm: config.channel?.fullForm ?? "", oneClick: config.channel?.oneClick ?? "" },
        channelDetail: { fullForm: config.channelDetail?.fullForm ?? "", oneClick: config.channelDetail?.oneClick ?? "" },
        fallbackLanguage: defaultLocale,
        project: config.project ?? "",
        reCaptchaSiteKey: "",
        redirectAfterSuccessInSecond: "5",
        source: { fullForm: config.source?.fullForm ?? "", oneClick: config.source?.oneClick ?? "" },
        voucherRequired: config.voucherRequired ?? "N",
        analytics: config.analytics ?? { enabled: false },
      },
    ],
    ["auto_populate_params", autoPopulateParams],
  ] as const;

  const contents = parts.map(([name, value]) => `const ${name} = ${safeJsonForScript(value)};`).join("\n\n") + "\n";
  return { path: fileNames.dataJs, contents };
}
