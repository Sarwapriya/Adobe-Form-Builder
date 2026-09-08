import { describe, expect, it } from "vitest";
import { buildQuestionMasterRows } from "../../src/excel/questionMasterRows";
import type { FormDefinition } from "../../src/form/formDefinition";

function sampleForm(): FormDefinition {
  return {
    meta: { subsidiary: "SEIL", sourceFileName: "sample.xlsx", defaultLocale: "en_GB" },
    locales: [
      { code: "en_GB", langSubtag: "en", isRtl: false, sourceColumn: "en_GB", label: "English" },
      { code: "ar_PS", langSubtag: "ar", isRtl: true, sourceColumn: "C", label: "Arabic" },
    ],
    questions: [
      {
        id: "Q1",
        order: 1,
        controlType: "radio",
        headingByLocale: { en_GB: "Which phone are you using?", ar_PS: "هاتفي الآن هو" },
        subheadingByLocale: { en_GB: "(Single answer)", ar_PS: "(إجابة واحدة)" },
        required: true,
        answers: [
          { id: "A1", order: 1, textByLocale: { en_GB: "Galaxy", ar_PS: "جالاكسي" } },
          { id: "A2", order: 2, textByLocale: { en_GB: "iPhone", ar_PS: "آيفون" } },
        ],
      },
      {
        id: "Q2",
        order: 2,
        controlType: "checkbox",
        headingByLocale: { en_GB: "Interested products" },
        subheadingByLocale: {},
        required: false,
        answers: [{ id: "A1", order: 1, textByLocale: { en_GB: "TV" } }],
      },
      {
        id: "Q3",
        order: 3,
        controlType: "text",
        headingByLocale: { en_GB: "Any other comments?" },
        subheadingByLocale: {},
        required: false,
        answers: [],
      },
    ],
    fields: {
      firstName: { labelByLocale: { en_GB: "First name" } },
      lastName: { labelByLocale: { en_GB: "Last name" } },
      email: { labelByLocale: { en_GB: "Email" } },
      callingCode: {
        labelByLocale: { en_GB: "Mobile number" },
        dropdownFirstEntryByLocale: { en_GB: "Select" },
      },
      countryCode: { labelByLocale: { en_GB: "Country" } },
      privacyPolicy: {
        textByLocale: { en_GB: "I have read the privacy policy", ar_PS: "أقر بأنني قد قرأت" },
        linkUrlByLocale: { en_GB: "https://example.com/privacy" },
        required: true,
      },
      marketingOptin: { labelByLocale: { en_GB: "I want marketing info" }, required: false },
      termsAndConditions: {
        textByLocale: { en_GB: "Terms apply" },
        urlByLocale: { en_GB: "https://example.com/terms" },
      },
      additionalConsents: [
        { id: "consentExtra1", order: 1, textByLocale: { en_GB: "Extra consent" }, required: true },
      ],
      submitButton: { labelByLocale: { en_GB: "Submit" } },
    },
    validationMessages: {},
    pageError: {},
    thankYou: {},
  };
}

describe("buildQuestionMasterRows", () => {
  const rows = buildQuestionMasterRows(sampleForm(), "MX", "F2H26");
  const enRows = rows.filter((r) => r.locale === "en_GB");
  const arRows = rows.filter((r) => r.locale === "ar_PS");

  it("expands a multi-option question into one row per answer, repeating question_text_full/alias/mandatory_yn/local_yn", () => {
    const q1Rows = enRows.filter((r) => r.question_code === "Q1");
    expect(q1Rows).toHaveLength(2);
    expect(q1Rows.every((r) => r.question_text_full === "Which phone are you using?")).toBe(true);
    expect(q1Rows.every((r) => r.mandatory_yn === "Y")).toBe(true);
    expect(q1Rows.every((r) => r.local_yn === "Standard")).toBe(true);
    expect(q1Rows.map((r) => r.answer_code)).toEqual(["A1", "A2"]);
    expect(q1Rows.map((r) => r.answer_text_full)).toEqual(["Galaxy", "iPhone"]);
  });

  it("derives answer_code from the answer's rendered DOM order (A1/A2/...), not its raw parsed id", () => {
    const q1ArRows = arRows.filter((r) => r.question_code === "Q1");
    expect(q1ArRows.map((r) => r.answer_code)).toEqual(["A1", "A2"]);
    expect(q1ArRows.map((r) => r.answer_text_full)).toEqual(["جالاكسي", "آيفون"]);
    // answer_text_alias is always the answer's own default-locale (English) text,
    // regardless of which locale's row this is.
    expect(q1ArRows.map((r) => r.answer_text_alias)).toEqual(["Galaxy", "iPhone"]);
  });

  it("sets type per question controlType: radio -> Single, checkbox -> Multi", () => {
    expect(enRows.filter((r) => r.question_code === "Q1").every((r) => r.type === "Single")).toBe(true);
    expect(enRows.filter((r) => r.question_code === "Q2").every((r) => r.type === "Multi")).toBe(true);
  });

  it("emits a single self-referential row for a free-text question (no answers)", () => {
    const q3Rows = enRows.filter((r) => r.question_code === "Q3");
    expect(q3Rows).toHaveLength(1);
    expect(q3Rows[0].type).toBe("Free text");
    expect(q3Rows[0].answer_code).toBe("Q3");
    expect(q3Rows[0].answer_text_full).toBe(q3Rows[0].question_text_full);
    expect(q3Rows[0].answer_text_alias).toBe(q3Rows[0].question_text_alias);
  });

  it("classifies local_yn: Local only for mobile number, privacy policy, and country", () => {
    const byCode = Object.fromEntries(enRows.map((r) => [r.answer_code, r]));
    expect(byCode["mobileNumber"].local_yn).toBe("Local");
    expect(byCode["PRIVACY POLICY_YN"].local_yn).toBe("Local");
    expect(byCode["Country"].local_yn).toBe("Local");

    expect(byCode["firstName"].local_yn).toBe("Standard");
    expect(byCode["lastName"].local_yn).toBe("Standard");
    expect(byCode["email"].local_yn).toBe("Standard");
    expect(byCode["MKT_AGE_YN"].local_yn).toBe("Standard");
    expect(byCode["termsAndConditionsLink"].local_yn).toBe("Standard");
    expect(byCode["consentExtra1"].local_yn).toBe("Standard");
  });

  it("derives mandatory_yn from each field's own required concept, defaulting presence-driven fields to Y", () => {
    const byCode = Object.fromEntries(enRows.map((r) => [r.answer_code, r]));
    expect(byCode["firstName"].mandatory_yn).toBe("Y");
    expect(byCode["mobileNumber"].mandatory_yn).toBe("Y");
    expect(byCode["PRIVACY POLICY_YN"].mandatory_yn).toBe("Y");
    expect(byCode["MKT_AGE_YN"].mandatory_yn).toBe("N");
    expect(byCode["consentExtra1"].mandatory_yn).toBe("Y");
  });

  it("uses the generated-HTML input id as answer_code for firstName/lastName/email/mobileNumber, per explicit correction", () => {
    const byCode = Object.fromEntries(enRows.map((r) => [r.question_code, r]));
    expect(byCode["FIRSTNAME"].answer_code).toBe("firstName");
    expect(byCode["LASTNAME"].answer_code).toBe("lastName");
    expect(byCode["EMAIL"].answer_code).toBe("email");
    expect(byCode["HPP_CODE"].answer_code).toBe("mobileNumber");
  });

  it("sets type: Free text for name/email/mobile/T&C, checkbox for privacy/marketing/consents, dropdown for country", () => {
    const byCode = Object.fromEntries(enRows.map((r) => [r.question_code, r]));
    expect(byCode["FIRSTNAME"].type).toBe("Free text");
    expect(byCode["TERMS_AND_CONDITIONS"].type).toBe("Free text");
    expect(byCode["PRIVACY POLICY_YN"].type).toBe("checkbox");
    expect(byCode["MKT_AGE_YN"].type).toBe("checkbox");
    expect(byCode["consentExtra1"].type).toBe("checkbox");
    expect(byCode["Country"].type).toBe("dropdown");
  });

  it("uses fixed literal aliases for named profile fields, matching the reference workbooks' own style", () => {
    const byCode = Object.fromEntries(enRows.map((r) => [r.question_code, r]));
    expect(byCode["FIRSTNAME"].question_text_alias).toBe("firstname");
    expect(byCode["PRIVACY POLICY_YN"].answer_text_alias).toBe("1 or 0");
    expect(byCode["MKT_AGE_YN"].answer_text_alias).toBe("1 or 0");
    expect(byCode["Country"].answer_text_alias).toBe("COUNTRY");
  });

  it("caps every cell at 255 characters", () => {
    const form = sampleForm();
    const longText = "x".repeat(400);
    form.questions[0].headingByLocale.en_GB = longText;
    form.questions[0].answers[0].textByLocale.en_GB = longText;
    const longRows = buildQuestionMasterRows(form, "MX", "F2H26");
    for (const row of longRows) {
      for (const value of Object.values(row)) {
        if (typeof value === "string") {
          expect(value.length).toBeLessThanOrEqual(255);
        }
      }
    }
  });

  it("omits rows for absent optional fields entirely (presence-driven, not blank rows)", () => {
    const form = sampleForm();
    delete form.fields.termsAndConditions;
    delete form.fields.additionalConsents;
    const noExtras = buildQuestionMasterRows(form, "MX", "F2H26");
    expect(noExtras.some((r) => r.question_code === "TERMS_AND_CONDITIONS")).toBe(false);
    expect(noExtras.some((r) => r.question_code === "consentExtra1")).toBe(false);
  });
});
