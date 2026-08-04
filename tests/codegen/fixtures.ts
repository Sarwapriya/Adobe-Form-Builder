import type { FormDefinition } from "@formbuilder/shared";

/** Small, fully-specified FormDefinition used by previewDocument.test.ts (the frontend's
 * own local copy — the fuller shared-pipeline test suite has its own copy of this same
 * fixture under packages/shared/tests/codegen/fixtures.ts; duplicated deliberately rather
 * than exported from the package's public API, which is pipeline code, not test fixtures). */
export function sampleFormDefinition(): FormDefinition {
  return {
    meta: { subsidiary: "TEST", sourceFileName: "sample.xlsx", defaultLocale: "en_GB" },
    locales: [
      { code: "en_GB", langSubtag: "en", isRtl: false, sourceColumn: "en_GB", label: "English" },
      { code: "ar_AE", langSubtag: "ar", isRtl: true, sourceColumn: "C", label: "Arabic" },
    ],
    questions: [
      {
        id: "Q1",
        order: 1,
        controlType: "radio",
        headingByLocale: { en_GB: "I am currently using", ar_AE: "أنا أستخدم حاليًا" },
        subheadingByLocale: { en_GB: "(Single answer)", ar_AE: "(إجابة واحدة)" },
        required: true,
        answers: [
          { id: "A1", order: 1, textByLocale: { en_GB: "Galaxy", ar_AE: "جالاكسي" } },
          { id: "A2", order: 2, textByLocale: { en_GB: "iPhone", ar_AE: "آيفون" } },
        ],
      },
      {
        id: "Q2",
        order: 2,
        controlType: "checkbox",
        headingByLocale: { en_GB: `Which do you like? <script>alert(1)</script>` },
        subheadingByLocale: { en_GB: "(Multiple answers)" },
        required: true,
        answers: [
          { id: "A1", order: 1, textByLocale: { en_GB: `"; maliciousCode(); //` } },
          { id: "A2", order: 2, textByLocale: { en_GB: "TV" } },
        ],
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
      email: { labelByLocale: { en_GB: "E-mail", ar_AE: "البريد الإلكتروني" } },
      submitButton: { labelByLocale: { en_GB: "Submit", ar_AE: "إرسال" } },
    },
    validationMessages: {},
    pageError: { en_GB: { heading: "Something went wrong." } },
    thankYou: { en_GB: { heading: "Thank you for your interest" } },
  };
}
