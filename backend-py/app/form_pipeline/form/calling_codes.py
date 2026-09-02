"""Port of packages/shared/src/form/callingCodes.ts.

A small, generic ISO-3166 + calling-code table bundled with the builder. This
is the *default* countryCode/callingCode dropdown source, used whenever no
Samsung subsidiary code has been selected — see subsidiary_data.py for the
org-specific tables that take over once one is.
"""

from __future__ import annotations

from typing import NamedTuple, Optional


class CallingCodeEntry(NamedTuple):
    countryCode: str  # ISO-3166 alpha-2
    callingCode: str  # without leading "+"
    countryName: str
    mobileDigits: int  # expected local mobile-number digit count (excluding calling code)


CALLING_CODES: tuple[CallingCodeEntry, ...] = (
    CallingCodeEntry("AE", "971", "United Arab Emirates", 9),
    CallingCodeEntry("SA", "966", "Saudi Arabia", 9),
    CallingCodeEntry("EG", "20", "Egypt", 10),
    CallingCodeEntry("IL", "972", "Israel", 9),
    CallingCodeEntry("PS", "970", "Palestine", 9),
    CallingCodeEntry("TR", "90", "Turkey", 10),
    CallingCodeEntry("JO", "962", "Jordan", 9),
    CallingCodeEntry("LB", "961", "Lebanon", 8),
    CallingCodeEntry("IQ", "964", "Iraq", 10),
    CallingCodeEntry("KW", "965", "Kuwait", 8),
    CallingCodeEntry("QA", "974", "Qatar", 8),
    CallingCodeEntry("BH", "973", "Bahrain", 8),
    CallingCodeEntry("OM", "968", "Oman", 8),
    CallingCodeEntry("GB", "44", "United Kingdom", 10),
    CallingCodeEntry("US", "1", "United States", 10),
    CallingCodeEntry("FR", "33", "France", 9),
    CallingCodeEntry("DE", "49", "Germany", 10),
    CallingCodeEntry("IN", "91", "India", 10),
    CallingCodeEntry("PK", "92", "Pakistan", 10),
    CallingCodeEntry("IR", "98", "Iran", 10),
)


def find_calling_code_entry(country_code: str) -> Optional[CallingCodeEntry]:
    upper = country_code.upper()
    for entry in CALLING_CODES:
        if entry.countryCode == upper:
            return entry
    return None
