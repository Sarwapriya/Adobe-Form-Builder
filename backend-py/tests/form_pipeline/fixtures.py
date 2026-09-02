"""Python port of packages/shared/tests/codegen/fixtures.ts's sampleFormDefinition().

Small, fully-specified FormDefinition used across codegen tests: 2 locales
(one RTL), a radio question, a checkbox question, a free-text question, a
partial ProfileFieldSet (proving optional-field omission), and an
XSS-payload answer to verify escaping end-to-end.
"""

from __future__ import annotations

from app.form_pipeline.form.definition import (
    AnswerDefinition,
    FormDefinition,
    FormMeta,
    LocalizedFieldMeta,
    LocaleInfo,
    PageCopy,
    ProfileFieldSet,
    QuestionDefinition,
)


def sample_form_definition() -> FormDefinition:
    return FormDefinition(
        meta=FormMeta(subsidiary="TEST", sourceFileName="sample.xlsx", defaultLocale="en_GB"),
        locales=[
            LocaleInfo(code="en_GB", langSubtag="en", isRtl=False, sourceColumn="en_GB", label="English"),
            LocaleInfo(code="ar_AE", langSubtag="ar", isRtl=True, sourceColumn="C", label="Arabic"),
        ],
        questions=[
            QuestionDefinition(
                id="Q1",
                order=1,
                controlType="radio",
                headingByLocale={"en_GB": "I am currently using", "ar_AE": "أنا أستخدم حاليًا"},
                subheadingByLocale={"en_GB": "(Single answer)", "ar_AE": "(إجابة واحدة)"},
                required=True,
                answers=[
                    AnswerDefinition(id="A1", order=1, textByLocale={"en_GB": "Galaxy", "ar_AE": "جالاكسي"}),
                    AnswerDefinition(id="A2", order=2, textByLocale={"en_GB": "iPhone", "ar_AE": "آيفون"}),
                ],
            ),
            QuestionDefinition(
                id="Q2",
                order=2,
                controlType="checkbox",
                headingByLocale={"en_GB": "Which do you like? <script>alert(1)</script>"},
                subheadingByLocale={"en_GB": "(Multiple answers)"},
                required=True,
                answers=[
                    AnswerDefinition(id="A1", order=1, textByLocale={"en_GB": '"; maliciousCode(); //'}),
                    AnswerDefinition(id="A2", order=2, textByLocale={"en_GB": "TV"}),
                ],
            ),
            QuestionDefinition(
                id="Q3",
                order=3,
                controlType="text",
                headingByLocale={"en_GB": "Any other comments?"},
                subheadingByLocale={},
                required=False,
                answers=[],
            ),
        ],
        fields=ProfileFieldSet(
            email=LocalizedFieldMeta(labelByLocale={"en_GB": "E-mail", "ar_AE": "البريد الإلكتروني"}),
            submitButton=LocalizedFieldMeta(labelByLocale={"en_GB": "Submit", "ar_AE": "إرسال"}),
        ),
        validationMessages={},
        pageError={"en_GB": PageCopy(heading="Something went wrong.")},
        thankYou={"en_GB": PageCopy(heading="Thank you for your interest")},
    )
