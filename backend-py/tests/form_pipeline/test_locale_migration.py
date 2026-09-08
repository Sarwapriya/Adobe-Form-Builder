"""Python port of packages/shared/tests/form/localeMigration.test.ts."""

from __future__ import annotations

from app.form_pipeline.form.definition import FormDefinition, LocaleInfo
from app.form_pipeline.form.locale_migration import (
    MigrateDefaultLocaleOptions,
    migrate_default_locale,
    remap_locales_for_copy,
)


def _base_form() -> FormDefinition:
    return FormDefinition.model_validate(
        {
            "meta": {"subsidiary": "TEST", "sourceFileName": "", "defaultLocale": "en_GB"},
            "locales": [
                {"code": "en_GB", "langSubtag": "en", "isRtl": False, "sourceColumn": "en_GB", "label": "English"},
                {"code": "ar_AE", "langSubtag": "ar", "isRtl": True, "sourceColumn": "builder", "label": "Arabic"},
            ],
            "questions": [
                {
                    "id": "Q1",
                    "order": 1,
                    "controlType": "radio",
                    "headingByLocale": {"en_GB": "Pick one"},
                    "subheadingByLocale": {"en_GB": "(single)"},
                    "required": True,
                    "answers": [{"id": "A1", "order": 1, "textByLocale": {"en_GB": "Yes"}}],
                }
            ],
            "fields": {
                "firstName": {"labelByLocale": {"en_GB": "First Name"}},
                "privacyPolicy": {"textByLocale": {"en_GB": "I agree"}, "linkUrlByLocale": {"en_GB": "https://x"}},
                "additionalConsents": [
                    {"id": "consentExtra1", "order": 1, "textByLocale": {"en_GB": "Updates"}, "linkUrlByLocale": {"en_GB": "https://y"}}
                ],
                "submitButton": {"labelByLocale": {"en_GB": "Submit"}},
                "campaignSubheadingByLocale": {"en_GB": "Campaign copy"},
            },
            "validationMessages": {"en_GB": {"requiredField": "Required"}},
            "pageError": {"en_GB": {"heading": "Error"}},
            "thankYou": {"en_GB": {"heading": "Thanks"}},
        }
    )


def test_is_a_noop_if_new_default_equals_current():
    form = _base_form()
    result = migrate_default_locale(form, "en_GB")
    assert result is form


def test_backfills_new_default_slot_leaving_old_locale_intact():
    form = _base_form()
    next_form = migrate_default_locale(form, "ar_AE")

    assert next_form.meta.defaultLocale == "ar_AE"
    assert next_form.questions[0].headingByLocale == {"en_GB": "Pick one", "ar_AE": "Pick one"}
    assert next_form.questions[0].subheadingByLocale["ar_AE"] == "(single)"
    assert next_form.questions[0].answers[0].textByLocale["ar_AE"] == "Yes"
    assert next_form.fields.firstName.labelByLocale["ar_AE"] == "First Name"
    assert next_form.fields.privacyPolicy.textByLocale["ar_AE"] == "I agree"
    assert next_form.fields.privacyPolicy.linkUrlByLocale["ar_AE"] == "https://x"
    assert next_form.fields.additionalConsents[0].textByLocale["ar_AE"] == "Updates"
    assert next_form.fields.additionalConsents[0].linkUrlByLocale["ar_AE"] == "https://y"
    assert next_form.fields.submitButton.labelByLocale["ar_AE"] == "Submit"
    assert next_form.fields.campaignSubheadingByLocale["ar_AE"] == "Campaign copy"
    assert next_form.validationMessages["ar_AE"].model_dump(exclude_none=True) == {"requiredField": "Required"}
    assert next_form.pageError["ar_AE"].model_dump(exclude_none=True) == {"heading": "Error"}
    assert next_form.thankYou["ar_AE"].model_dump(exclude_none=True) == {"heading": "Thanks"}

    # Old locale's own text is untouched — a plain reorder keeps it available.
    assert next_form.questions[0].headingByLocale["en_GB"] == "Pick one"
    assert next_form.fields.firstName.labelByLocale["en_GB"] == "First Name"


def test_never_overwrites_text_the_new_default_already_has():
    form = _base_form()
    form.fields.firstName.labelByLocale["ar_AE"] = "الاسم الأول"  # already translated
    next_form = migrate_default_locale(form, "ar_AE")
    assert next_form.fields.firstName.labelByLocale["ar_AE"] == "الاسم الأول"


def test_merges_object_maps_field_by_field():
    form = _base_form()
    form.pageError["ar_AE"] = form.pageError["en_GB"].model_copy(update={"heading": "خطأ", "subHeading": None})
    form.pageError["en_GB"] = form.pageError["en_GB"].model_copy(update={"heading": "Error", "subHeading": "Try again"})
    next_form = migrate_default_locale(form, "ar_AE")
    assert next_form.pageError["ar_AE"].model_dump(exclude_none=True) == {"heading": "خطأ", "subHeading": "Try again"}


def test_removes_old_default_entries_when_remove_old_locale_set():
    form = _base_form()
    next_form = migrate_default_locale(form, "ar_AE", MigrateDefaultLocaleOptions(remove_old_locale=True))
    assert next_form.questions[0].headingByLocale["ar_AE"] == "Pick one"
    assert "en_GB" not in next_form.questions[0].headingByLocale
    assert "en_GB" not in next_form.fields.firstName.labelByLocale
    assert "en_GB" not in next_form.validationMessages
    assert "en_GB" not in next_form.pageError
    assert "en_GB" not in next_form.thankYou


def test_is_pure_never_mutates_input():
    form = _base_form()
    snapshot = form.model_copy(deep=True)
    migrate_default_locale(form, "ar_AE", MigrateDefaultLocaleOptions(remove_old_locale=True))
    assert form == snapshot


def test_handles_optional_fields_never_set_without_introducing_empty_objects():
    form = _base_form()
    next_form = migrate_default_locale(form, "ar_AE")
    assert next_form.fields.headingBeforeBreakByLocale is None
    assert next_form.fields.mobileNumber is None


def _sesar_form() -> FormDefinition:
    """SESAR (en_SA default + ar_SA) copied into SELV (en_JO fallback, en_LB,
    ar_IQ, ku_IQ) — the exact worked example from the feature request."""
    return FormDefinition.model_validate(
        {
            "meta": {"subsidiary": "SESAR", "sourceFileName": "", "defaultLocale": "en_SA"},
            "locales": [
                # NOTE: the TS source's own test uses sourceColumn: "en_SA" here, which
                # isn't actually one of LocaleInfo's allowed literal values ("en_GB" |
                # "C" | "D" | "builder") — a pre-existing type mismatch in the TS test
                # that only "works" because vitest doesn't type-check test files at
                # runtime. sourceColumn is irrelevant to locale-migration behavior, so
                # "builder" is substituted here to satisfy Pydantic's stricter runtime
                # validation without changing what this test actually exercises.
                {"code": "en_SA", "langSubtag": "en", "isRtl": False, "sourceColumn": "builder", "label": "English"},
                {"code": "ar_SA", "langSubtag": "ar", "isRtl": True, "sourceColumn": "builder", "label": "Arabic"},
            ],
            "questions": [
                {
                    "id": "Q1",
                    "order": 1,
                    "controlType": "radio",
                    "headingByLocale": {"en_SA": "Pick one", "ar_SA": "اختر واحدا"},
                    "subheadingByLocale": {"en_SA": "(single)"},
                    "required": True,
                    "answers": [{"id": "A1", "order": 1, "textByLocale": {"en_SA": "Yes", "ar_SA": "نعم"}}],
                }
            ],
            "fields": {"submitButton": {"labelByLocale": {"en_SA": "Submit", "ar_SA": "إرسال"}}},
            "validationMessages": {},
            "pageError": {},
            "thankYou": {},
        }
    )


_SELV_LOCALES = [
    LocaleInfo(code="en_JO", langSubtag="en", isRtl=False, sourceColumn="builder", label="English"),
    LocaleInfo(code="en_LB", langSubtag="en", isRtl=False, sourceColumn="builder", label="English"),
    LocaleInfo(code="ar_IQ", langSubtag="ar", isRtl=True, sourceColumn="builder", label="Arabic"),
    LocaleInfo(code="ku_IQ", langSubtag="ku", isRtl=True, sourceColumn="builder", label="Kurdish"),
]


def test_maps_each_new_locale_from_matching_language_with_default_fallback():
    form = _sesar_form()
    next_form = remap_locales_for_copy(form, list(_SELV_LOCALES), "en_JO")

    assert next_form.meta.defaultLocale == "en_JO"
    assert next_form.locales == _SELV_LOCALES

    assert next_form.questions[0].headingByLocale["en_JO"] == "Pick one"
    assert next_form.questions[0].headingByLocale["en_LB"] == "Pick one"
    assert next_form.questions[0].headingByLocale["ar_IQ"] == "اختر واحدا"
    # ku_IQ has no Kurdish source, so it falls back to en_SA (the source's own default)
    assert next_form.questions[0].headingByLocale["ku_IQ"] == "Pick one"

    assert next_form.questions[0].answers[0].textByLocale == {
        "en_JO": "Yes",
        "en_LB": "Yes",
        "ar_IQ": "نعم",
        "ku_IQ": "Yes",
    }
    assert next_form.fields.submitButton.labelByLocale == {
        "en_JO": "Submit",
        "en_LB": "Submit",
        "ar_IQ": "إرسال",
        "ku_IQ": "Submit",
    }


def test_drops_every_old_locale_code_entirely():
    form = _sesar_form()
    next_form = remap_locales_for_copy(form, list(_SELV_LOCALES), "en_JO")
    assert "en_SA" not in next_form.questions[0].headingByLocale
    assert "ar_SA" not in next_form.questions[0].headingByLocale


def test_remap_is_pure_never_mutates_input():
    form = _sesar_form()
    snapshot = form.model_copy(deep=True)
    remap_locales_for_copy(form, list(_SELV_LOCALES), "en_JO")
    assert form == snapshot


def test_prefers_source_default_locale_when_multiple_share_language():
    form = _sesar_form()
    form.locales.append(LocaleInfo(code="en_US", langSubtag="en", isRtl=False, sourceColumn="builder", label="English (US)"))
    form.questions[0].headingByLocale["en_US"] = "Pick one (US)"
    next_form = remap_locales_for_copy(form, list(_SELV_LOCALES), "en_JO")
    # en_SA is the source's default, so it wins over en_US even though both are English.
    assert next_form.questions[0].headingByLocale["en_JO"] == "Pick one"


def test_rederives_mobile_number_countries_from_new_locale_set():
    form = _sesar_form()
    form.fields.mobileNumber = {
        "labelByLocale": {"en_SA": "Mobile"},
        "dropdownFirstEntryByLocale": {},
        "countries": ["SA"],
        "countriesByLocale": {"en_SA": ["SA"]},
    }
    next_form = remap_locales_for_copy(form, list(_SELV_LOCALES), "en_JO")
    # SELV_LOCALES' own country suffixes: en_JO -> JO, en_LB -> LB, ar_IQ/ku_IQ -> IQ (deduped).
    assert next_form.fields.mobileNumber.countries == ["JO", "LB", "IQ"]
    assert next_form.fields.mobileNumber.countriesByLocale == {
        "en_JO": ["JO"],
        "en_LB": ["LB"],
        "ar_IQ": ["IQ"],
        "ku_IQ": ["IQ"],
    }


def test_leaves_mobile_number_untouched_when_not_set():
    form = _sesar_form()
    next_form = remap_locales_for_copy(form, list(_SELV_LOCALES), "en_JO")
    assert next_form.fields.mobileNumber is None
