// @vitest-environment node
import { describe, expect, it } from "vitest";
import { migrateDefaultLocale, remapLocalesForCopy } from "../../src/form/localeMigration";
import type { FormDefinition, LocaleInfo } from "../../src/form/formDefinition";

function baseForm(): FormDefinition {
  return {
    meta: { subsidiary: "TEST", sourceFileName: "", defaultLocale: "en_GB" },
    locales: [
      { code: "en_GB", langSubtag: "en", isRtl: false, sourceColumn: "en_GB", label: "English" },
      { code: "ar_AE", langSubtag: "ar", isRtl: true, sourceColumn: "builder", label: "Arabic" },
    ],
    questions: [
      {
        id: "Q1",
        order: 1,
        controlType: "radio",
        headingByLocale: { en_GB: "Pick one" },
        subheadingByLocale: { en_GB: "(single)" },
        required: true,
        answers: [{ id: "A1", order: 1, textByLocale: { en_GB: "Yes" } }],
      },
    ],
    fields: {
      firstName: { labelByLocale: { en_GB: "First Name" } },
      privacyPolicy: { textByLocale: { en_GB: "I agree" }, linkUrlByLocale: { en_GB: "https://x" } },
      additionalConsents: [{ id: "consentExtra1", order: 1, textByLocale: { en_GB: "Updates" }, linkUrlByLocale: { en_GB: "https://y" } }],
      submitButton: { labelByLocale: { en_GB: "Submit" } },
      campaignSubheadingByLocale: { en_GB: "Campaign copy" },
    },
    validationMessages: { en_GB: { requiredField: "Required" } },
    pageError: { en_GB: { heading: "Error" } },
    thankYou: { en_GB: { heading: "Thanks" } },
  };
}

describe("migrateDefaultLocale", () => {
  it("is a no-op if the new default equals the current one", () => {
    const form = baseForm();
    const result = migrateDefaultLocale(form, "en_GB");
    expect(result).toBe(form);
  });

  it("backfills the new default's slot everywhere the old default had text, leaving the old locale's text intact when not removing it", () => {
    const form = baseForm();
    const next = migrateDefaultLocale(form, "ar_AE");

    expect(next.meta.defaultLocale).toBe("ar_AE");
    expect(next.questions[0].headingByLocale).toEqual({ en_GB: "Pick one", ar_AE: "Pick one" });
    expect(next.questions[0].subheadingByLocale.ar_AE).toBe("(single)");
    expect(next.questions[0].answers[0].textByLocale.ar_AE).toBe("Yes");
    expect(next.fields.firstName?.labelByLocale.ar_AE).toBe("First Name");
    expect(next.fields.privacyPolicy?.textByLocale.ar_AE).toBe("I agree");
    expect(next.fields.privacyPolicy?.linkUrlByLocale.ar_AE).toBe("https://x");
    expect(next.fields.additionalConsents?.[0].textByLocale.ar_AE).toBe("Updates");
    expect(next.fields.additionalConsents?.[0].linkUrlByLocale?.ar_AE).toBe("https://y");
    expect(next.fields.submitButton.labelByLocale.ar_AE).toBe("Submit");
    expect(next.fields.campaignSubheadingByLocale?.ar_AE).toBe("Campaign copy");
    expect(next.validationMessages.ar_AE).toEqual({ requiredField: "Required" });
    expect(next.pageError.ar_AE).toEqual({ heading: "Error" });
    expect(next.thankYou.ar_AE).toEqual({ heading: "Thanks" });

    // Old locale's own text is untouched — a plain reorder keeps it available.
    expect(next.questions[0].headingByLocale.en_GB).toBe("Pick one");
    expect(next.fields.firstName?.labelByLocale.en_GB).toBe("First Name");
  });

  it("never overwrites text the new default already has of its own", () => {
    const form = baseForm();
    form.fields.firstName!.labelByLocale.ar_AE = "الاسم الأول"; // already translated
    const next = migrateDefaultLocale(form, "ar_AE");
    expect(next.fields.firstName?.labelByLocale.ar_AE).toBe("الاسم الأول");
  });

  it("merges PageCopy/ValidationMessageSet field-by-field rather than replacing the whole object", () => {
    const form = baseForm();
    form.pageError.ar_AE = { heading: "خطأ" }; // only heading translated, no subHeading
    form.pageError.en_GB = { heading: "Error", subHeading: "Try again" };
    const next = migrateDefaultLocale(form, "ar_AE");
    expect(next.pageError.ar_AE).toEqual({ heading: "خطأ", subHeading: "Try again" });
  });

  it("removes the old default's own entries when removeOldLocale is set", () => {
    const form = baseForm();
    const next = migrateDefaultLocale(form, "ar_AE", { removeOldLocale: true });
    expect(next.questions[0].headingByLocale.ar_AE).toBe("Pick one");
    expect(next.questions[0].headingByLocale.en_GB).toBeUndefined();
    expect(next.fields.firstName?.labelByLocale.en_GB).toBeUndefined();
    expect(next.validationMessages.en_GB).toBeUndefined();
    expect(next.pageError.en_GB).toBeUndefined();
    expect(next.thankYou.en_GB).toBeUndefined();
  });

  it("is pure — never mutates the input form", () => {
    const form = baseForm();
    const snapshot = JSON.parse(JSON.stringify(form));
    migrateDefaultLocale(form, "ar_AE", { removeOldLocale: true });
    expect(form).toEqual(snapshot);
  });

  it("handles optional fields that were never set without introducing empty objects", () => {
    const form = baseForm();
    const next = migrateDefaultLocale(form, "ar_AE");
    expect(next.fields.headingBeforeBreakByLocale).toBeUndefined();
    expect(next.fields.mobileNumber).toBeUndefined();
  });
});

/** SESAR (en_SA default + ar_SA) copied into SELV (en_JO fallback, en_LB,
 * ar_IQ, ku_IQ) — the exact worked example from the feature request: both
 * English targets pull from en_SA, both Arabic targets pull from ar_SA, and
 * ku_IQ (no Kurdish source) falls back to en_SA, the source's own default. */
function sesarForm(): FormDefinition {
  return {
    meta: { subsidiary: "SESAR", sourceFileName: "", defaultLocale: "en_SA" },
    locales: [
      { code: "en_SA", langSubtag: "en", isRtl: false, sourceColumn: "en_SA", label: "English" },
      { code: "ar_SA", langSubtag: "ar", isRtl: true, sourceColumn: "builder", label: "Arabic" },
    ],
    questions: [
      {
        id: "Q1",
        order: 1,
        controlType: "radio",
        headingByLocale: { en_SA: "Pick one", ar_SA: "اختر واحدا" },
        subheadingByLocale: { en_SA: "(single)" },
        required: true,
        answers: [{ id: "A1", order: 1, textByLocale: { en_SA: "Yes", ar_SA: "نعم" } }],
      },
    ],
    fields: {
      submitButton: { labelByLocale: { en_SA: "Submit", ar_SA: "إرسال" } },
    },
    validationMessages: {},
    pageError: {},
    thankYou: {},
  };
}

const SELV_LOCALES: LocaleInfo[] = [
  { code: "en_JO", langSubtag: "en", isRtl: false, sourceColumn: "builder", label: "English" },
  { code: "en_LB", langSubtag: "en", isRtl: false, sourceColumn: "builder", label: "English" },
  { code: "ar_IQ", langSubtag: "ar", isRtl: true, sourceColumn: "builder", label: "Arabic" },
  { code: "ku_IQ", langSubtag: "ku", isRtl: true, sourceColumn: "builder", label: "Kurdish" },
];

describe("remapLocalesForCopy", () => {
  it("maps each new locale from the source locale sharing its language, and falls back to the source's default for a language the source doesn't have (SESAR -> SELV)", () => {
    const form = sesarForm();
    const next = remapLocalesForCopy(form, SELV_LOCALES, "en_JO");

    expect(next.meta.defaultLocale).toBe("en_JO");
    expect(next.locales).toEqual(SELV_LOCALES);

    // en_SA => en_JO, en_SA => en_LB
    expect(next.questions[0].headingByLocale.en_JO).toBe("Pick one");
    expect(next.questions[0].headingByLocale.en_LB).toBe("Pick one");
    // ar_SA => ar_IQ
    expect(next.questions[0].headingByLocale.ar_IQ).toBe("اختر واحدا");
    // ku_IQ has no Kurdish source, so it falls back to en_SA (the source's own default)
    expect(next.questions[0].headingByLocale.ku_IQ).toBe("Pick one");

    expect(next.questions[0].answers[0].textByLocale).toEqual({
      en_JO: "Yes",
      en_LB: "Yes",
      ar_IQ: "نعم",
      ku_IQ: "Yes",
    });
    expect(next.fields.submitButton.labelByLocale).toEqual({
      en_JO: "Submit",
      en_LB: "Submit",
      ar_IQ: "إرسال",
      ku_IQ: "Submit",
    });
  });

  it("drops every old locale code entirely — they're not part of the new locale set", () => {
    const form = sesarForm();
    const next = remapLocalesForCopy(form, SELV_LOCALES, "en_JO");
    expect(next.questions[0].headingByLocale.en_SA).toBeUndefined();
    expect(next.questions[0].headingByLocale.ar_SA).toBeUndefined();
  });

  it("is pure — never mutates the input form", () => {
    const form = sesarForm();
    const snapshot = JSON.parse(JSON.stringify(form));
    remapLocalesForCopy(form, SELV_LOCALES, "en_JO");
    expect(form).toEqual(snapshot);
  });

  it("prefers the source's own default locale when more than one source locale shares a target's language", () => {
    const form = sesarForm();
    form.locales.push({ code: "en_US", langSubtag: "en", isRtl: false, sourceColumn: "builder", label: "English (US)" });
    form.questions[0].headingByLocale.en_US = "Pick one (US)";
    const next = remapLocalesForCopy(form, SELV_LOCALES, "en_JO");
    // en_SA is the source's default, so it wins over en_US even though both are English.
    expect(next.questions[0].headingByLocale.en_JO).toBe("Pick one");
  });

  it("rederives the mobile-number field's countries from the new locale set's own country suffixes, not the source subsidiary's", () => {
    const form = sesarForm();
    form.fields.mobileNumber = {
      labelByLocale: { en_SA: "Mobile" },
      dropdownFirstEntryByLocale: {},
      countries: ["SA"],
      countriesByLocale: { en_SA: ["SA"] },
    };
    const next = remapLocalesForCopy(form, SELV_LOCALES, "en_JO");
    // SELV_LOCALES' own country suffixes: en_JO -> JO, en_LB -> LB, ar_IQ/ku_IQ -> IQ (deduped).
    expect(next.fields.mobileNumber?.countries).toEqual(["JO", "LB", "IQ"]);
    // Each new locale seeds its own single-country override; the old en_SA entry is gone.
    expect(next.fields.mobileNumber?.countriesByLocale).toEqual({
      en_JO: ["JO"],
      en_LB: ["LB"],
      ar_IQ: ["IQ"],
      ku_IQ: ["IQ"],
    });
  });

  it("leaves mobileNumber untouched when it wasn't set on the source form", () => {
    const form = sesarForm();
    const next = remapLocalesForCopy(form, SELV_LOCALES, "en_JO");
    expect(next.fields.mobileNumber).toBeUndefined();
  });
});
