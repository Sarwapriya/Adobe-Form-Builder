"""Port of packages/shared/src/form/localeMigration.ts.

Content migration for changing a form's locale set. Every `*ByLocale` map in
`FormDefinition` resolves via `resolve_localized_text(map, locale,
default_locale)` — `map[locale] ?? map[defaultLocale] ?? ""` — so whenever
locale codes change while text stays filed under the *old* codes, viewing the
form under the new codes would resolve to "" everywhere that text was never
separately translated. Both functions below walk the whole definition and
refile content under the new codes so the form keeps rendering the same
content it did before, just under different keys.
"""

from __future__ import annotations

from typing import Callable, Optional, TypeVar

from .definition import FormDefinition, LocaleCode, LocaleInfo, PageCopy, ValidationMessageSet

T = TypeVar("T", PageCopy, ValidationMessageSet)

TextTransform = Callable[[dict[LocaleCode, str]], dict[LocaleCode, str]]
ObjTransform = Callable[[dict[LocaleCode, T]], dict[LocaleCode, T]]


def _apply_locale_field_transform(
    form: FormDefinition,
    text: TextTransform,
    obj: ObjTransform,
) -> FormDefinition:
    """Every locale-keyed field in `FormDefinition`, rewritten via `text` (plain
    string maps) and `obj` (PageCopy/ValidationMessageSet object maps) — shared by
    migrate_default_locale (one old code -> one new code) and remap_locales_for_copy
    (a whole new locale set) so they can't drift out of sync on which fields
    actually get migrated. Pure — never mutates `form`; both callers do their own
    `meta.defaultLocale`/`locales` assignment on the object this returns."""
    next_form = form.model_copy(deep=True)

    for q in next_form.questions:
        q.headingByLocale = text(q.headingByLocale)
        q.subheadingByLocale = text(q.subheadingByLocale)
        for a in q.answers:
            a.textByLocale = text(a.textByLocale)

    f = next_form.fields
    if f.email:
        f.email.labelByLocale = text(f.email.labelByLocale)
    if f.firstName:
        f.firstName.labelByLocale = text(f.firstName.labelByLocale)
    if f.lastName:
        f.lastName.labelByLocale = text(f.lastName.labelByLocale)
    if f.countryCode:
        f.countryCode.labelByLocale = text(f.countryCode.labelByLocale)
    if f.callingCode:
        f.callingCode.labelByLocale = text(f.callingCode.labelByLocale)
        f.callingCode.dropdownFirstEntryByLocale = text(f.callingCode.dropdownFirstEntryByLocale)
    if f.mobileNumber:
        f.mobileNumber.labelByLocale = text(f.mobileNumber.labelByLocale)
        f.mobileNumber.dropdownFirstEntryByLocale = text(f.mobileNumber.dropdownFirstEntryByLocale)
    if f.privacyPolicy:
        f.privacyPolicy.textByLocale = text(f.privacyPolicy.textByLocale)
        f.privacyPolicy.linkUrlByLocale = text(f.privacyPolicy.linkUrlByLocale)
        if f.privacyPolicy.linkTextByLocale:
            f.privacyPolicy.linkTextByLocale = text(f.privacyPolicy.linkTextByLocale)
    if f.marketingOptin:
        f.marketingOptin.labelByLocale = text(f.marketingOptin.labelByLocale)
    if f.additionalConsents:
        for c in f.additionalConsents:
            c.textByLocale = text(c.textByLocale)
            if c.linkUrlByLocale:
                c.linkUrlByLocale = text(c.linkUrlByLocale)
    if f.termsAndConditions:
        f.termsAndConditions.textByLocale = text(f.termsAndConditions.textByLocale)
        f.termsAndConditions.urlByLocale = text(f.termsAndConditions.urlByLocale)
    f.submitButton.labelByLocale = text(f.submitButton.labelByLocale)
    if f.redirectAfterSuccessUrlByLocale:
        f.redirectAfterSuccessUrlByLocale = text(f.redirectAfterSuccessUrlByLocale)
    if f.headingBeforeBreakByLocale:
        f.headingBeforeBreakByLocale = text(f.headingBeforeBreakByLocale)
    if f.headingAfterBreakByLocale:
        f.headingAfterBreakByLocale = text(f.headingAfterBreakByLocale)
    if f.headingBeforeBreakFFByLocale:
        f.headingBeforeBreakFFByLocale = text(f.headingBeforeBreakFFByLocale)
    if f.headingAfterBreakFFByLocale:
        f.headingAfterBreakFFByLocale = text(f.headingAfterBreakFFByLocale)
    if f.campaignSubheadingByLocale:
        f.campaignSubheadingByLocale = text(f.campaignSubheadingByLocale)
    if f.campaignSubheadingFFByLocale:
        f.campaignSubheadingFFByLocale = text(f.campaignSubheadingFFByLocale)
    if f.requiredFieldNoteByLocale:
        f.requiredFieldNoteByLocale = text(f.requiredFieldNoteByLocale)
    if f.extraFieldsByLocale:
        next_extra: dict[str, dict[LocaleCode, str]] = {}
        for key, m in f.extraFieldsByLocale.items():
            next_extra[key] = text(m)
        f.extraFieldsByLocale = next_extra

    next_form.validationMessages = obj(next_form.validationMessages)
    next_form.pageError = obj(next_form.pageError)
    next_form.thankYou = obj(next_form.thankYou)

    return next_form


def _migrate_text_map(
    m: dict[LocaleCode, str],
    old_locale: LocaleCode,
    new_locale: LocaleCode,
    remove_old: bool,
) -> dict[LocaleCode, str]:
    next_m = dict(m)
    if next_m.get(old_locale) and not next_m.get(new_locale):
        next_m[new_locale] = next_m[old_locale]
    if remove_old:
        next_m.pop(old_locale, None)
    return next_m


def _migrate_object_map(
    m: dict[LocaleCode, T],
    old_locale: LocaleCode,
    new_locale: LocaleCode,
    remove_old: bool,
) -> dict[LocaleCode, T]:
    """Same idea as _migrate_text_map but for `dict[LocaleCode, T]` maps whose values
    are whole objects (PageCopy/ValidationMessageSet) rather than plain strings —
    merges field-by-field so a new-default entry that already has *some* fields set
    still gets backfilled for the fields it's missing, without clobbering the ones
    it already has."""
    next_m = dict(m)
    old_value = next_m.get(old_locale)
    if old_value is not None:
        existing_new = next_m.get(new_locale)
        if existing_new is not None:
            merged_data = {**old_value.model_dump(), **{k: v for k, v in existing_new.model_dump().items() if v is not None}}
            next_m[new_locale] = type(old_value)(**merged_data)
        else:
            next_m[new_locale] = old_value
    if remove_old:
        next_m.pop(old_locale, None)
    return next_m


class MigrateDefaultLocaleOptions:
    def __init__(self, remove_old_locale: bool = False) -> None:
        self.remove_old_locale = remove_old_locale


def migrate_default_locale(
    form: FormDefinition,
    new_default_locale: LocaleCode,
    options: Optional[MigrateDefaultLocaleOptions] = None,
) -> FormDefinition:
    """Returns a new `FormDefinition` with `meta.defaultLocale` set to
    `new_default_locale` and every locale-keyed field backfilled accordingly. Pure —
    never mutates `form`. A no-op (returns `form` as-is) if `new_default_locale` is
    already the default."""
    old_default_locale = form.meta.defaultLocale
    if old_default_locale == new_default_locale:
        return form
    remove_old = options.remove_old_locale if options else False

    def text(m: dict[LocaleCode, str]) -> dict[LocaleCode, str]:
        return _migrate_text_map(m, old_default_locale, new_default_locale, remove_old)

    def obj(m: dict[LocaleCode, T]) -> dict[LocaleCode, T]:
        return _migrate_object_map(m, old_default_locale, new_default_locale, remove_old)

    next_form = _apply_locale_field_transform(form, text, obj)
    next_form.meta.defaultLocale = new_default_locale
    return next_form


def remap_locales_for_copy(
    form: FormDefinition,
    new_locales: list[LocaleInfo],
    new_default_locale: LocaleCode,
) -> FormDefinition:
    """Rebuilds a `FormDefinition` for an entirely different locale set — used when
    copying a form from one subsidiary into another whose approved locales don't
    overlap the source's at all."""
    old_default_locale = form.meta.defaultLocale

    source_for: dict[LocaleCode, LocaleCode] = {}
    for target in new_locales:
        candidates = [l for l in form.locales if l.langSubtag.lower() == target.langSubtag.lower()]
        preferred = next((l for l in candidates if l.code == old_default_locale), candidates[0] if candidates else None)
        source_for[target.code] = preferred.code if preferred else old_default_locale

    def text(m: dict[LocaleCode, str]) -> dict[LocaleCode, str]:
        next_m: dict[LocaleCode, str] = {}
        for target in new_locales:
            value = m.get(source_for[target.code])
            if value is not None:
                next_m[target.code] = value
        return next_m

    def obj(m: dict[LocaleCode, T]) -> dict[LocaleCode, T]:
        next_m: dict[LocaleCode, T] = {}
        for target in new_locales:
            value = m.get(source_for[target.code])
            if value is not None:
                next_m[target.code] = value
        return next_m

    next_form = _apply_locale_field_transform(form, text, obj)
    next_form.meta.defaultLocale = new_default_locale
    next_form.locales = new_locales

    if next_form.fields.mobileNumber:
        countries_by_locale: dict[LocaleCode, list[str]] = {}
        for l in new_locales:
            parts = l.code.split("_")
            country = parts[1] if len(parts) > 1 else None
            if country:
                countries_by_locale[l.code] = [country]
        countries = list(dict.fromkeys(c for cs in countries_by_locale.values() for c in cs))
        if len(countries) > 0:
            next_form.fields.mobileNumber = next_form.fields.mobileNumber.model_copy(
                update={"countries": countries, "countriesByLocale": countries_by_locale}
            )
        else:
            next_form.fields.mobileNumber = next_form.fields.mobileNumber.model_copy(update={"countriesByLocale": None})

    return next_form
