"""Port of packages/shared/src/form/subsidiaryData.ts.

Samsung org-specific subsidiary routing data, extracted verbatim from the
reference implementation's `country_subsidiary` / `subsidiary_detail` tables
(see subsidiary_data_raw.py, generated mechanically from the TypeScript
source's own literal object tables — not hand-transcribed).

`COUNTRY_SUBSIDIARY` maps an ISO-3166 alpha-2 country code to the Samsung
subsidiary code that serves it. `SUBSIDIARY_DETAIL` maps a subsidiary code to
the list of countries (calling code + country code + localized country name)
that its generated forms offer in the countryCode/callingCode dropdowns.
"""

from __future__ import annotations

import json
from typing import Optional, TypedDict

from .calling_codes import find_calling_code_entry
from .subsidiary_data_raw import COUNTRY_SUBSIDIARY_JSON, REFERENCE_SUBSIDIARY_DETAIL_JSON


class SubsidiaryCountryEntry(TypedDict):
    callingCode: str
    countryCode: str
    # Keyed by combined locale identifier as used in the reference (e.g. "en_AE", "ar_BH").
    countryName: dict[str, str]


COUNTRY_SUBSIDIARY: dict[str, str] = json.loads(COUNTRY_SUBSIDIARY_JSON)

# The reference source's own `subsidiary_detail` — only the 11 subsidiaries relevant
# to its MENA campaign family, extracted verbatim.
_REFERENCE_SUBSIDIARY_DETAIL: dict[str, list[SubsidiaryCountryEntry]] = json.loads(REFERENCE_SUBSIDIARY_DETAIL_JSON)

# `COUNTRY_SUBSIDIARY` references 54 distinct subsidiary codes; `_REFERENCE_SUBSIDIARY_DETAIL`
# only covers 11 of them. See the TS source's own doc comment on STUB_SUBSIDIARY_DETAIL for
# why the rest need an empty-list stub entry rather than being left undefined: the
# reference's own populateCountryCodeDropdown() indexes `subsidiary_detail[subsidiary]`
# with no guard, so an undefined entry would throw for the very common case of a country
# whose subsidiary has no MENA-campaign reference data on file.
_STUB_SUBSIDIARY_DETAIL: dict[str, list[SubsidiaryCountryEntry]] = {
    code: []
    for code in dict.fromkeys(COUNTRY_SUBSIDIARY.values())
    if code not in _REFERENCE_SUBSIDIARY_DETAIL
}

SUBSIDIARY_DETAIL: dict[str, list[SubsidiaryCountryEntry]] = {
    **_REFERENCE_SUBSIDIARY_DETAIL,
    **_STUB_SUBSIDIARY_DETAIL,
}

SUBSIDIARY_CODES: list[str] = sorted(SUBSIDIARY_DETAIL.keys())


def resolve_subsidiary_country_name(country_name: dict[str, str], locale: str, default_locale: str) -> str:
    """Resolves a subsidiary country's localized name for a generated form's locale."""
    if country_name.get(locale):
        return country_name[locale]
    lang_subtag = locale.split("_")[0]
    same_language_key = next((k for k in country_name if k.split("_")[0] == lang_subtag), None)
    if same_language_key is not None:
        return country_name[same_language_key]
    if country_name.get(default_locale):
        return country_name[default_locale]
    english_key = next((k for k in country_name if k.startswith("en_") or k == "en_GB"), None)
    if english_key is not None:
        return country_name[english_key]
    first_key = next(iter(country_name), None)
    return country_name[first_key] if first_key is not None else ""


def _find_country_translations(country_code: str) -> Optional[dict[str, str]]:
    """Every real Samsung translation on record for a given ISO-3166 country code, merged
    across every subsidiary in SUBSIDIARY_DETAIL that happens to list it."""
    merged: Optional[dict[str, str]] = None
    for entries in SUBSIDIARY_DETAIL.values():
        for entry in entries:
            if entry["countryCode"] == country_code:
                merged = {**(merged or {}), **entry["countryName"]}
    return merged


def resolve_country_name(country_code: str, locale: str, default_locale: str) -> str:
    """Resolves a display name for a country code in a given locale."""
    translations = _find_country_translations(country_code)
    if translations:
        return resolve_subsidiary_country_name(translations, locale, default_locale)
    entry = find_calling_code_entry(country_code)
    return entry.countryName if entry else country_code


def subsidiary_country_codes(subsidiary_code: str) -> list[str]:
    """The ISO-3166 country codes a given Samsung subsidiary's own generated forms offer."""
    return [e["countryCode"] for e in SUBSIDIARY_DETAIL.get(subsidiary_code, [])]
