// @vitest-environment node
import { describe, expect, it } from "vitest";
import { migrateDefaultLocale } from "../../src/form/localeMigration";
import type { FormDefinition } from "../../src/form/formDefinition";

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
