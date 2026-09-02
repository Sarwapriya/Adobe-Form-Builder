"""Port of packages/shared/src/form/langNames.ts."""

from __future__ import annotations

from .definition import LangSubtag

# Language subtags that render right-to-left. The reference implementation has no
# RTL handling at all (only ever sets `lang`, never `dir`) — this list is new logic.
RTL_LANGS: tuple[LangSubtag, ...] = ("ar", "he", "ku", "fa", "ur", "yi")


def is_rtl_lang_subtag(lang_subtag: LangSubtag) -> bool:
    return lang_subtag.lower() in RTL_LANGS


_DISPLAY_NAMES: dict[LangSubtag, str] = {
    "en": "English",
    "ar": "Arabic",
    "he": "Hebrew",
    "ku": "Kurdish",
    "tr": "Turkish",
    "fa": "Persian",
    "ur": "Urdu",
    "yi": "Yiddish",
    "fr": "French",
    "es": "Spanish",
    "de": "German",
    "ru": "Russian",
    "zh": "Chinese",
}


def lang_display_name(lang_subtag: LangSubtag) -> str:
    """Best-effort display name for a language subtag; falls back to the subtag itself
    (upper-cased) so an unrecognized language still gets a usable label instead of
    silently being dropped from the builder UI's language selector."""
    return _DISPLAY_NAMES.get(lang_subtag.lower(), lang_subtag.upper())
