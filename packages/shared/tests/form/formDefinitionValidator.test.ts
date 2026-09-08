// @vitest-environment node
import { describe, expect, it } from "vitest";
import { validateFormDefinition } from "../../src/form/formDefinitionValidator";
import type { FormDefinition } from "../../src/form/formDefinition";

function baseForm(overrides: Partial<FormDefinition> = {}): FormDefinition {
  return {
    meta: { subsidiary: "TEST", sourceFileName: "", defaultLocale: "en_GB" },
    locales: [{ code: "en_GB", langSubtag: "en", isRtl: false, sourceColumn: "en_GB", label: "English" }],
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
    fields: { submitButton: { labelByLocale: { en_GB: "Submit" } } },
    validationMessages: {},
    pageError: {},
    thankYou: {},
    ...overrides,
  };
}

describe("validateFormDefinition", () => {
  it("passes a well-formed form with no errors", () => {
    const result = validateFormDefinition(baseForm());
    expect(result.errors).toEqual([]);
  });

  it("errors when there are no questions", () => {
    const result = validateFormDefinition(baseForm({ questions: [] }));
    expect(result.errors.some((e) => /at least one question/.test(e.message))).toBe(true);
  });

  it("errors on duplicate question ids", () => {
    const form = baseForm({
      questions: [
        {
          id: "Q1",
          order: 1,
          controlType: "text",
          headingByLocale: { en_GB: "A" },
          subheadingByLocale: {},
          required: false,
          answers: [],
        },
        {
          id: "Q1",
          order: 2,
          controlType: "text",
          headingByLocale: { en_GB: "B" },
          subheadingByLocale: {},
          required: false,
          answers: [],
        },
      ],
    });
    const result = validateFormDefinition(form);
    expect(result.errors.some((e) => /used more than once/.test(e.message))).toBe(true);
  });

  it("errors on non-sequential question order", () => {
    const form = baseForm({
      questions: [
        {
          id: "Q1",
          order: 1,
          controlType: "text",
          headingByLocale: { en_GB: "A" },
          subheadingByLocale: {},
          required: false,
          answers: [],
        },
        {
          id: "Q2",
          order: 3,
          controlType: "text",
          headingByLocale: { en_GB: "B" },
          subheadingByLocale: {},
          required: false,
          answers: [],
        },
      ],
    });
    const result = validateFormDefinition(form);
    expect(result.errors.some((e) => /sequential/.test(e.message))).toBe(true);
  });

  it("errors when a choice question has no answers", () => {
    const form = baseForm({
      questions: [
        {
          id: "Q1",
          order: 1,
          controlType: "dropdown",
          headingByLocale: { en_GB: "Pick one" },
          subheadingByLocale: {},
          required: true,
          answers: [],
        },
      ],
    });
    const result = validateFormDefinition(form);
    expect(result.errors.some((e) => /has no options/.test(e.message))).toBe(true);
  });

  it("errors when the submit button has no label for the default locale", () => {
    const form = baseForm({ fields: { submitButton: { labelByLocale: {} } } });
    const result = validateFormDefinition(form);
    expect(result.errors.some((e) => /submit button/.test(e.message))).toBe(true);
  });

  it("errors when a mobile number field has no countries", () => {
    const form = baseForm({
      fields: {
        submitButton: { labelByLocale: { en_GB: "Submit" } },
        mobileNumber: { labelByLocale: { en_GB: "Mobile" }, dropdownFirstEntryByLocale: {}, countries: [] },
      },
    });
    const result = validateFormDefinition(form);
    expect(result.errors.some((e) => /no countries configured/.test(e.message))).toBe(true);
  });

  it("errors when a mobile number field references an unrecognized country", () => {
    const form = baseForm({
      fields: {
        submitButton: { labelByLocale: { en_GB: "Submit" } },
        mobileNumber: { labelByLocale: { en_GB: "Mobile" }, dropdownFirstEntryByLocale: {}, countries: ["ZZ"] },
      },
    });
    const result = validateFormDefinition(form);
    expect(result.errors.some((e) => /unrecognized country code "ZZ"/.test(e.message))).toBe(true);
  });

  it("accepts a mobile number field with recognized countries", () => {
    const form = baseForm({
      fields: {
        submitButton: { labelByLocale: { en_GB: "Submit" } },
        mobileNumber: { labelByLocale: { en_GB: "Mobile" }, dropdownFirstEntryByLocale: {}, countries: ["AE", "QA"] },
      },
    });
    const result = validateFormDefinition(form);
    expect(result.errors).toEqual([]);
  });

  it("warns (not errors) on a single-option radio question", () => {
    const form = baseForm({
      questions: [
        {
          id: "Q1",
          order: 1,
          controlType: "radio",
          headingByLocale: { en_GB: "Pick one" },
          subheadingByLocale: {},
          required: true,
          answers: [{ id: "A1", order: 1, textByLocale: { en_GB: "Only" } }],
        },
      ],
    });
    const result = validateFormDefinition(form);
    expect(result.errors).toEqual([]);
    expect(result.warnings.some((w) => /only one option/.test(w.message))).toBe(true);
  });
});
