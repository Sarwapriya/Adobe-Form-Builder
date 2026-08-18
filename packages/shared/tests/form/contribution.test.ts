// @vitest-environment node
import { describe, expect, it } from "vitest";
import { applyContribution, validateContribution, type ContributionContent } from "../../src/form/contribution";
import type { FormDefinition } from "../../src/form/formDefinition";

function baseForm(overrides: Partial<FormDefinition> = {}): FormDefinition {
  return {
    meta: { subsidiary: "TEST", sourceFileName: "", defaultLocale: "en_GB" },
    locales: [
      { code: "en_GB", langSubtag: "en", isRtl: false, sourceColumn: "en_GB", label: "English" },
      { code: "ar_AE", langSubtag: "ar", isRtl: true, sourceColumn: "C", label: "Arabic" },
    ],
    questions: [
      {
        id: "Q1",
        order: 1,
        controlType: "radio",
        headingByLocale: { en_GB: "Pick one" },
        subheadingByLocale: {},
        required: true,
        answers: [{ id: "A1", order: 1, textByLocale: { en_GB: "Yes" } }],
      },
    ],
    fields: {
      firstName: { labelByLocale: { en_GB: "First Name" } },
      privacyPolicy: { textByLocale: { en_GB: "I agree" }, linkUrlByLocale: { en_GB: "https://x" } },
      additionalConsents: [{ id: "consentExtra1", order: 1, textByLocale: { en_GB: "Send me updates" } }],
      submitButton: { labelByLocale: { en_GB: "Submit" } },
    },
    validationMessages: {},
    pageError: {},
    thankYou: {},
    ...overrides,
  };
}

const emptyContent: ContributionContent = { translations: [], newQuestions: [], newConsents: [], autoPopulateToggles: [] };

describe("applyContribution", () => {
  it("adds a non-default-locale translation without touching the default locale's text", () => {
    const form = baseForm();
    const content: ContributionContent = {
      ...emptyContent,
      translations: [{ target: { kind: "profileLabel", field: "firstName" }, locale: "ar_AE", value: "الاسم الأول" }],
    };
    const next = applyContribution(form, content);
    expect(next.fields.firstName?.labelByLocale).toEqual({ en_GB: "First Name", ar_AE: "الاسم الأول" });
    expect(form.fields.firstName?.labelByLocale).toEqual({ en_GB: "First Name" }); // base untouched — applyContribution is pure
  });

  it("translates question heading, answer text, privacy policy text/link, and consent text via their own target kinds", () => {
    const form = baseForm();
    const content: ContributionContent = {
      ...emptyContent,
      translations: [
        { target: { kind: "questionHeading", questionId: "Q1" }, locale: "ar_AE", value: "اختر واحدا" },
        { target: { kind: "answerText", questionId: "Q1", answerId: "A1" }, locale: "ar_AE", value: "نعم" },
        { target: { kind: "privacyPolicyText" }, locale: "ar_AE", value: "أوافق" },
        { target: { kind: "privacyPolicyLink" }, locale: "ar_AE", value: "https://x-ar" },
        { target: { kind: "consentText", consentId: "consentExtra1" }, locale: "ar_AE", value: "أرسل التحديثات" },
      ],
    };
    const next = applyContribution(form, content);
    expect(next.questions[0].headingByLocale.ar_AE).toBe("اختر واحدا");
    expect(next.questions[0].answers[0].textByLocale.ar_AE).toBe("نعم");
    expect(next.fields.privacyPolicy?.textByLocale.ar_AE).toBe("أوافق");
    expect(next.fields.privacyPolicy?.linkUrlByLocale.ar_AE).toBe("https://x-ar");
    expect(next.fields.additionalConsents?.[0].textByLocale.ar_AE).toBe("أرسل التحديثات");
  });

  it("silently skips a translation targeting an id that no longer exists on the base form", () => {
    const form = baseForm();
    const content: ContributionContent = {
      ...emptyContent,
      translations: [{ target: { kind: "questionHeading", questionId: "Q99" }, locale: "ar_AE", value: "x" }],
    };
    expect(() => applyContribution(form, content)).not.toThrow();
  });

  it("appends new questions after existing ones, renumbering ids/order regardless of what was submitted", () => {
    const form = baseForm();
    const content: ContributionContent = {
      ...emptyContent,
      newQuestions: [
        {
          id: "Q1", // deliberately colliding with the existing Q1 — must be reassigned, not merged/overwritten
          order: 1,
          controlType: "shortText",
          headingByLocale: { en_GB: "New question" },
          subheadingByLocale: {},
          required: false,
          answers: [],
        },
      ],
    };
    const next = applyContribution(form, content);
    expect(next.questions).toHaveLength(2);
    expect(next.questions[0].id).toBe("Q1");
    expect(next.questions[0].headingByLocale.en_GB).toBe("Pick one"); // original untouched
    expect(next.questions[1].id).toBe("Q2");
    expect(next.questions[1].order).toBe(2);
    expect(next.questions[1].headingByLocale.en_GB).toBe("New question");
  });

  it("appends new consents after existing ones, renumbering ids/order", () => {
    const form = baseForm();
    const content: ContributionContent = {
      ...emptyContent,
      newConsents: [{ id: "consentExtra1", order: 1, textByLocale: { en_GB: "Another consent" } }],
    };
    const next = applyContribution(form, content);
    expect(next.fields.additionalConsents).toHaveLength(2);
    expect(next.fields.additionalConsents?.[0].textByLocale.en_GB).toBe("Send me updates");
    expect(next.fields.additionalConsents?.[1].id).toBe("consentExtra2");
    expect(next.fields.additionalConsents?.[1].textByLocale.en_GB).toBe("Another consent");
  });

  it("turns auto-populate on for a question the admin already marked eligible", () => {
    const form = baseForm();
    form.questions[0].autoPopulateEligible = true;
    const content: ContributionContent = { ...emptyContent, autoPopulateToggles: [{ questionId: "Q1", enabled: true }] };
    const next = applyContribution(form, content);
    expect(next.questions[0].autoPopulateEnabled).toBe(true);
    expect(form.questions[0].autoPopulateEnabled).toBeUndefined(); // base untouched
  });

  it("silently skips an auto-populate toggle for a question that isn't eligible", () => {
    const form = baseForm(); // Q1 has no autoPopulateEligible flag set
    const content: ContributionContent = { ...emptyContent, autoPopulateToggles: [{ questionId: "Q1", enabled: true }] };
    const next = applyContribution(form, content);
    expect(next.questions[0].autoPopulateEnabled).toBeUndefined();
  });

  it("silently skips an auto-populate toggle targeting a question id that no longer exists", () => {
    const form = baseForm();
    const content: ContributionContent = { ...emptyContent, autoPopulateToggles: [{ questionId: "Q99", enabled: true }] };
    expect(() => applyContribution(form, content)).not.toThrow();
  });
});

describe("validateContribution", () => {
  it("passes a well-formed contribution with no errors", () => {
    const form = baseForm();
    const content: ContributionContent = {
      ...emptyContent,
      translations: [{ target: { kind: "profileLabel", field: "firstName" }, locale: "ar_AE", value: "الاسم" }],
    };
    expect(validateContribution(form, content).errors).toEqual([]);
  });

  it("allows a translation to target the form's default locale too", () => {
    const form = baseForm();
    const content: ContributionContent = {
      ...emptyContent,
      translations: [{ target: { kind: "profileLabel", field: "firstName" }, locale: "en_GB", value: "Changed" }],
    };
    expect(validateContribution(form, content).errors).toEqual([]);
  });

  it("errors when a translation targets a locale the form doesn't have at all", () => {
    const form = baseForm();
    const content: ContributionContent = {
      ...emptyContent,
      translations: [{ target: { kind: "profileLabel", field: "firstName" }, locale: "he_IL", value: "x" }],
    };
    const result = validateContribution(form, content);
    expect(result.errors.some((e) => /he_IL/.test(e.message))).toBe(true);
  });

  it("errors when a translation targets a question/answer/consent id that doesn't exist", () => {
    const form = baseForm();
    const content: ContributionContent = {
      ...emptyContent,
      translations: [
        { target: { kind: "questionHeading", questionId: "Q99" }, locale: "ar_AE", value: "x" },
        { target: { kind: "answerText", questionId: "Q1", answerId: "A99" }, locale: "ar_AE", value: "x" },
        { target: { kind: "consentText", consentId: "consentExtra99" }, locale: "ar_AE", value: "x" },
      ],
    };
    const result = validateContribution(form, content);
    expect(result.errors).toHaveLength(3);
  });

  it("errors when a new choice-type question has no options", () => {
    const form = baseForm();
    const content: ContributionContent = {
      ...emptyContent,
      newQuestions: [
        { id: "Qx", order: 1, controlType: "radio", headingByLocale: { en_GB: "Empty" }, subheadingByLocale: {}, required: true, answers: [] },
      ],
    };
    const result = validateContribution(form, content);
    expect(result.errors.some((e) => /has no options/.test(e.message))).toBe(true);
  });

  it("allows a translation targeting the default locale on a form with only one locale", () => {
    const form = baseForm({ locales: [{ code: "en_GB", langSubtag: "en", isRtl: false, sourceColumn: "en_GB", label: "English" }] });
    const content: ContributionContent = {
      ...emptyContent,
      translations: [{ target: { kind: "profileLabel", field: "firstName" }, locale: "en_GB", value: "Changed" }],
    };
    expect(validateContribution(form, content).errors).toEqual([]);
  });

  it("passes an auto-populate toggle targeting a question the admin marked eligible", () => {
    const form = baseForm();
    form.questions[0].autoPopulateEligible = true;
    const content: ContributionContent = { ...emptyContent, autoPopulateToggles: [{ questionId: "Q1", enabled: true }] };
    expect(validateContribution(form, content).errors).toEqual([]);
  });

  it("errors when an auto-populate toggle targets a question that isn't eligible", () => {
    const form = baseForm(); // Q1 has no autoPopulateEligible flag set
    const content: ContributionContent = { ...emptyContent, autoPopulateToggles: [{ questionId: "Q1", enabled: true }] };
    const result = validateContribution(form, content);
    expect(result.errors.some((e) => /isn't eligible/.test(e.message))).toBe(true);
  });

  it("errors when an auto-populate toggle targets a nonexistent question id", () => {
    const form = baseForm();
    const content: ContributionContent = { ...emptyContent, autoPopulateToggles: [{ questionId: "Q99", enabled: true }] };
    const result = validateContribution(form, content);
    expect(result.errors.some((e) => /isn't eligible/.test(e.message))).toBe(true);
  });
});
